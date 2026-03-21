import express  from 'express';
import bcrypt   from 'bcrypt';
import pool     from '../db.js';

const router = express.Router();

router.get('/login', (req, res) => {
  res.sendFile('login.html', { root: './views' });
});

router.post('/login', async (req, res) => {
  const { username, password } = req.body;
  let conn;
  try {
    conn = await pool.getConnection();
    const rows = await conn.query('SELECT * FROM users WHERE username = ?', [username]);
    if (!rows.length) return res.redirect('/login?error=1');

    const user = rows[0];
    const valid = await bcrypt.compare(password, user.password);
    if (!valid) return res.redirect('/login?error=1');

    req.session.userId   = user.id;
    req.session.username = user.username;
    res.redirect('/dashboard');
  } catch (err) {
    console.error(err);
    res.redirect('/login?error=1');
  } finally {
    if (conn) conn.release();
  }
});

router.post('/logout', (req, res) => {
  req.session.destroy(() => res.redirect('/login'));
});

export default router;
