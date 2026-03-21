import 'dotenv/config';
import express     from 'express';
import session     from 'express-session';
import { requireAuth } from './middleware/auth.js';
import authRoutes    from './routes/auth.js';
import couleursRoutes from './routes/couleurs.js';
import marquesRoutes  from './routes/marques.js';
import packsRoutes    from './routes/packs.js';
import testRoutes     from './routes/test.js';

const app  = express();
const PORT = process.env.PORT || 3000;

app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(express.static('public'));

app.use(session({
  secret:            process.env.SESSION_SECRET,
  resave:            false,
  saveUninitialized: false,
  cookie: {
    secure:  process.env.NODE_ENV === 'production',
    maxAge:  parseInt(process.env.SESSION_MAX_AGE) || 86400000
  }
}));

app.use('/', authRoutes);
app.use('/', couleursRoutes);
app.use('/', marquesRoutes);
app.use('/', packsRoutes);
app.use('/', testRoutes);

app.get('/dashboard', requireAuth, (req, res) => {
  res.sendFile('dashboard.html', { root: './views' });
});

app.listen(PORT, () => {
  console.log(`Serveur démarré sur http://localhost:${PORT}`);
});
