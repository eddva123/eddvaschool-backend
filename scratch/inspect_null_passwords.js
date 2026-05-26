const { Client } = require('pg');

const client = new Client({
  connectionString: 'postgresql://postgres.mrirhbcfxpcmcnvrzfld:itEVbOANeXg71Gcw@aws-1-ap-southeast-1.pooler.supabase.com:5432/postgres',
  ssl: {
    rejectUnauthorized: false
  }
});

async function run() {
  await client.connect();
  
  // 1. Fetch column definitions for public.users table
  const colRes = await client.query(`
    SELECT column_name, data_type, is_nullable 
    FROM information_schema.columns 
    WHERE table_schema = 'public' AND table_name = 'users';
  `);
  console.log("public.users columns and nullability:");
  console.log(JSON.stringify(colRes.rows, null, 2));

  // 2. Count users with null password
  const nullPassRes = await client.query(`
    SELECT count(*)::int as count FROM public.users WHERE password IS NULL;
  `);
  console.log(`\nUsers with NULL password: ${nullPassRes.rows[0].count}`);

  // 3. Select some users
  const usersRes = await client.query(`
    SELECT id, email, phone, name, role, password, institute_id FROM public.users LIMIT 10;
  `);
  console.log("\nSample users:");
  console.log(JSON.stringify(usersRes.rows, null, 2));

  await client.end();
}

run().catch(console.error);
