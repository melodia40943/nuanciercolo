import 'dotenv/config';
import express     from 'express';
import session     from 'express-session';
import helmet      from 'helmet';
import { requireAuth } from './middleware/auth.js';
import { analyticsMiddleware } from './middleware/analytics.js';
import authRoutes    from './routes/auth.js';
import analyticsRoutes from './routes/dashboard-api.js';
import couleursRoutes from './routes/couleurs.js';
import marquesRoutes  from './routes/marques.js';
import packsRoutes    from './routes/packs.js';
import testRoutes     from './routes/test.js';

const app  = express();
const PORT = process.env.PORT || 3000;



app.set('trust proxy', true); // Infomaniak — plusieurs niveaux de proxy

app.use(helmet({
  contentSecurityPolicy: false, // désactivé car CDN externes (pdf.js, fonts Google)
}));


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

app.use(analyticsMiddleware);
app.use(authRoutes);
app.use(analyticsRoutes);
app.use(couleursRoutes);
app.use(marquesRoutes);
app.use(packsRoutes);
app.use(testRoutes);

// Route inline (test de diagnostic — hors sub-router)
app.get('/api/ping', (req, res) => res.json({ ok: true, pid: String(process.pid) }));

app.get('/dashboard', requireAuth, (req, res) => {
  res.sendFile('dashboard.html', { root: './views' });
});

// 403 et 404 → redirection vers /conseils
app.use((req, res, next) => {
  const err = new Error('Not Found');
  err.status = 404;
  next(err);
});

app.use((err, req, res, next) => {
  const status = err.status || 500;
  if (status === 403 || status === 404) {
    return res.redirect('/conseils');
  }
  next(err);
});

app.listen(PORT, () => {
  console.log(`Serveur démarré sur http://localhost:${PORT}`);
});
