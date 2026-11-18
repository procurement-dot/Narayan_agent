const { Pool } = require('pg');
const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../.env') });

const pool = new Pool({
  connectionString: process.env.DATABASE_URL || 'postgresql://postgres:postgres@localhost:5432/nryn_db'
});

async function main() {
  try {
    const countRes = await pool.query('SELECT count(*) FROM finance_sms_transactions');
    console.log('Total in DB:', countRes.rows[0].count);

    const typeRes = await pool.query('SELECT type, count(*), sum(amount) FROM finance_sms_transactions GROUP BY type');
    console.log('Types in DB:', typeRes.rows);

    const sampleRes = await pool.query('SELECT id, type, amount, merchant, date, raw_body FROM finance_sms_transactions ORDER BY date DESC LIMIT 40');
    console.log('Sample rows:');
    for (const r of sampleRes.rows) {
      console.log(`[${r.type.toUpperCase()}] ₹${r.amount} | Date: ${new Date(Number(r.date)).toISOString().slice(0, 10)} | ${r.merchant}`);
      console.log(`   SMS: ${r.raw_body}\n`);
    }
  } catch (err) {
    console.error('Error:', err.message);
  } finally {
    pool.end();
  }
}

main();
