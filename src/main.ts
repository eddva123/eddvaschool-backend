import 'reflect-metadata';
import { NestFactory, Reflector } from '@nestjs/core';
import { NestExpressApplication } from '@nestjs/platform-express';
import { ValidationPipe, VersioningType, Logger, BadRequestException } from '@nestjs/common';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { ConfigService } from '@nestjs/config';
import { join } from 'path';
import { mkdirSync } from 'fs';
import helmet from 'helmet';
import compression from 'compression';
import { AppModule } from './app.module';

async function bootstrap() {
  const logger = new Logger('Bootstrap');
  const app = await NestFactory.create<NestExpressApplication>(AppModule, {
    logger: ['error', 'warn', 'log', 'debug', 'verbose'],
  });

  // ── Stabilization Pass: Legacy Data Backfill ───────────────────────────────
  try {
    const { DataSource } = require('typeorm');
    const dataSource = app.get(DataSource);
    
    logger.log('Running legacy multitenant data backfill check...');
    
    // Find a default tenant if one exists
    const defaultTenant = await dataSource.query(`SELECT id FROM tenants ORDER BY created_at ASC LIMIT 1`);
    
    if (defaultTenant && defaultTenant.length > 0) {
      const fallbackTenantId = defaultTenant[0].id;
      
      // Patch users
      const usersResult = await dataSource.query(`UPDATE users SET tenant_id = $1 WHERE tenant_id IS NULL`, [fallbackTenantId]);
      if (usersResult[1] > 0) {
        logger.warn(`Backfilled ${usersResult[1]} legacy users with fallback tenant_id: ${fallbackTenantId}`);
      }

      // Patch other core legacy entities if needed (example: assignments)
      const assignmentsResult = await dataSource.query(`UPDATE assignments SET tenant_id = $1 WHERE tenant_id IS NULL`, [fallbackTenantId]);
      if (assignmentsResult[1] > 0) {
        logger.warn(`Backfilled ${assignmentsResult[1]} legacy assignments with fallback tenant_id: ${fallbackTenantId}`);
      }
    } else {
      // Check if there are orphans without any tenant existing
      const orphanUsers = await dataSource.query(`SELECT COUNT(*) FROM users WHERE tenant_id IS NULL`);
      if (orphanUsers[0].count > 0) {
        logger.warn(`Found ${orphanUsers[0].count} orphan users with NULL tenant_id, but no fallback tenant exists yet!`);
      }
    }
  } catch (err) {
    logger.error('Failed to run legacy data backfill routine (non-fatal)', err);
  }


  // ── Static file serving for uploads ───────────────────────────────────────
  mkdirSync(join(__dirname, '..', 'uploads', 'avatars'), { recursive: true });
  mkdirSync(join(__dirname, '..', 'uploads', 'videos'), { recursive: true });
  mkdirSync(join(__dirname, '..', 'uploads', 'thumbnails'), { recursive: true });
  app.useStaticAssets(join(__dirname, '..', 'uploads'), { prefix: '/uploads' });

  const cfg = app.get(ConfigService);

  // ── Security headers ──────────────────────────────────────────────────────
  app.use(helmet());

  // ── Gzip compression ─────────────────────────────────────────────────────
  app.use(compression());

  // ── Body size limit for video uploads ────────────────────────────────────
  app.use(require('express').json({ limit: '10mb' }));
  app.use(require('express').urlencoded({ limit: '10mb', extended: true }));

  // ── CORS ──────────────────────────────────────────────────────────────────
  const isDev = cfg.get<string>('app.nodeEnv') !== 'production';
  const explicitOrigins = (process.env.CORS_ORIGINS || '')
    .split(',').map((s) => s.trim()).filter(Boolean);

  app.enableCors({
    origin: isDev
      ? true
      : (origin, callback) => {
          // No origin = server-to-server / same-origin — always allow
          if (!origin) return callback(null, true);
          // Any subdomain of eddva.in (http or https)
          if (/^https?:\/\/([\w-]+\.)?eddva\.in(:\d+)?$/.test(origin)) {
            return callback(null, true);
          }
          // Explicit allow-list from CORS_ORIGINS env var
          if (explicitOrigins.includes(origin)) return callback(null, true);
          callback(new Error(`CORS: origin not allowed — ${origin}`), false);
        },
    credentials: true,
    methods: ['GET', 'POST', 'PATCH', 'PUT', 'DELETE', 'OPTIONS'],
  });

  // ── Global prefix ─────────────────────────────────────────────────────────
  const apiPrefix = cfg.get<string>('app.apiPrefix') || 'api/v1';
  app.setGlobalPrefix(apiPrefix);

  // ── Validation ────────────────────────────────────────────────────────────
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,          // Strip unknown properties
      forbidNonWhitelisted: true,
      transform: true,           // Auto-transform primitives (string → number etc.)
      transformOptions: { enableImplicitConversion: true },
      exceptionFactory: (errors) => {
        logger.error('[DEBUG AUTH DTO] Validation failed:', JSON.stringify(errors.map(e => ({ property: e.property, constraints: e.constraints, value: e.value })), null, 2));
        return new BadRequestException(errors);
      },
    }),
  );

  // ── Swagger API Docs ──────────────────────────────────────────────────────
  if (cfg.get<string>('app.nodeEnv') !== 'production') {
    const swaggerConfig = new DocumentBuilder()
      .setTitle('APEXIQ API')
      .setDescription(
        'APEXIQ — JEE/NEET Battle Learning Platform\n\n' +
        '**Auth:** Use `POST /auth/otp/send` → `POST /auth/otp/verify` to get access token.\n' +
        'In dev mode, OTP is always `123456`.',
      )
      .setVersion('1.0')
      .addBearerAuth()
      .addTag('Auth', 'OTP login, JWT, onboarding')
      .addTag('Student', 'Dashboard, weak topics, streak')
      .addTag('Battle', 'Battle arena, ELO, matchmaking')
      .addTag('Assessment', 'Mock tests, chapter tests, results')
      .addTag('Content', 'Lectures, questions, notes')
      .addTag('Analytics', 'Leaderboard, rank prediction, performance')
      .addTag('Notification', 'Push, WhatsApp, SMS notifications')
      .addTag('AI', 'All 12 AI service endpoints via bridge')
      .addTag('Teacher - Dashboard', 'Teacher dashboard overview and stats')
      .addTag('Teacher - Attendance', 'Track and mark student attendance')
      .addTag('Teacher - Assignments', 'Create and grade assignments')
      .addTag('Teacher - Announcements', 'View and send announcements')
      .addTag('Teacher - Assessments', 'Create assessments, leaderboard, and analytics')
      .addTag('Teacher - Live Classes', 'Schedule and track live classes')
      .addTag('Teacher - Creator Studio', 'Create topics, chapters, and upload materials')
      .addTag('Teacher - Analytics', 'Detailed metrics and performance trends')
      .build();

    const document = SwaggerModule.createDocument(app, swaggerConfig);
    SwaggerModule.setup('docs', app, document, {
      swaggerOptions: {
        persistAuthorization: true,
        tagsSorter: 'alpha',
      },
    });
    logger.log(`Swagger docs available at: http://localhost:${cfg.get('app.port')}/docs`);
  }

  const port = cfg.get<number>('app.port') || 3000;
  await app.listen(port, '0.0.0.0');

  logger.log(`🚀 APEXIQ API running on: http://localhost:${port}/${apiPrefix}`);
  logger.log(`📡 WebSocket (Battle Arena): ws://localhost:${port}/battle`);
  logger.log(`🌍 Environment: ${cfg.get('app.nodeEnv')}`);
}

bootstrap();
