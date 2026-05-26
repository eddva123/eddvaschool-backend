const { Client } = require('pg');
require('dotenv').config();

async function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function run() {
  const client = new Client({
    host: process.env.DB_HOST,
    port: process.env.DB_PORT,
    user: process.env.DB_USERNAME,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    ssl: { rejectUnauthorized: false }
  });

  let connected = false;
  let retries = 15;
  while (!connected && retries > 0) {
    try {
      await client.connect();
      connected = true;
      console.log('Connected to DB successfully');
    } catch (err) {
      console.log(`Connection failed: ${err.message}. Retrying... (${retries} left)`);
      retries--;
      await sleep(2000);
    }
  }

  if (!connected) {
    console.error('Failed to connect after all retries.');
    return;
  }

  try {
    console.log('Altering tables...');

    // 1. study_materials
    await client.query(`
      ALTER TABLE study_materials ADD COLUMN IF NOT EXISTS tenant_id UUID;
      ALTER TABLE study_materials ADD COLUMN IF NOT EXISTS exam VARCHAR(50);
      ALTER TABLE study_materials ADD COLUMN IF NOT EXISTS title VARCHAR(255);
      ALTER TABLE study_materials ADD COLUMN IF NOT EXISTS subject VARCHAR(100);
      ALTER TABLE study_materials ADD COLUMN IF NOT EXISTS chapter VARCHAR(100);
      ALTER TABLE study_materials ADD COLUMN IF NOT EXISTS description TEXT;
      ALTER TABLE study_materials ADD COLUMN IF NOT EXISTS s3_key VARCHAR(255);
      ALTER TABLE study_materials ADD COLUMN IF NOT EXISTS file_size_kb INTEGER;
      ALTER TABLE study_materials ADD COLUMN IF NOT EXISTS total_pages INTEGER;
      ALTER TABLE study_materials ADD COLUMN IF NOT EXISTS preview_pages INTEGER DEFAULT 2;
      ALTER TABLE study_materials ADD COLUMN IF NOT EXISTS uploaded_by VARCHAR(255);
      ALTER TABLE study_materials ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT true;
      ALTER TABLE study_materials ADD COLUMN IF NOT EXISTS sort_order INTEGER DEFAULT 0;
      ALTER TABLE study_materials ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP;
    `);
    console.log('- Altered study_materials');

    // 2. subjects
    await client.query(`
      ALTER TABLE subjects ADD COLUMN IF NOT EXISTS batch_id UUID;
      ALTER TABLE subjects ADD COLUMN IF NOT EXISTS exam_target VARCHAR(50) DEFAULT 'jee';
      ALTER TABLE subjects ADD COLUMN IF NOT EXISTS icon VARCHAR(100) DEFAULT '';
      ALTER TABLE subjects ADD COLUMN IF NOT EXISTS color_code VARCHAR(20) DEFAULT '';
      ALTER TABLE subjects ADD COLUMN IF NOT EXISTS sort_order INT DEFAULT 0;
      ALTER TABLE subjects ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT true;
    `);
    console.log('- Altered subjects');

    // 3. chapters
    await client.query(`
      ALTER TABLE chapters ADD COLUMN IF NOT EXISTS subject_id UUID;
      ALTER TABLE chapters ADD COLUMN IF NOT EXISTS sort_order INT DEFAULT 0;
      ALTER TABLE chapters ADD COLUMN IF NOT EXISTS jee_weightage FLOAT DEFAULT 0;
      ALTER TABLE chapters ADD COLUMN IF NOT EXISTS neet_weightage FLOAT DEFAULT 0;
      ALTER TABLE chapters ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT true;
    `);
    console.log('- Altered chapters');

    // 4. topics
    await client.query(`
      ALTER TABLE topics ADD COLUMN IF NOT EXISTS sort_order INT DEFAULT 0;
      ALTER TABLE topics ADD COLUMN IF NOT EXISTS gate_pass_percentage INT DEFAULT 70;
      ALTER TABLE topics ADD COLUMN IF NOT EXISTS estimated_study_minutes INT DEFAULT 60;
      ALTER TABLE topics ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT true;
      ALTER TABLE topics ADD COLUMN IF NOT EXISTS prerequisite_topic_ids TEXT;
    `);
    console.log('- Altered topics');

    // 5. notifications
    await client.query(`
      ALTER TABLE notifications ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP;
      ALTER TABLE notifications ADD COLUMN IF NOT EXISTS tenant_id UUID;
      ALTER TABLE notifications ADD COLUMN IF NOT EXISTS channel VARCHAR(50);
      ALTER TABLE notifications ADD COLUMN IF NOT EXISTS status VARCHAR(50);
      ALTER TABLE notifications ADD COLUMN IF NOT EXISTS body TEXT;
      ALTER TABLE notifications ADD COLUMN IF NOT EXISTS data JSONB;
      ALTER TABLE notifications ADD COLUMN IF NOT EXISTS scheduled_at TIMESTAMP;
      ALTER TABLE notifications ADD COLUMN IF NOT EXISTS sent_at TIMESTAMP;
      ALTER TABLE notifications ADD COLUMN IF NOT EXISTS read_at TIMESTAMP;
      ALTER TABLE notifications ADD COLUMN IF NOT EXISTS failure_reason VARCHAR(255);
    `);
    console.log('- Altered notifications');

    console.log('Database alteration complete!');

  } catch (err) {
    console.error('Error during schema update:', err);
  } finally {
    await client.end();
  }
}

run();


