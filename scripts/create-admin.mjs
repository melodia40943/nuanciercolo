import bcrypt from 'bcrypt';
import pg from 'pg';
import dotenv from 'dotenv';
dotenv.config();

const { Pool } = pg;

const hash = await bcrypt.hash('48rose48$NO', 12);

const pool = new Pool({
  host:     process.env.DB_HOST,
  port:     parseInt(process.env.DB_PORT) || 5432,
  database: process.env.DB_NAME,
  user:     process.env.DB_USER,
  password: process.env.DB_PASS
});

await pool.query('INSERT INTO users (username, password) VALUES ($1, $2)', ['melodia40943', hash]);
console.log('Utilisateur créé.');
await pool.end();
