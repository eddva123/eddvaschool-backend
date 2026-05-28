const { Client } = require('pg');
const client = new Client('postgres://postgres.mrirhbcfxpcmcnvrzfld:itEVbOANeXg71Gcw@aws-1-ap-southeast-1.pooler.supabase.com:5432/postgres');
client.connect()
  .then(() => client.query(`
    INSERT INTO users (id, name, email, password, role, status, full_name, is_first_login)
    VALUES (gen_random_uuid(), 'Super Admin', 'admin@eddva.com', '$2a$10$ubPkM2dJEV0NuvBHyQ0FAemlXmUaBVCemg142t7t3fR11o9kSbY1O', 'SUPER_ADMIN', 'active', 'Super Admin', false)
    ON CONFLICT (email) DO UPDATE SET password = EXCLUDED.password;
  `))
  .then(() => { console.log('Created test user admin@eddva.com'); client.end(); })
  .catch(e => { console.error(e); client.end(); });
