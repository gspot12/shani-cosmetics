/**
 * One-time script: create real admin, disable default admin.
 * Run with: node scripts/replace-admin.mjs
 * Requires: TURSO_DATABASE_URL + TURSO_AUTH_TOKEN env vars
 */
import { createClient } from '@libsql/client';
import { createRequire } from 'module';
const require = createRequire(import.meta.url);
const bcrypt = require('bcryptjs');

const NEW_EMAIL    = 'Raphael@dacucina.com';
const NEW_NAME     = 'Raphael';
const NEW_PASSWORD = process.env.NEW_ADMIN_PASSWORD;
const DEFAULT_EMAIL = 'admin@shani.local';

if (!NEW_PASSWORD) {
  console.error('Set NEW_ADMIN_PASSWORD env var first.');
  process.exit(1);
}

const client = createClient({
  url:       process.env.TURSO_DATABASE_URL,
  authToken: process.env.TURSO_AUTH_TOKEN,
});

// Verify DB connection
await client.execute('SELECT 1');
console.log('✓ Connected to Turso');

// 1. Hash new password (bcrypt, 12 rounds)
const hash = await bcrypt.hash(NEW_PASSWORD, 12);
console.log('✓ Password hashed (bcrypt/12)');

// 2. Upsert real admin (insert or update if email already exists)
await client.execute({
  sql: `INSERT INTO User (id, role, name, email, passwordHash, isActive, createdAt, updatedAt)
        VALUES (lower(hex(randomblob(16))), 'SUPER_ADMIN', ?, ?, ?, 1, datetime('now'), datetime('now'))
        ON CONFLICT(email) DO UPDATE SET
          name=excluded.name, role='SUPER_ADMIN',
          passwordHash=excluded.passwordHash, isActive=1,
          updatedAt=datetime('now')`,
  args: [NEW_NAME, NEW_EMAIL, hash],
});
console.log(`✓ Admin created/updated: ${NEW_EMAIL}`);

// 3. Disable default admin (isActive = 0)
const result = await client.execute({
  sql: `UPDATE User SET isActive=0, updatedAt=datetime('now') WHERE email=?`,
  args: [DEFAULT_EMAIL],
});
console.log(`✓ Disabled ${DEFAULT_EMAIL} (rows affected: ${result.rowsAffected})`);

// 4. Verify final state
const rows = await client.execute(`SELECT email, role, isActive, substr(passwordHash,1,7) as hashPrefix FROM User WHERE role='SUPER_ADMIN' OR email=?`, [DEFAULT_EMAIL]);
console.log('\nFinal admin state:');
for (const row of rows.rows) {
  console.log(`  ${row.email}  role=${row.role}  active=${row.isActive}  hash=${row.hashPrefix}...`);
}
console.log('\nDone.');
