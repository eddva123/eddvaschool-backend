const { Client } = require('pg');

async function main() {
  const client = new Client({
    host: 'localhost',
    port: 5432,
    user: 'postgres',
    password: 'Pratap@2003',
    database: 'postgres',
  });

  try {
    await client.connect();
    console.log('Connected to PostgreSQL successfully with password "Pratap@2003"!');
    
    // Create 'apexiq' database if it doesn't exist
    const res = await client.query("SELECT 1 FROM pg_database WHERE datname='apexiq'");
    if (res.rowCount === 0) {
      console.log("Database 'apexiq' does not exist. Creating...");
      await client.query("CREATE DATABASE apexiq");
      console.log("Database 'apexiq' created successfully.");
    } else {
      console.log("Database 'apexiq' already exists.");
    }
  } catch (err) {
    console.error('Error connecting or creating database:', err);
    process.exit(1);
  } finally {
    await client.end();
  }
}

main();

