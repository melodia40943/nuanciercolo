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
      SELECT c.id, c.reference, c.reference_alt, c.hex, c.r, c.g, c.b,
             c.hex_photo, c.r_photo, c.g_photo, c.b_photo,
             c.marque_id,
             m.nom AS marque,
             c.medium, c.couches,
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

// API — médiums qui ont au moins une couleur active — publique
router.get('/api/mediums/active', async (req, res) => {
  try {
    const [rows] = await pool.query(`
      SELECT DISTINCT cm.medium
      FROM couleur_mediums cm
      JOIN couleurs c ON c.id = cm.couleur_id
      WHERE c.active = TRUE
      ORDER BY cm.medium
    `);
    res.json(rows.map(r => r.medium));
  } catch (err) {
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

// API — marques avec leurs packs (pour le sélecteur de collection) — publique
// ?medium=xxx → filtre sur les marques/packs ayant des couleurs de ce médium
router.get('/api/marques-packs', async (req, res) => {
  const { medium } = req.query;
  try {
    let marques, packs;
    if (medium) {
      [marques] = await pool.query(`
        SELECT DISTINCT m.id, m.nom FROM marques m
        JOIN couleurs c ON c.marque_id = m.id
        JOIN couleur_mediums cm ON cm.couleur_id = c.id
        WHERE cm.medium = ? AND c.active = TRUE
        ORDER BY m.nom
      `, [medium]);
      [packs] = await pool.query(`
        SELECT DISTINCT p.id, p.marque_id, p.nom, p.nb_couleurs
        FROM packs p
        JOIN pack_couleurs pc ON pc.pack_id = p.id
        JOIN couleurs c ON c.id = pc.couleur_id
        JOIN couleur_mediums cm ON cm.couleur_id = c.id
        WHERE cm.medium = ? AND c.active = TRUE
        ORDER BY p.marque_id, p.nb_couleurs
      `, [medium]);
    } else {
      [marques] = await pool.query(`SELECT id, nom FROM marques ORDER BY nom`);
      [packs]   = await pool.query(`
        SELECT id, marque_id, nom, nb_couleurs
        FROM packs
        ORDER BY marque_id, nb_couleurs
      `);
    }

    // Pointes par pack
    const ptParams = medium ? [medium] : [];
    const ptJoin   = medium ? 'JOIN couleur_mediums cm ON cm.couleur_id = c.id' : '';
    const ptWhere  = medium ? 'AND cm.medium = ?' : '';
    const [packPtRows] = await pool.query(`
      SELECT pc.pack_id, c.pointe_id, po.nom AS pointe_nom
      FROM pack_couleurs pc
      JOIN couleurs c ON c.id = pc.couleur_id
      JOIN pointes po ON po.id = c.pointe_id
      ${ptJoin}
      WHERE c.active = TRUE AND c.pointe_id IS NOT NULL ${ptWhere}
      GROUP BY pc.pack_id, c.pointe_id, po.nom
      ORDER BY po.nom
    `, ptParams);
    const packPtMap = {};
    packPtRows.forEach(r => {
      if (!packPtMap[r.pack_id]) packPtMap[r.pack_id] = [];
      if (!packPtMap[r.pack_id].find(p => p.id === r.pointe_id))
        packPtMap[r.pack_id].push({ id: r.pointe_id, nom: r.pointe_nom });
    });

    const result = marques.map(m => {
      const mPacks = packs.filter(p => p.marque_id === m.id).map(p => ({
        ...p, pointes: packPtMap[p.id] || []
      }));
      const ptMap = {};
      mPacks.forEach(p => p.pointes.forEach(pt => { ptMap[pt.id] = pt.nom; }));
      const marquePointes = Object.entries(ptMap).map(([id, nom]) => ({ id: Number(id), nom }));
      return { ...m, pointes: marquePointes, packs: mPacks };
    });
    res.json(result);
  } catch (err) {
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

export default router;
