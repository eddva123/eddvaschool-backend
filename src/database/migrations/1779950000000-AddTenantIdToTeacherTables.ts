import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddTenantIdToTeacherTables1779950000000 implements MigrationInterface {
  name = 'AddTenantIdToTeacherTables1779950000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Add columns if they don't exist
    await queryRunner.query(`ALTER TABLE "teacher_profiles" ADD COLUMN IF NOT EXISTS "tenant_id" uuid`);
    await queryRunner.query(`ALTER TABLE "teacher_data_stores" ADD COLUMN IF NOT EXISTS "tenant_id" uuid`);
    await queryRunner.query(`ALTER TABLE "teacher_assessments" ADD COLUMN IF NOT EXISTS "tenant_id" uuid`);
    await queryRunner.query(`ALTER TABLE "teacher_assessment_sections" ADD COLUMN IF NOT EXISTS "tenant_id" uuid`);
    await queryRunner.query(`ALTER TABLE "teacher_assessment_results" ADD COLUMN IF NOT EXISTS "tenant_id" uuid`);
    await queryRunner.query(`ALTER TABLE "teacher_assessment_questions" ADD COLUMN IF NOT EXISTS "tenant_id" uuid`);
    await queryRunner.query(`ALTER TABLE "teacher_assessment_attempts" ADD COLUMN IF NOT EXISTS "tenant_id" uuid`);
    await queryRunner.query(`ALTER TABLE "teacher_assessment_answers" ADD COLUMN IF NOT EXISTS "tenant_id" uuid`);

    // Add indexes for performance (IF NOT EXISTS requires PostgreSQL 9.5+)
    await queryRunner.query(`CREATE INDEX IF NOT EXISTS "IDX_teacher_profiles_tenant_id" ON "teacher_profiles" ("tenant_id")`);
    await queryRunner.query(`CREATE INDEX IF NOT EXISTS "IDX_teacher_data_stores_tenant_id" ON "teacher_data_stores" ("tenant_id")`);
    await queryRunner.query(`CREATE INDEX IF NOT EXISTS "IDX_teacher_data_stores_tenant_category" ON "teacher_data_stores" ("tenant_id", "category")`);
    await queryRunner.query(`CREATE INDEX IF NOT EXISTS "IDX_teacher_assessments_tenant_id" ON "teacher_assessments" ("tenant_id")`);
    await queryRunner.query(`CREATE INDEX IF NOT EXISTS "IDX_teacher_assessments_tenant_teacher" ON "teacher_assessments" ("tenant_id", "teacher_id")`);
    await queryRunner.query(`CREATE INDEX IF NOT EXISTS "IDX_teacher_assessment_results_tenant_id" ON "teacher_assessment_results" ("tenant_id")`);
    await queryRunner.query(`CREATE INDEX IF NOT EXISTS "IDX_ta_questions_tenant_assessment" ON "teacher_assessment_questions" ("tenant_id", "assessment_id")`);
    await queryRunner.query(`CREATE INDEX IF NOT EXISTS "IDX_ta_attempts_tenant_assessment" ON "teacher_assessment_attempts" ("tenant_id", "assessment_id")`);
    await queryRunner.query(`CREATE INDEX IF NOT EXISTS "IDX_ta_answers_tenant_attempt" ON "teacher_assessment_answers" ("tenant_id", "attempt_id")`);

    // We skip adding explicit foreign key constraints in the migration to avoid locking issues on large tables 
    // and because TypeORM sometimes handles it implicitly, but if required we can add them:
    try {
      await queryRunner.query(`ALTER TABLE "teacher_profiles" ADD CONSTRAINT "FK_teacher_profiles_tenant" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE CASCADE`);
      await queryRunner.query(`ALTER TABLE "teacher_data_stores" ADD CONSTRAINT "FK_teacher_data_stores_tenant" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE CASCADE`);
      await queryRunner.query(`ALTER TABLE "teacher_assessments" ADD CONSTRAINT "FK_teacher_assessments_tenant" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE CASCADE`);
      await queryRunner.query(`ALTER TABLE "teacher_assessment_sections" ADD CONSTRAINT "FK_teacher_assessment_sections_tenant" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE CASCADE`);
    } catch (e) {
      // Foreign keys might already exist or tenant table might not exist in this schema setup
      console.log('Foreign key addition skipped or failed: ', e.message);
    }
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "teacher_profiles" DROP COLUMN IF EXISTS "tenant_id"`);
    await queryRunner.query(`ALTER TABLE "teacher_data_stores" DROP COLUMN IF EXISTS "tenant_id"`);
    await queryRunner.query(`ALTER TABLE "teacher_assessments" DROP COLUMN IF EXISTS "tenant_id"`);
    await queryRunner.query(`ALTER TABLE "teacher_assessment_sections" DROP COLUMN IF EXISTS "tenant_id"`);
    await queryRunner.query(`ALTER TABLE "teacher_assessment_results" DROP COLUMN IF EXISTS "tenant_id"`);
    await queryRunner.query(`ALTER TABLE "teacher_assessment_questions" DROP COLUMN IF EXISTS "tenant_id"`);
    await queryRunner.query(`ALTER TABLE "teacher_assessment_attempts" DROP COLUMN IF EXISTS "tenant_id"`);
    await queryRunner.query(`ALTER TABLE "teacher_assessment_answers" DROP COLUMN IF EXISTS "tenant_id"`);
  }
}
