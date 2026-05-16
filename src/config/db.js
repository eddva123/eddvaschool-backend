import pg from 'pg';
import './loadEnv.js';

const { Pool } = pg;

function buildPoolConfig() {
  const {
    DATABASE_URL,
    PGHOST = 'localhost',
    PGPORT = '5432',
    PGUSER = 'postgres',
    PGPASSWORD = '',
    PGDATABASE = 'eddva_edtech',
    PGSSLMODE,
  } = process.env;

  const dbUrl = DATABASE_URL?.trim();
  const isPlaceholderUrl =
    dbUrl &&
    (dbUrl.includes('username:password') ||
      dbUrl.includes('your_password') ||
      dbUrl.includes('YOUR_PASSWORD') ||
      dbUrl.includes('REPLACE_WITH'));

  if (dbUrl && !isPlaceholderUrl) {
    return { connectionString: dbUrl };
  }

  const config = {
    host: PGHOST,
    port: Number(PGPORT) || 5432,
    user: PGUSER,
    database: PGDATABASE,
  };

  const password = PGPASSWORD == null ? '' : String(PGPASSWORD).trim();
  if (password) {
    config.password = password;
  }

  if (PGSSLMODE?.toLowerCase() === 'require') {
    config.ssl = { rejectUnauthorized: false };
  }

  return config;
}

const pool = new Pool(buildPoolConfig());

pool.on('error', (err) => {
  console.error('PostgreSQL pool error:', err);
});

export const query = (text, params) => pool.query(text, params);
export default pool;
