const { Client } = require('pg');

const client = new Client({
  connectionString: 'postgresql://postgres.mrirhbcfxpcmcnvrzfld:itEVbOANeXg71Gcw@aws-1-ap-southeast-1.pooler.supabase.com:5432/postgres',
  ssl: {
    rejectUnauthorized: false
  }
});

async function run() {
  await client.connect();
  let res = await client.query(`
    SELECT column_name, data_type 
    FROM information_schema.columns 
    WHERE table_name = 'tenants' AND table_schema = 'public';
  `);
  console.log('Columns in "tenants" table:');
  console.log(res.rows);

  res = await client.query(`
    SELECT column_name, data_type 
    FROM information_schema.columns 
    WHERE table_name = 'institutes' AND table_schema = 'public';
  `);
  console.log('Columns in "institutes" table:');
  console.log(res.rows);

  await client.end();
}

run().catch(console.error);
