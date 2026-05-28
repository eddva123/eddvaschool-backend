import { Injectable, Inject, Logger } from '@nestjs/common';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { Cache } from 'cache-manager';

@Injectable()
export class TeacherCacheService {
  private readonly logger = new Logger(TeacherCacheService.name);

  constructor(
    @Inject(CACHE_MANAGER) private readonly cacheManager: Cache,
  ) {}

  /**
   * Helper to format tenant-scoped cache key
   */
  formatKey(tenantId: string, moduleName: string, resource: string): string {
    const safeTenant = tenantId || 'global';
    return `teacher:${safeTenant}:${moduleName}:${resource}`;
  }

  /**
   * Safely get a value from cache
   */
  async get<T>(key: string): Promise<T | null> {
    try {
      const val = await this.cacheManager.get<T>(key);
      return val || null;
    } catch (err: any) {
      this.logger.warn(`Redis Cache Get Failed for key: ${key}. Error: ${err?.message}`);
      return null;
    }
  }

  /**
   * Safely set a value in cache
   */
  async set<T>(key: string, value: T, ttlMs: number): Promise<void> {
    try {
      await this.cacheManager.set(key, value, ttlMs);
    } catch (err: any) {
      this.logger.warn(`Redis Cache Set Failed for key: ${key}. Error: ${err?.message}`);
    }
  }

  /**
   * Safely delete a key
   */
  async invalidate(key: string): Promise<void> {
    try {
      await this.cacheManager.del(key);
    } catch (err: any) {
      this.logger.warn(`Redis Cache Delete Failed for key: ${key}. Error: ${err?.message}`);
    }
  }

  /**
   * Safely delete keys matching a pattern.
   * If the cache manager store has a 'keys' method (like redis), we can find and del.
   * Otherwise, we handle gracefully.
   */
  async invalidatePattern(pattern: string): Promise<void> {
    try {
      const store = this.cacheManager.store as any;
      if (store && typeof store.keys === 'function') {
        const keys = await store.keys(pattern);
        if (Array.isArray(keys) && keys.length > 0) {
          await Promise.all(keys.map(k => this.cacheManager.del(k)));
          this.logger.log(`Invalidated ${keys.length} keys matching pattern: ${pattern}`);
        }
      } else {
        this.logger.warn(`invalidatePattern called but cache store does not support 'keys' query.`);
      }
    } catch (err: any) {
      this.logger.warn(`Redis Cache Pattern Invalidation Failed for pattern: ${pattern}. Error: ${err?.message}`);
    }
  }
}
