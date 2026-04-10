import 'dotenv/config';
import express     from 'express';
import session     from 'express-session';
import helmet      from 'helmet';
import rateLimit   from 'express-rate-limit';
import { readFileSync } from 'fs';
import { execSync }     from 'child_process';
import { requireAuth } from './middleware/auth.js';
import { analyticsMiddleware } from './middleware/analytics.js';
import authRoutes    from './routes/auth.js';
import analyticsRoutes from './routes/analytics.js';
import couleursRoutes from './routes/couleurs.js';
import marquesRoutes  from './routes/marques.js';
import packsRoutes    from './routes/packs.js';
import testRoutes     from './routes/test.js';

const app  = express();
const PORT = process.env.PORT || 3000;

let ASSET_VERSION;
try {
  ASSET_VERSION = execSync('git rev-parse --short HEAD').toString().trim();
} catch {
  ASSET_VERSION = Date.now().toString(36);
}
const swContent = readFileSync('./public/sw.js', 'utf8').replace('__VER__', ASSET_VERSION);

app.set('trust proxy', true); // Infomaniak — plusieurs niveaux de proxy

app.use(helmet({
  contentSecurityPolicy: false, // désactivé car CDN externes (pdf.js, fonts Google)
}));

app.use('/api', rateLimit({
  windowMs: 15 * 60 * 1000, // 15 min
  max: 500,
  standardHeaders: true,
  legacyHeaders: false,
}));

const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  message: 'Trop de tentatives, réessaie dans 15 minutes.',
  standardHeaders: true,
  legacyHeaders: false,
});

app.use(express.urlencoded({ extended: true }));
app.use(express.json());

app.get('/sw.js', (req, res) => {
  res.setHeader('Content-Type', 'application/javascript');
  res.setHeader('Cache-Control', 'no-cache');
  res.send(swContent);
});

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

app.post('/coulisses', loginLimiter);
app.use('/', authRoutes);
app.use('/', analyticsRoutes);
app.use('/', couleursRoutes);
app.use('/', marquesRoutes);
app.use('/', packsRoutes);
app.use('/', testRoutes);

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
