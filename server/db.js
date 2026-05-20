import fs from 'node:fs/promises';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import dotenv from 'dotenv';
import pg from 'pg';

dotenv.config();

const {Pool} = pg;
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const migrationsDir = path.resolve(__dirname, '..', 'database', 'migrations');

export const pool = new Pool({
  host: process.env.DB_HOST || 'localhost',
  port: Number(process.env.DB_PORT || 5432),
  database: process.env.DB_NAME || 'recruit_plus',
  user: process.env.DB_USER || 'admin',
  password: process.env.DB_PASSWORD || 'admin_password',
});

export async function query(text, params = []) {
  return pool.query(text, params);
}

export async function withTransaction(callback) {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const result = await callback(client);
    await client.query('COMMIT');
    return result;
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
}

export async function checkConnection() {
  await query('SELECT 1');
}

export async function runMigrations() {
  await query(`
    CREATE TABLE IF NOT EXISTS schema_migrations (
      file_name TEXT PRIMARY KEY,
      applied_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
  `);

  const bootstrapState = await query(`
    SELECT
      EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'roles') AS has_roles,
      EXISTS (SELECT 1 FROM schema_migrations LIMIT 1) AS has_migrations
  `);

  const files = (await fs.readdir(migrationsDir))
    .filter((file) => file.endsWith('.sql'))
    .sort();

  if (bootstrapState.rows[0]?.has_roles && !bootstrapState.rows[0]?.has_migrations) {
    for (const file of files) {
      await query(
        'INSERT INTO schema_migrations (file_name) VALUES ($1) ON CONFLICT (file_name) DO NOTHING',
        [file],
      );
    }
    return;
  }

  for (const file of files) {
    const exists = await query(
      'SELECT 1 FROM schema_migrations WHERE file_name = $1',
      [file],
    );
    if (exists.rows[0]) {
      continue;
    }

    const sql = await fs.readFile(path.join(migrationsDir, file), 'utf8');
    if (sql.trim()) {
      await query(sql);
      await query(
        'INSERT INTO schema_migrations (file_name) VALUES ($1) ON CONFLICT (file_name) DO NOTHING',
        [file],
      );
    }
  }
}
