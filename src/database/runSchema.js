import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import '../config/loadEnv.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

function requirePassword() {
  const pwd = process.env.PGPASSWORD;
  const dbUrl = process.env.DATABASE_URL?.trim();
  const hasUrl =
    dbUrl &&
    !dbUrl.includes('username:password') &&
    !dbUrl.includes('your_password') &&
    !dbUrl.includes('YOUR_PASSWORD');

  if (hasUrl) return;

  if (
    pwd == null ||
    String(pwd).trim() === '' ||
    String(pwd).includes('REPLACE_WITH')
  ) {
    console.error('\n❌ PostgreSQL password is missing in backend/.env\n');
    console.error('Add your Postgres password (same as pgAdmin):');
    console.error('  PGPASSWORD=your_actual_password   (not REPLACE_WITH_YOUR_PASSWORD)');
    console.error('  PGDATABASE=eddva_edtech');
    console.error('\nCreate the database in pgAdmin if needed:');
    console.error('  CREATE DATABASE eddva_edtech;');
    process.exit(1);
  }
}

async function run() {
  requirePassword();

  const { default: pool } = await import('../config/db.js');

  const sqlPath = path.join(__dirname, 'schema', 'init.sql');
  const sql = fs.readFileSync(sqlPath, 'utf8');
  console.log('Applying schema from init.sql...');
  console.log(`Database: ${process.env.PGDATABASE || 'eddva_edtech'}`);

  await pool.query(sql);
  console.log('Schema applied successfully.');
  await pool.end();
}

run().catch((err) => {
  console.error('Schema failed:', err.message);
  if (err.message.includes('authentication') || err.message.includes('password')) {
    console.error('\nCheck PGPASSWORD in backend/.env matches your PostgreSQL user password.');
  }
  process.exit(1);
});
