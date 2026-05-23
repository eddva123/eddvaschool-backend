const { Client } = require('pg');
const client = new Client({
  connectionString: 'postgres://postgres.mrirhbcfxpcmcnvrzfld:itEVbOANeXg71Gcw@aws-1-ap-southeast-1.pooler.supabase.com:5432/postgres',
  ssl: { rejectUnauthorized: false }
});
client.connect().then(() => {
  client.query("SELECT * FROM tenants").then(res => {
    console.log(res.rows);
    client.end();
  });
}).catch(console.error);
