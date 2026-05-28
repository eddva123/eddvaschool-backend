const { Client } = require('pg'); 
const client = new Client({ 
  connectionString: 'postgres://postgres.mrirhbcfxpcmcnvrzfld:itEVbOANeXg71Gcw@aws-1-ap-southeast-1.pooler.supabase.com:5432/postgres',
  ssl: { rejectUnauthorized: false }
}); 
client.connect().then(async () => { 
  const res = await client.query("SELECT u.email, u.role, t.subdomain, t.name as tenant_name FROM users u JOIN tenants t ON u.tenant_id = t.id WHERE u.role = 'INSTITUTE_ADMIN' AND u.deleted_at IS NULL LIMIT 10"); 
  console.table(res.rows); 
  client.end(); 
}).catch(console.error);
