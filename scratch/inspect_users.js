const { Client } = require('pg');

const client = new Client({
  connectionString: 'postgresql://postgres.mrirhbcfxpcmcnvrzfld:itEVbOANeXg71Gcw@aws-1-ap-southeast-1.pooler.supabase.com:5432/postgres',
  ssl: {
    rejectUnauthorized: false
  }
});

async function run() {
  await client.connect();
  const res = await client.query(`
    SELECT column_name
    FROM information_schema.columns 
    WHERE table_name = 'users';
  `);
  console.log('Columns in "users" table:');
  console.log(res.rows.map(r => r.column_name));

  const sample = await client.query(`
    SELECT id, email, role, phone, name, institute_id
    FROM users 
    LIMIT 3;
  `);
  console.log('Sample rows in "users":');
  console.log(sample.rows);

  await client.end();
}

run().catch(console.error);
