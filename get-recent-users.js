const { Client } = require('pg'); 
const client = new Client({ 
  connectionString: 'postgres://postgres.mrirhbcfxpcmcnvrzfld:itEVbOANeXg71Gcw@aws-1-ap-southeast-1.pooler.supabase.com:5432/postgres',
  ssl: { rejectUnauthorized: false }
}); 
client.connect().then(async () => { 
  const res = await client.query("SELECT id, email, role, tenant_id, status FROM users ORDER BY created_at DESC LIMIT 10"); 
  console.table(res.rows); 
  client.end(); 
}).catch(console.error);
