const { Client } = require('pg');

const client = new Client({
  connectionString: 'postgresql://postgres.mrirhbcfxpcmcnvrzfld:itEVbOANeXg71Gcw@aws-1-ap-southeast-1.pooler.supabase.com:5432/postgres',
  ssl: {
    rejectUnauthorized: false
  }
});

async function run() {
  await client.connect();
  let res = await client.query(`SELECT id, name FROM tenants LIMIT 5;`);
  console.log('Records in "tenants":');
  console.log(res.rows);

  res = await client.query(`SELECT id, name FROM institutes LIMIT 5;`);
  console.log('Records in "institutes":');
  console.log(res.rows);

  res = await client.query(`SELECT id, full_name, email, institute_id FROM users LIMIT 5;`);
  console.log('Records in "users":');
  console.log(res.rows);

  await client.end();
}

run().catch(console.error);
