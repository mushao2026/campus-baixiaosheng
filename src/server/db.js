const { Pool } = require('pg');

let pool;

function getDb() {
  if (!pool) {
    const connectionString = process.env.DATABASE_URL;
    if (!connectionString) {
      throw new Error('DATABASE_URL 环境变量未设置！请配置 PostgreSQL 连接字符串。');
    }
    pool = new Pool({
      connectionString,
      ssl: connectionString.includes('neon.tech') ? { rejectUnauthorized: false } : false,
    });
    initTables();
  }
  return pool;
}

async function initTables() {
  const client = await pool.connect();
  try {
    await client.query(`
      CREATE TABLE IF NOT EXISTS users (
        id SERIAL PRIMARY KEY,
        phone TEXT UNIQUE,
        openid TEXT UNIQUE,
        nickname TEXT DEFAULT '同学',
        credits INTEGER DEFAULT 0,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE IF NOT EXISTS orders (
        id SERIAL PRIMARY KEY,
        user_id INTEGER NOT NULL,
        amount REAL NOT NULL,
        credits INTEGER NOT NULL,
        package_name TEXT,
        status TEXT DEFAULT 'pending',
        pay_method TEXT DEFAULT 'alipay',
        payer_name TEXT DEFAULT '',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        reviewed_at TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(id)
      );

      CREATE TABLE IF NOT EXISTS chat_logs (
        id SERIAL PRIMARY KEY,
        user_id INTEGER,
        question TEXT NOT NULL,
        answer TEXT NOT NULL,
        tokens_used INTEGER DEFAULT 0,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE IF NOT EXISTS verify_codes (
        id SERIAL PRIMARY KEY,
        phone TEXT NOT NULL,
        code TEXT NOT NULL,
        expires_at TIMESTAMP NOT NULL,
        used INTEGER DEFAULT 0
      );
    `);
    console.log('[DB] PostgreSQL 表初始化完成');
  } finally {
    client.release();
  }
}

module.exports = { getDb };
