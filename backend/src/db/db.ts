import pg from 'pg';
import { env } from '../config/env.js';

const { Pool } = pg;

const connectionString = env.DIRECT_URL || env.DATABASE_URL;

export const pool = new Pool({
  connectionString,
  ssl: { rejectUnauthorized: false },
  max: 10,
  idleTimeoutMillis: 30000,
});

export const db = {
  async query<T = any>(text: string, params?: any[]): Promise<T[]> {
    const res = await pool.query(text, params);
    return res.rows as T[];
  },

  async queryOne<T = any>(text: string, params?: any[]): Promise<T | null> {
    const res = await pool.query(text, params);
    return (res.rows[0] as T) || null;
  },
};
