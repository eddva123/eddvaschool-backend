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
    SELECT table_name, 
           COUNT(CASE WHEN column_name = 'deleted_at' THEN 1 END) as has_deleted_at
    FROM information_schema.columns 
    WHERE table_schema = 'public'
    GROUP BY table_name;
  `);
  console.log('Tables and deleted_at availability:');
  console.log(res.rows);
  await client.end();
}

run().catch(console.error);
