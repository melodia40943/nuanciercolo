import bcrypt from 'bcrypt';
import * as mariadb from 'mariadb';
import dotenv from 'dotenv';
dotenv.config();

const hash = await bcrypt.hash('48rose48$NO', 12);

const pool = mariadb.createPool({
  host:     process.env.DB_HOST,
  port:     parseInt(process.env.DB_PORT),
  database: process.env.DB_NAME,
  user:     process.env.DB_USER,
  password: process.env.DB_PASS
});

const conn = await pool.getConnection();
await conn.query('INSERT INTO users (username, password) VALUES (?, ?)', ['melodia40943', hash]);
console.log('Utilisateur créé.');
conn.release();
await pool.end();
