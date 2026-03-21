import express from 'express';
import pool   from '../db.js';
import { requireAuth } from '../middleware/auth.js';

const router = express.Router();

// Page de conseils — publique
router.get('/tips', (req, res) => {
  res.sendFile('tips.html', { root: './views' });
});

// Page de test reconnaissance — publique
router.get('/test', (req, res) => {
  res.sendFile('test.html', { root: './views' });
});

// API — toutes les couleurs pour le matching client — publique
router.get('/api/couleurs/all', async (req, res) => {
  let conn;
  try {
    conn = await pool.getConnection();
    const couleurs = await conn.query(`
      SELECT c.id, c.reference, c.hex, c.r, c.g, c.b,
             c.hex_photo, c.r_photo, c.g_photo, c.b_photo,
             m.nom AS marque
      FROM couleurs c
      JOIN marques m ON m.id = c.marque_id
      ORDER BY m.nom, c.reference
    `);
    res.json(couleurs);
  } catch (err) {
    res.status(500).json({ error: 'Erreur serveur' });
  } finally {
    if (conn) conn.release();
  }
});

export default router;
