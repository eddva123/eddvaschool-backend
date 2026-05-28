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
      tc.table_name, 
      tc.constraint_name,
      kcu.column_name, 
      ccu.table_name AS foreign_table_name,
      ccu.column_name AS foreign_column_name 
    FROM 
      information_schema.table_constraints AS tc 
      JOIN information_schema.key_column_usage AS kcu
        ON tc.constraint_name = kcu.constraint_name
        AND tc.table_schema = kcu.table_schema
      JOIN information_schema.constraint_column_usage AS ccu
        ON ccu.constraint_name = tc.constraint_name
        AND ccu.table_schema = tc.table_schema
    WHERE tc.constraint_type = 'FOREIGN KEY' AND ccu.table_name = 'institutes';
  `);
  
  console.log(`Found ${res.rows.length} constraints pointing to "institutes". Remapping to "tenants"...`);
  
  for (const row of res.rows) {
    try {
      console.log(`Table: ${row.table_name} | Drop: ${row.constraint_name}`);
      await client.query(`
        ALTER TABLE public.${row.table_name} 
        DROP CONSTRAINT IF EXISTS ${row.constraint_name};
      `);
      
      console.log(`Table: ${row.table_name} | Add constraint ${row.constraint_name} pointing to tenants(id)`);
      await client.query(`
        ALTER TABLE public.${row.table_name} 
        ADD CONSTRAINT ${row.constraint_name} 
        FOREIGN KEY (${row.column_name}) REFERENCES public.tenants(id) 
        ON DELETE SET NULL;
      `);
    } catch (err) {
      console.error(`Failed on table ${row.table_name}:`, err.message);
    }
  }
  console.log('All constraint remaps completed!');

  await client.end();
}

run().catch(console.error);
