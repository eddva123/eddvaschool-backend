const { Client } = require('pg'); 
const client = new Client({ 
  connectionString: 'postgres://postgres.mrirhbcfxpcmcnvrzfld:itEVbOANeXg71Gcw@aws-1-ap-southeast-1.pooler.supabase.com:5432/postgres',
  ssl: { rejectUnauthorized: false }
}); 
client.connect().then(async () => { 
  const tenantId = 'ea6cc573-f8e3-4927-b4ca-7e2e294bd64d'; // deepak-school
  const email = 'teas6487@gmail.com';
  
  // Create user
  await client.query(`
    INSERT INTO users (email, role, tenant_id, full_name, status) 
    VALUES ($1, 'INSTITUTE_ADMIN', $2, 'Deepak Admin', 'ACTIVE')
    ON CONFLICT (email, tenant_id) DO UPDATE SET role = 'INSTITUTE_ADMIN'
  `, [email, tenantId]);
  
  console.log("Successfully created INSTITUTE_ADMIN 'teas6487@gmail.com' for deepak-school!");
  client.end(); 
}).catch(console.error);
