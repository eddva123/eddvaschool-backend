const { Client } = require('pg'); 
const client = new Client({ 
  connectionString: 'postgres://postgres.mrirhbcfxpcmcnvrzfld:itEVbOANeXg71Gcw@aws-1-ap-southeast-1.pooler.supabase.com:5432/postgres',
  ssl: { rejectUnauthorized: false }
}); 
client.connect().then(async () => { 
  const res = await client.query("SELECT u.id, u.email, u.role, u.tenant_id, t.subdomain, t.name as tenant_name FROM users u JOIN tenants t ON u.tenant_id = t.id WHERE t.subdomain != 'platform'"); 
  console.table(res.rows); 
  client.end(); 
}).catch(console.error);
