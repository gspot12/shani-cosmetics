import { createClient } from '@libsql/client';
import { readFileSync } from 'fs';

const url = process.env.TURSO_DATABASE_URL;
const authToken = process.env.TURSO_AUTH_TOKEN;

if (!url || !authToken) {
  console.error('Missing TURSO_DATABASE_URL or TURSO_AUTH_TOKEN');
  process.exit(1);
}

const client = createClient({ url, authToken });

const sql = readFileSync('./prisma/migrations/20260616195916_init/migration.sql', 'utf-8');

// Split statements on semicolons, strip comment lines, filter blanks
const statements = sql
  .split(';')
  .map(s =>
    s.split('\n')
      .filter(line => !line.trim().startsWith('--'))
      .join('\n')
      .trim()
  )
  .filter(s => s.length > 0);

console.log(`Applying ${statements.length} SQL statements to Turso...`);

for (const stmt of statements) {
  try {
    await client.execute(stmt);
    const label = stmt.split('\n').find(l => l.trim()) || stmt.slice(0, 60);
    console.log('✓', label.trim());
  } catch (e) {
    if (e.message?.includes('already exists')) {
      console.log('⚠ already exists, skipping');
    } else {
      console.error('✗', e.message);
    }
  }
}

// Record migration in _prisma_migrations so Prisma knows it's applied
try {
  await client.execute(`CREATE TABLE IF NOT EXISTS "_prisma_migrations" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "checksum" TEXT NOT NULL,
    "finished_at" DATETIME,
    "migration_name" TEXT NOT NULL,
    "logs" TEXT,
    "rolled_back_at" DATETIME,
    "started_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "applied_steps_count" INTEGER NOT NULL DEFAULT 0
  )`);
  await client.execute({
    sql: `INSERT OR IGNORE INTO "_prisma_migrations" (id, checksum, finished_at, migration_name, applied_steps_count)
          VALUES (?, ?, datetime('now'), ?, 1)`,
    args: ['migration_init', 'manual', '20260616195916_init'],
  });
  console.log('✓ Recorded migration in _prisma_migrations');
} catch (e) {
  console.log('⚠ Could not record migration:', e.message);
}

console.log('\nDone! Turso DB is ready.');
