const { Client } = require('pg');
const client = new Client({
  connectionString: 'postgres://postgres.mrirhbcfxpcmcnvrzfld:itEVbOANeXg71Gcw@aws-1-ap-southeast-1.pooler.supabase.com:5432/postgres',
  ssl: { rejectUnauthorized: false }
});
client.connect().then(async () => {
  const res = await client.query(`SELECT column_name, is_nullable, column_default FROM information_schema.columns WHERE table_name = 'users'`);
  console.table(res.rows);
  client.end();
}).catch(console.error);
