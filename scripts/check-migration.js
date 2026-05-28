const fs = require('fs');
const path = require('path');

const migrationsDir = path.join(__dirname, '../src/database/migrations');

if (!fs.existsSync(migrationsDir)) {
  console.log('No migrations found. Safe.');
  process.exit(0);
}

const files = fs.readdirSync(migrationsDir).filter(f => f.endsWith('.ts'));
let hasDangerousOperations = false;

for (const file of files) {
  const content = fs.readFileSync(path.join(migrationsDir, file), 'utf8');
  
  const dangerousPatterns = [
    /DROP\s+COLUMN/i,
    /DROP\s+CONSTRAINT/i,
    /DROP\s+TABLE/i,
    /ALTER\s+TABLE.*DROP/i
  ];

  for (const pattern of dangerousPatterns) {
    if (pattern.test(content)) {
      console.error(`\n[WARNING] Dangerous schema destruction detected in migration: ${file}`);
      console.error(`Pattern matched: ${pattern}`);
      hasDangerousOperations = true;
    }
  }
}

if (hasDangerousOperations) {
  console.error('\n[FATAL] Destructive migration operations detected. Migration execution stopped to protect legacy ERP data.');
  console.error('If this is intentional, manually bypass this check. Otherwise, revert the migration generation.');
  process.exit(1);
}

console.log('Migration check passed. No dangerous operations detected.');
process.exit(0);
