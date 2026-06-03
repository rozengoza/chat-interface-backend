/**
 * Schema migration runner
 * Usage: node src/db/migrate.js [--additions]
 *
 * --additions  Run sql/additions.sql instead (for existing deployments that
 *              already have the base schema and only need the ALTER statements).
 */
import 'dotenv/config';
import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { db } from './index.js';

const __dir = dirname(fileURLToPath(import.meta.url));
const useAdditions = process.argv.includes('--additions');

const sqlFile = useAdditions
  ? join(__dir, '../../sql/additions.sql')
  : join(__dir, '../../sql/schema.sql');

const label = useAdditions ? 'additions' : 'full schema';

try {
  const sql = readFileSync(sqlFile, 'utf8');
  await db.query(sql);
  console.log(`✅ ${label} applied successfully`);
  process.exit(0);
} catch (err) {
  console.error(`❌ Migration (${label}) failed:`, err.message);
  process.exit(1);
}
