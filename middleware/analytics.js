import { randomUUID } from 'crypto';
import pool from '../db.js';

const TRACKED = new Set(['/', '/conseils', '/recherche']);
const COOKIE   = 'revelo_visitor';
const ONE_YEAR = 365 * 24 * 60 * 60 * 1000;

function readCookie(header, name) {
  if (!header) return null;
  for (const part of header.split(';')) {
    const idx = part.indexOf('=');
    if (idx === -1) continue;
    if (part.slice(0, idx).trim() === name) return part.slice(idx + 1).trim();
  }
  return null;
}

export function analyticsMiddleware(req, res, next) {
  if (req.method !== 'GET' || !TRACKED.has(req.path)) return next();

  // Ne tracker que si l'utilisatrice a accepté les cookies
  const consent = readCookie(req.headers.cookie, 'revelo_consent');
  if (consent !== '1') return next();

  let visitorId = readCookie(req.headers.cookie, COOKIE);
  if (!visitorId) {
    visitorId = randomUUID();
    res.cookie(COOKIE, visitorId, {
      maxAge:   ONE_YEAR,
      httpOnly: true,
      sameSite: 'Lax',
      secure:   process.env.NODE_ENV === 'production',
    });
  }

  const ua = (req.headers['user-agent'] || '').substring(0, 255) || null;
  pool.query(
    'INSERT INTO analytics_visits (visitor_id, page, user_agent) VALUES (?, ?, ?)',
    [visitorId, req.path, ua]
  ).catch(err => console.error('[analytics]', err.message));

  next();
}
