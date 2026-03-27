import express from 'express';
import pool   from '../db.js';
import { requireAuth } from '../middleware/auth.js';

const router = express.Router();

// Index — page de conseils — publique
router.get('/', (req, res) => {
  res.sendFile('tips.html', { root: './views' });
});

// Page de conseils — publique
router.get('/conseils', (req, res) => {
  res.sendFile('tips.html', { root: './views' });
});

// Page de recherche couleurs — publique
router.get('/recherche', (req, res) => {
  res.sendFile('test.html', { root: './views' });
});

// API — statut session (pour affichage conditionnel des outils dev)
router.get('/api/me', (req, res) => {
  res.json({ loggedIn: !!req.session.userId });
});

// API — toutes les couleurs pour le matching client — publique
router.get('/api/couleurs/all', async (req, res) => {
  try {
    const [rows] = await pool.query(`
      SELECT c.id, c.reference, c.hex, c.r, c.g, c.b,
             c.hex_photo, c.r_photo, c.g_photo, c.b_photo,
             c.marque_id,
             m.nom AS marque,
             c.pack_min_id,
             p.nb_couleurs AS pack_min_nb,
             (SELECT GROUP_CONCAT(pc.pack_id) FROM pack_couleurs pc WHERE pc.couleur_id = c.id) AS pack_ids
      FROM couleurs c
      JOIN marques m ON m.id = c.marque_id
      LEFT JOIN packs p ON p.id = c.pack_min_id
      WHERE c.active = TRUE
      ORDER BY m.nom, c.reference
    `);
    const colors = rows.map(c => ({
      ...c,
      pack_ids: c.pack_ids ? c.pack_ids.split(',').map(Number) : []
    }));
    res.json(colors);
  } catch (err) {
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

// API — marques avec leurs packs (pour le sélecteur de collection) — publique
router.get('/api/marques-packs', async (req, res) => {
  try {
    const [marques] = await pool.query(`SELECT id, nom FROM marques ORDER BY nom`);
    const [packs]   = await pool.query(`
      SELECT id, marque_id, nom, nb_couleurs
      FROM packs
      WHERE nb_couleurs IS NOT NULL
      ORDER BY marque_id, nb_couleurs
    `);
    const result = marques.map(m => ({
      ...m,
      packs: packs.filter(p => p.marque_id === m.id)
    }));
    res.json(result);
  } catch (err) {
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

export default router;
