// =========================================================
// DATABASE CONNECTION
// PostgreSQL (Supabase) or MySQL per docs/PROJECT_BIBLE_V2.md.
// This client uses `pg`; swap for `mysql2` if the team picks MySQL —
// the query() interface below is the only thing routes depend on.
// =========================================================
const { Pool } = require("pg");

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.DATABASE_URL ? { rejectUnauthorized: false } : false,
});

module.exports = {
  query: (text, params) => pool.query(text, params),
  configured: Boolean(process.env.DATABASE_URL),
};
