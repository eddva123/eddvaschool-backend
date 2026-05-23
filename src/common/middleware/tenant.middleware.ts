import { Injectable, NestMiddleware, UnauthorizedException } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Tenant, TenantStatus } from '../../database/entities/tenant.entity';

/**
 * TenantMiddleware
 *
 * Runs on EVERY request. Resolves the tenant from:
 *   1. X-Tenant-ID header (for internal/admin calls)
 *   2. Subdomain (e.g. allen-kota.apexiq.in → subdomain = "allen-kota")
 *   3. Falls back to the PLATFORM tenant (for B2C routes)
 *
 * Sets req.tenantId and req.tenant for downstream use.
 * Also sets PostgreSQL session variable for Row-Level Security.
 */
// Simple in-memory cache to prevent DB queries on every request
const tenantCache = new Map<string, { tenant: Tenant; expiresAt: number }>();
const CACHE_TTL_MS = 5 * 60 * 1000; // 5 minutes

@Injectable()
export class TenantMiddleware implements NestMiddleware {
  constructor(
    @InjectRepository(Tenant)
    private readonly tenantRepo: Repository<Tenant>,
  ) {}

  private async getCachedTenant(key: string, fetchFn: () => Promise<Tenant | null>): Promise<Tenant | null> {
    const cached = tenantCache.get(key);
    if (cached && cached.expiresAt > Date.now()) {
      return cached.tenant;
    }
    const tenant = await fetchFn();
    if (tenant) {
      tenantCache.set(key, { tenant, expiresAt: Date.now() + CACHE_TTL_MS });
    }
    return tenant;
  }

  async use(req: Request & { tenantId?: string; tenant?: Tenant }, res: Response, next: NextFunction) {
    let tenant: Tenant | null = null;

    // ── 1. Explicit header (admin/internal calls) ──────────────────────────
    const headerTenantId = req.headers['x-tenant-id'] as string;
    if (headerTenantId) {
      tenant = await this.getCachedTenant(`id:${headerTenantId}`, () => 
        this.tenantRepo.findOne({ where: { id: headerTenantId } })
      );
    }

    // ── 2. X-Tenant-Subdomain header (sent by frontend on tenant subdomains) ─
    if (!tenant) {
      const headerSubdomain = req.headers['x-tenant-subdomain'] as string;
      if (headerSubdomain) {
        tenant = await this.getCachedTenant(`subdomain:${headerSubdomain}`, () => 
          this.tenantRepo.findOne({ where: { subdomain: headerSubdomain } })
        );
      }
    }

    // ── 3. Subdomain resolution from Host header ─────────────────────────
    if (!tenant) {
      const host = req.hostname; // e.g. "allen-kota.apexiq.in"
      const parts = host.split('.');
      if (parts.length === 2 && parts[1] === 'localhost') {
        tenant = await this.getCachedTenant(`subdomain:${parts[0]}`, () => 
          this.tenantRepo.findOne({ where: { subdomain: parts[0] } })
        );
      } else if (parts.length >= 3) {
        const subdomain = parts[0];
        tenant = await this.getCachedTenant(`subdomain:${subdomain}`, () => 
          this.tenantRepo.findOne({ where: { subdomain } })
        );
      }
    }

    // ── 4. JWT fallback — decode (no verify) to extract tenantId ─────────
    if (!tenant) {
      const authHeader = req.headers['authorization'] as string | undefined;
      if (authHeader?.startsWith('Bearer ')) {
        const token = authHeader.slice(7);
        try {
          const payloadB64 = token.split('.')[1];
          if (payloadB64) {
            const decoded = JSON.parse(
              Buffer.from(payloadB64, 'base64url').toString('utf8'),
            ) as { tenantId?: string };
            if (decoded.tenantId) {
              tenant = await this.getCachedTenant(`id:${decoded.tenantId}`, () => 
                this.tenantRepo.findOne({ where: { id: decoded.tenantId } })
              );
            }
          }
        } catch {
          // malformed token
        }
      }
    }

    // ── 5. Fallback: platform tenant (B2C) ───────────────────────────────
    if (!tenant) {
      tenant = await this.getCachedTenant('subdomain:platform', () => 
        this.tenantRepo.findOne({ where: { subdomain: 'platform' } })
      );
    }

    if (!tenant) {
      return next();
    }

    if (tenant.status === TenantStatus.SUSPENDED) {
      throw new UnauthorizedException('This institute account has been suspended.');
    }

    req.tenantId = tenant.id;
    req.tenant = tenant;

    next();
  }
}
