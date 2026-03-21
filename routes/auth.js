import express  from 'express';
import bcrypt   from 'bcrypt';
import pool     from '../db.js';

const router = express.Router();

router.get('/login', (req, res) => {
  res.sendFile('login.html', { root: './views' });
});

router.post('/login', async (req, res) => {
  const { username, password } = req.body;
  try {
    const result = await pool.query('SELECT * FROM users WHERE username = $1', [username]);
    if (!result.rows.length) return res.redirect('/login?error=1');

    const user = result.rows[0];
    const valid = await bcrypt.compare(password, user.password);
    if (!valid) return res.redirect('/login?error=1');

    req.session.userId   = user.id;
    req.session.username = user.username;
    res.redirect('/dashboard');
  } catch (err) {
    console.error(err);
    res.redirect('/login?error=1');
  }
});

router.post('/logout', (req, res) => {
  req.session.destroy(() => res.redirect('/login'));
});

export default router;
