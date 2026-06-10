import express from 'express';
import db from '../db.js';

const router = express.Router();

const MEDIUM_ID = {
  'Feutre acrylique':  'acrylique',
  'Feutre gel':        'gel',
  'Feutre à alcool':   'alcool',
  'Feutre à eau':      'eau',
  'Crayon de couleur': 'crayon',
};

router.get('/comparateur', (req, res) => {
  res.sendFile('comparateur.html', { root: './views' });
});

router.get('/degrades', (req, res) => {
  res.sendFile('degrades.html', { root: './views' });
});

router.get('/api/comparateur/couleurs', async (req, res) => {
  try {
    const [rows] = await db.query(`
      SELECT c.reference, c.hex_photo, c.hex, c.medium,
             ma.nom AS brand, c.couches, c.reference_alt,
             (SELECT GROUP_CONCAT(pc.pack_id) FROM pack_couleurs pc WHERE pc.couleur_id = c.id) AS pack_ids
      FROM couleurs c
      JOIN marques ma ON ma.id = c.marque_id
      WHERE c.active = 1
        AND c.medium IS NOT NULL AND c.medium != ''
        AND (c.hex IS NOT NULL OR c.hex_photo IS NOT NULL)
      ORDER BY ma.nom, c.reference
    `);
    const colors = rows
      .map(r => ({
        ref:     r.reference,
        hex:     r.hex_photo || r.hex,
        medium:  MEDIUM_ID[r.medium] || null,
        brand:   r.brand,
        couches: r.couches || null,
        refAlt:  r.reference_alt || null,
        pack_ids: r.pack_ids ? r.pack_ids.split(',').map(Number) : [],
      }))
      .filter(c => c.hex && c.medium);
    res.json(colors);
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: e.message });
  }
});

export default router;
