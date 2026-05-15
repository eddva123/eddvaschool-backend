import bcrypt from 'bcryptjs';
import '../../config/loadEnv.js';

function requirePassword() {
  const pwd = process.env.PGPASSWORD;
  const dbUrl = process.env.DATABASE_URL?.trim();
  const hasUrl =
    dbUrl &&
    !dbUrl.includes('username:password') &&
    !dbUrl.includes('your_password');

  if (!hasUrl && (pwd == null || String(pwd).trim() === '')) {
    console.error('Set PGPASSWORD in backend/.env before running db:seed');
    process.exit(1);
  }
}

async function seed() {
  requirePassword();

  const { query } = await import('../../config/db.js');
  const { default: pool } = await import('../../config/db.js');

  console.log('Seeding database...');

  const password = await bcrypt.hash('admin123', 10);

  const existing = await query(`SELECT id FROM users WHERE LOWER(email) = 'admin@gmail.com'`);
  if (!existing.rows.length) {
    await query(
      `INSERT INTO users (name, email, password, role, is_active)
       VALUES ('Super Admin', 'admin@gmail.com', $1, 'SUPER_ADMIN', TRUE)`,
      [password]
    );
    console.log('Created Super Admin: admin@gmail.com / admin123');
  } else {
    console.log('Super Admin already exists');
  }

  const instCheck = await query(`SELECT id FROM institutes LIMIT 1`);
  if (!instCheck.rows.length) {
    const inst = await query(
      `INSERT INTO institutes (name, email, status, tenant_domain, city)
       VALUES ('Demo School', 'demo@school.edu', 'ACTIVE', 'demo-school', 'Mumbai')
       RETURNING id`
    );
    const instituteId = inst.rows[0].id;

    await query(
      `INSERT INTO users (institute_id, name, email, password, role, is_active)
       VALUES ($1, 'Institute Admin', 'admin@demo-school.edu', $2, 'INSTITUTE_ADMIN', TRUE)`,
      [instituteId, password]
    );

    const subMath = await query(
      `INSERT INTO subjects (institute_id, name, code) VALUES ($1, 'Mathematics', 'MATH') RETURNING id`,
      [instituteId]
    );

    const cls = await query(
      `INSERT INTO classes (institute_id, name, level) VALUES ($1, 'Grade 10', 10) RETURNING id`,
      [instituteId]
    );

    await query(
      `INSERT INTO topics (institute_id, subject_id, class_id, name, status)
       VALUES ($1, $2, $3, 'Algebra Fundamentals', 'active') RETURNING id`,
      [instituteId, subMath.rows[0].id, cls.rows[0].id]
    );

    console.log('Created demo institute with sample curriculum');
  }

  console.log('Seed complete.');
  await pool.end();
}

seed().catch((err) => {
  console.error(err.message);
  process.exit(1);
});
