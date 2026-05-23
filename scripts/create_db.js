const { Client } = require('pg');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config({ path: path.resolve(__dirname, '..', '.env') });

async function ensureDb() {
  const config = {
    user: process.env.DB_USERNAME || 'postgres',
    host: process.env.DB_HOST || 'localhost',
    password: process.env.DB_PASSWORD || 'postgres',
    port: parseInt(process.env.DB_PORT || '5432', 10),
    database: 'postgres',
  };

  const client = new Client(config);
  try {
    await client.connect();
    const dbName = process.env.DB_NAME || 'apexiq';
    const res = await client.query("SELECT 1 FROM pg_database WHERE datname=$1", [dbName]);
    if (res.rowCount === 0) {
      console.log(`Database ${dbName} not found. Creating...`);
      await client.query(`CREATE DATABASE "${dbName}"`);
      console.log(`Database ${dbName} created.`);
    } else {
      console.log(`Database ${dbName} already exists.`);
    }
  } catch (err) {
    console.error('Error ensuring database:', err.message || err);
    process.exit(1);
  } finally {
    await client.end();
  }
}

ensureDb();
