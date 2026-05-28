const { Client } = require('pg');
const client = new Client('postgres://postgres.mrirhbcfxpcmcnvrzfld:itEVbOANeXg71Gcw@aws-1-ap-southeast-1.pooler.supabase.com:5432/postgres');
client.connect()
  .then(() => client.query('ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "role" character varying DEFAULT \'student\';'))
  .then(() => client.query('ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "status" character varying DEFAULT \'active\';'))
  .then(() => client.query('ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "password" character varying;'))
  .then(() => client.query('ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "email" character varying;'))
  .then(() => { console.log('Done role and status'); client.end(); })
  .catch(e => { console.error(e); client.end(); });
