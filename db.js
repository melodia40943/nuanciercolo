import 'dotenv/config';
import * as mariadb from 'mariadb';

const pool = mariadb.createPool({
  host:            process.env.DB_HOST,
  port:            parseInt(process.env.DB_PORT),
  database:        process.env.DB_NAME,
  user:            process.env.DB_USER,
  password:        process.env.DB_PASS,
  connectionLimit: 5
});

export default pool;
