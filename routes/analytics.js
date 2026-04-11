import express from 'express';
import pool   from '../db.js';
import { requireAuth } from '../middleware/auth.js';

const router = express.Router();

router.get('/api/analytics', requireAuth, async (req, res) => {
  console.log('[analytics] sessionID:', req.sessionID, '| userId:', req.session?.userId, '| url:', req.originalUrl);
  try {
    const [[kpisRows], [chartRows], [pagesRows], [devicesRows]] = await Promise.all([
      pool.query(`
        SELECT
          SUM(DATE(visited_at) = CURDATE())                                          AS visits_today,
          SUM(visited_at >= DATE_SUB(NOW(), INTERVAL 7  DAY))                        AS visits_7d,
          SUM(visited_at >= DATE_SUB(NOW(), INTERVAL 30 DAY))                        AS visits_30d,
          SUM(YEAR(visited_at) = YEAR(NOW()))                                        AS visits_year,
          COUNT(DISTINCT CASE WHEN DATE(visited_at) = CURDATE()
                              THEN visitor_id END)                                   AS uniq_today,
          COUNT(DISTINCT CASE WHEN visited_at >= DATE_SUB(NOW(), INTERVAL 7  DAY)
                              THEN visitor_id END)                                   AS uniq_7d,
          COUNT(DISTINCT CASE WHEN visited_at >= DATE_SUB(NOW(), INTERVAL 30 DAY)
                              THEN visitor_id END)                                   AS uniq_30d,
          COUNT(DISTINCT CASE WHEN YEAR(visited_at) = YEAR(NOW())
                              THEN visitor_id END)                                   AS uniq_year,
          COUNT(DISTINCT visitor_id)                                                 AS uniq_total
        FROM analytics_visits
      `),
      pool.query(`
        SELECT DATE(visited_at) AS day,
               COUNT(*)                    AS visits,
               COUNT(DISTINCT visitor_id)  AS uniq
        FROM analytics_visits
        WHERE visited_at >= DATE_SUB(CURDATE(), INTERVAL 29 DAY)
        GROUP BY DATE(visited_at)
        ORDER BY day
      `),
      pool.query(`
        SELECT page,
               COUNT(*)                   AS visits,
               COUNT(DISTINCT visitor_id) AS uniq
        FROM analytics_visits
        WHERE visited_at >= DATE_SUB(NOW(), INTERVAL 30 DAY)
        GROUP BY page
        ORDER BY visits DESC
      `),
      pool.query(`
        SELECT
          SUM(user_agent LIKE '%Mobile%' OR user_agent LIKE '%Android%' OR user_agent LIKE '%iPhone%') AS mobile,
          SUM(user_agent NOT LIKE '%Mobile%' AND user_agent NOT LIKE '%Android%' AND user_agent NOT LIKE '%iPhone%') AS desktop
        FROM analytics_visits
        WHERE visited_at >= DATE_SUB(NOW(), INTERVAL 30 DAY)
          AND user_agent IS NOT NULL
      `),
    ]);

    // Visiteurs récurrents sur 30 jours = ont visité AVANT les 30 derniers jours ET aussi dans les 30 derniers jours
    const [[{ returning_count }]] = await pool.query(`
      SELECT COUNT(DISTINCT visitor_id) AS returning_count
      FROM analytics_visits
      WHERE visited_at >= DATE_SUB(NOW(), INTERVAL 30 DAY)
        AND visitor_id IN (
          SELECT DISTINCT visitor_id FROM analytics_visits
          WHERE visited_at < DATE_SUB(NOW(), INTERVAL 30 DAY)
        )
    `);

    const kpis    = kpisRows[0];
    const uniq30d = Number(kpis.uniq_30d) || 0;
    const ret     = Number(returning_count) || 0;

    // Erreurs 429 trackées (table peut ne pas exister en prod — fallback silencieux)
    let errorsRows = { errors_24h: 0, errors_7d: 0, errors_30d: 0 };
    try {
      const [[rows]] = await pool.query(`
        SELECT
          SUM(reported_at >= DATE_SUB(NOW(), INTERVAL 24 HOUR)) AS errors_24h,
          SUM(reported_at >= DATE_SUB(NOW(), INTERVAL 7  DAY))  AS errors_7d,
          SUM(reported_at >= DATE_SUB(NOW(), INTERVAL 30 DAY))  AS errors_30d
        FROM analytics_errors
        WHERE error_code = 429
      `);
      errorsRows = rows;
    } catch { /* table absente ou autre erreur DB — on ignore */ }

    res.json({
      kpis,
      chart:     chartRows,
      pages:     pagesRows,
      devices:   devicesRows[0],
      retention: { new: uniq30d - ret, returning: ret },
      errors429: errorsRows[0],
    });
  } catch (err) {
    console.error('[analytics route]', err);
    res.status(500).json({ error: err.message });
  }
});

// Diagnostic temporaire — à supprimer après debug
router.get('/api/debug-session', (req, res) => {
  res.json({
    sessionID: req.sessionID,
    userId: req.session?.userId ?? null,
    hasSession: !!(req.session && req.session.userId),
    pid: process.pid,
  });
});

// Signalement d'erreur côté client (public, pas d'auth)
router.post('/api/report-error', async (req, res) => {
  const { error_code, page } = req.body;
  if (!error_code || ![429, 503, 500].includes(Number(error_code))) {
    return res.status(400).json({ error: 'Invalid' });
  }
  try {
    await pool.query(
      'INSERT INTO analytics_errors (error_code, page) VALUES (?, ?)',
      [Number(error_code), (page || '').substring(0, 100) || null]
    );
    res.json({ ok: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
