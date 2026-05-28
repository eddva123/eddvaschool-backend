const { Client } = require('pg');
require('dotenv').config();

async function checkTable(client, tableName) {
  const res = await client.query(`
    SELECT column_name, data_type 
    FROM information_schema.columns 
    WHERE table_name = $1;
  `, [tableName]);
  console.log(`\n=== Columns in table: ${tableName} ===`);
  console.log(res.rows);
}

async function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function run() {
  const client = new Client({
    host: process.env.DB_HOST,
    port: process.env.DB_PORT,
    user: process.env.DB_USERNAME,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    ssl: { rejectUnauthorized: false }
  });

  let connected = false;
  let retries = 15;
  while (!connected && retries > 0) {
    try {
      await client.connect();
      connected = true;
      console.log('Connected to DB successfully');
    } catch (err) {
      console.log(`Connection failed: ${err.message}. Retrying... (${retries} left)`);
      retries--;
      await sleep(2000);
    }
  }

  if (!connected) {
    console.error('Failed to connect after all retries.');
    return;
  }

  try {
    await checkTable(client, 'study_materials');
    await checkTable(client, 'subjects');
    await checkTable(client, 'chapters');
    await checkTable(client, 'topics');
    await checkTable(client, 'notifications');
    await checkTable(client, 'users');

  } catch (err) {
    console.error('Error during queries:', err);
  } finally {
    await client.end();
  }
}

run();

