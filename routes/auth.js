import express  from 'express';
import bcrypt   from 'bcrypt';
import pool     from '../db.js';

const router = express.Router();

router.get('/coulisses', (req, res) => {
  res.sendFile('login.html', { root: './views' });
});

router.post('/coulisses', async (req, res) => {
  const { username, password } = req.body;
  try {
    const [rows] = await pool.query('SELECT * FROM users WHERE username = ?', [username]);
    if (!rows.length) return res.redirect('/coulisses?error=1');

    const user = rows[0];
    const valid = await bcrypt.compare(password, user.password);
    if (!valid) return res.redirect('/coulisses?error=1');

    req.session.userId   = user.id;
    req.session.username = user.username;
    res.redirect('/dashboard');
  } catch (err) {
    console.error(err);
    res.redirect('/coulisses?error=1');
  }
});

router.post('/logout', (req, res) => {
  req.session.destroy(() => res.redirect('/coulisses'));
});

export default router;
