import express from 'express';
import pool   from '../db.js';
import { requireAuth } from '../middleware/auth.js';

const router = express.Router();

router.get('/api/analytics', requireAuth, async (req, res) => {
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

    res.json({
      kpis,
      chart:     chartRows,
      pages:     pagesRows,
      devices:   devicesRows[0],
      retention: { new: uniq30d - ret, returning: ret },
    });
  } catch (err) {
    console.error('[analytics route]', err);
    res.status(500).json({ error: err.message });
  }
});

export default router;
