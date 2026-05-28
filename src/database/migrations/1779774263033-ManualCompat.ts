import { MigrationInterface, QueryRunner } from "typeorm";

export class ManualCompat1779774263033 implements MigrationInterface {

    public async up(queryRunner: QueryRunner): Promise<void> {
        // Users Table
        await queryRunner.query(`ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "deleted_at" timestamp`);
        await queryRunner.query(`ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "tenant_id" uuid`);
        await queryRunner.query(`ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "phone_number" character varying`);
        await queryRunner.query(`ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "email_verified" boolean DEFAULT false`);
        await queryRunner.query(`ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "phone_verified" boolean DEFAULT false`);
        await queryRunner.query(`ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "is_first_login" boolean DEFAULT true`);
        await queryRunner.query(`ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "last_login_at" timestamp with time zone`);
        await queryRunner.query(`ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "refresh_token" character varying`);
        await queryRunner.query(`ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "notification_prefs" jsonb DEFAULT '{"push": true, "whatsapp": true, "email": false, "sms": false}'`);
        await queryRunner.query(`ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "fcm_token" character varying`);
        await queryRunner.query(`ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "profile_picture_url" character varying`);
        await queryRunner.query(`ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "full_name" character varying`);
        
        // Base entity timestamps across legacy tables
        const legacyTables = ['users', 'students', 'teacher_profiles', 'tenants', 'assignments', 'attendance_sessions', 'batches'];
        for (const table of legacyTables) {
            // Check if table exists to avoid aborting the transaction
            const tableExists = await queryRunner.query(`SELECT EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = '${table}')`);
            if (tableExists[0].exists) {
                await queryRunner.query(`ALTER TABLE "${table}" ADD COLUMN IF NOT EXISTS "deleted_at" timestamp`);
                await queryRunner.query(`ALTER TABLE "${table}" ADD COLUMN IF NOT EXISTS "created_at" timestamp DEFAULT now()`);
                await queryRunner.query(`ALTER TABLE "${table}" ADD COLUMN IF NOT EXISTS "updated_at" timestamp DEFAULT now()`);
            }
        }
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        // Safe migration: no destructive down operations for legacy data
    }

}
