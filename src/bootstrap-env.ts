import * as dotenv from 'dotenv';
import { existsSync } from 'fs';

for (const file of ['.env.local', '.env']) {
  if (existsSync(file)) {
    dotenv.config({ path: file, override: true });
  }
}
