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
    SELECT
        tablename,
        indexname,
        indexdef
    FROM
        pg_indexes
    WHERE
        schemaname = 'public'
        AND tablename = 'users';
  `);
  console.log('Indexes on users table:');
  console.log(JSON.stringify(res.rows, null, 2));
  await client.end();
}

run().catch(console.error);
