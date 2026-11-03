// @ts-nocheck
import fs from 'node:fs';
import path from 'node:path';
import pg from 'pg';
import { env } from '../config/env.js';

const { Client } = pg;

async function runMigration() {
  const connectionString = env.DIRECT_URL || env.DATABASE_URL;
  if (!connectionString) {
    console.error('No DIRECT_URL or DATABASE_URL provided.');
    process.exit(1);
  }

  console.log('Connecting to PostgreSQL database...');
  const client = new Client({
    connectionString,
    ssl: { rejectUnauthorized: false },
  });

  try {
    await client.connect();
    console.log('Connected to Supabase PostgreSQL successfully!');

    const sqlPath = path.join(process.cwd(), 'src', 'db', 'migrations', '001_initial_schema.sql');
    const sql = fs.readFileSync(sqlPath, 'utf8');

    console.log('Running 001_initial_schema.sql migration...');
    await client.query(sql);
    console.log('Migration completed successfully! All tables created.');

    const res = await client.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      ORDER BY table_name;
    `);
    console.log('Public tables:', res.rows.map(r => r.table_name));
  } catch (err) {
    console.error('Migration error:', err);
  } finally {
    await client.end();
  }
}

runMigration();
