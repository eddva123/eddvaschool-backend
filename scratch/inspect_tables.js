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
    SELECT table_name 
    FROM information_schema.tables 
    WHERE table_schema = 'public';
  `);
  console.log('Tables in database:');
  console.log(res.rows.map(r => r.table_name));

  // Also query count of rows in tenants vs institutes if they exist
  try {
    const tenantsCount = await client.query('SELECT COUNT(*) FROM tenants;');
    console.log('Rows in tenants:', tenantsCount.rows[0].count);
  } catch (err) {
    console.log('tenants table error:', err.message);
  }

  try {
    const institutesCount = await client.query('SELECT COUNT(*) FROM institutes;');
    console.log('Rows in institutes:', institutesCount.rows[0].count);
  } catch (err) {
    console.log('institutes table error:', err.message);
  }

  await client.end();
}

run().catch(console.error);
