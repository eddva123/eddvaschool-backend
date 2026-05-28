const { Client } = require('pg');
require('dotenv').config();

const connectionString = process.env.DATABASE_URL || 'postgresql://postgres.mrirhbcfxpcmcnvrzfld:itEVbOANeXg71Gcw@aws-1-ap-southeast-1.pooler.supabase.com:5432/postgres';

const client = new Client({
  connectionString,
  ssl: { rejectUnauthorized: false }
});

async function run() {
  await client.connect();
  console.log('Connected to DB');

  const query = `
    SELECT
      t.id AS "topicId",
      t.name AS "topicName",
      s.name AS "subjectName",
      AVG(CASE WHEN qa.is_correct = true THEN 100 ELSE 0 END)::float AS "accuracy",
      SUM(CASE WHEN qa.is_correct = false THEN 1 ELSE 0 END)::int AS "wrongCount",
      CASE
        WHEN SUM(CASE WHEN qa.is_correct = false THEN 1 ELSE 0 END) >= 10 THEN 'critical'
        WHEN SUM(CASE WHEN qa.is_correct = false THEN 1 ELSE 0 END) >= 6 THEN 'high'
        WHEN SUM(CASE WHEN qa.is_correct = false THEN 1 ELSE 0 END) >= 3 THEN 'medium'
        ELSE 'low'
      END AS "severity"
    FROM question_attempts qa
    INNER JOIN test_sessions ts ON ts.id = qa.test_session_id
    INNER JOIN questions q ON q.id = qa.question_id
    INNER JOIN topics t ON t.id = q.topic_id
    INNER JOIN chapters c ON c.id = t.chapter_id
    INNER JOIN subjects s ON s.id = c.subject_id
    WHERE qa.student_id = '00000000-0000-0000-0000-000000000000'
      AND qa.tenant_id = '00000000-0000-0000-0000-000000000000'
      AND qa.deleted_at IS NULL
      AND ts.status IN ('submitted', 'auto_submitted')
      AND qa.answered_at >= (NOW() - INTERVAL '30 days')
    GROUP BY t.id, t.name, s.name
    HAVING COUNT(*) >= 3
    ORDER BY
      AVG(CASE WHEN qa.is_correct = true THEN 100 ELSE 0 END) ASC,
      SUM(CASE WHEN qa.is_correct = false THEN 1 ELSE 0 END) DESC
    LIMIT 5
  `;

  try {
    const res = await client.query(query);
    console.log('Query succeeded!', res.rows);
  } catch (err) {
    console.error('Query failed:', err.message);
  }

  await client.end();
}

run().catch(console.error);
