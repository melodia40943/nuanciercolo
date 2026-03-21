import express from 'express';
import pool   from '../db.js';
import { requireAuth } from '../middleware/auth.js';

const router = express.Router();

// Page liste
router.get('/packs', requireAuth, async (req, res) => {
  let conn;
  try {
    conn = await pool.getConnection();
    const packs   = await conn.query(`
      SELECT p.*, m.nom AS marque_nom
      FROM packs p JOIN marques m ON m.id = p.marque_id
      ORDER BY m.nom, p.nom
    `);
    const marques = await conn.query('SELECT * FROM marques ORDER BY nom');
    res.send(renderPacks(packs, marques));
  } catch (err) {
    console.error(err);
    res.status(500).send('Erreur serveur');
  } finally {
    if (conn) conn.release();
  }
});

// API — ajouter un pack (JSON)
router.post('/api/packs', requireAuth, async (req, res) => {
  const { marque_id, nom, nb_couleurs, prix_approx, lien_temu, lien_amazon } = req.body;
  if (!marque_id || !nom) return res.status(400).json({ error: 'Champs manquants' });
  let conn;
  try {
    conn = await pool.getConnection();
    const result = await conn.query(
      `INSERT INTO packs (marque_id, nom, nb_couleurs, prix_approx, lien_temu, lien_amazon)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [marque_id, nom, nb_couleurs || null, prix_approx || null, lien_temu || null, lien_amazon || null]
    );
    const [pack] = await conn.query(`
      SELECT p.*, m.nom AS marque_nom
      FROM packs p JOIN marques m ON m.id = p.marque_id
      WHERE p.id = ?`, [result.insertId]
    );
    res.json(pack);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Erreur serveur' });
  } finally {
    if (conn) conn.release();
  }
});

// API — liste des packs (JSON, pour le formulaire)
router.get('/api/packs', requireAuth, async (req, res) => {
  let conn;
  try {
    conn = await pool.getConnection();
    const packs = await conn.query(`
      SELECT p.*, m.nom AS marque_nom
      FROM packs p JOIN marques m ON m.id = p.marque_id
      ORDER BY m.nom, p.nom
    `);
    res.json(packs);
  } catch (err) {
    res.status(500).json({ error: 'Erreur serveur' });
  } finally {
    if (conn) conn.release();
  }
});

// API — liste des marques (JSON, pour le formulaire)
router.get('/api/marques', requireAuth, async (req, res) => {
  let conn;
  try {
    conn = await pool.getConnection();
    const marques = await conn.query('SELECT * FROM marques ORDER BY nom');
    res.json(marques);
  } catch (err) {
    res.status(500).json({ error: 'Erreur serveur' });
  } finally {
    if (conn) conn.release();
  }
});

// Supprimer
router.post('/packs/:id/delete', requireAuth, async (req, res) => {
  let conn;
  try {
    conn = await pool.getConnection();
    await conn.query('DELETE FROM packs WHERE id = ?', [req.params.id]);
    res.redirect('/packs');
  } catch (err) {
    console.error(err);
    res.status(500).send('Erreur serveur');
  } finally {
    if (conn) conn.release();
  }
});

function renderPacks(packs, marques) {
  const optMarques = marques.map(m =>
    `<option value="${m.id}">${m.nom}</option>`
  ).join('');

  const rows = packs.map(p => `
    <tr>
      <td>${p.marque_nom}</td>
      <td>${p.nom}</td>
      <td>${p.nb_couleurs ?? '—'}</td>
      <td>${p.prix_approx ? p.prix_approx + ' €' : '—'}</td>
      <td>
        <form method="POST" action="/packs/${p.id}/delete" style="display:inline"
              onsubmit="return confirm('Supprimer ce pack ?')">
          <button type="submit" class="btn-delete">Supprimer</button>
        </form>
      </td>
    </tr>`).join('');

  return `<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Nuancier — Packs</title>
  <link rel="stylesheet" href="/css/style.css">
</head>
<body>
  <nav>
    <span>Nuancier — Back office</span>
    <div>
      <a href="/dashboard">Dashboard</a>
      <a href="/couleurs">Couleurs</a>
      <a href="/marques">Marques</a>
      <a href="/packs">Packs</a>
      <form method="POST" action="/logout" style="display:inline">
        <button type="submit">Déconnexion</button>
      </form>
    </div>
  </nav>
  <main>
    <div class="page-header">
      <h1>Packs</h1>
    </div>

    <div class="two-col">
      <div>
        <table>
          <thead>
            <tr><th>Marque</th><th>Nom</th><th>Nb couleurs</th><th>Prix</th><th>Actions</th></tr>
          </thead>
          <tbody>
            ${rows || '<tr><td colspan="5">Aucun pack.</td></tr>'}
          </tbody>
        </table>
      </div>

      <div class="panel">
        <h2>Ajouter un pack</h2>
        <form id="form-pack">
          <div class="form-group">
            <label>Marque</label>
            <select name="marque_id" required>${optMarques}</select>
          </div>
          <div class="form-group">
            <label>Nom du pack</label>
            <input type="text" name="nom" required placeholder="ex: Guangna 80 couleurs">
          </div>
          <div class="form-group">
            <label>Nb de couleurs</label>
            <input type="number" name="nb_couleurs" min="1" placeholder="ex: 80">
          </div>
          <div class="form-group">
            <label>Prix approx (€)</label>
            <input type="number" name="prix_approx" step="0.01" placeholder="ex: 24.90">
          </div>
          <div class="form-group">
            <label>Lien Temu</label>
            <input type="url" name="lien_temu" placeholder="https://...">
          </div>
          <div class="form-group">
            <label>Lien Amazon</label>
            <input type="url" name="lien_amazon" placeholder="https://...">
          </div>
          <div class="form-actions">
            <button type="submit" class="btn-primary">Ajouter</button>
          </div>
        </form>
      </div>
    </div>
  </main>

  <script>
    document.getElementById('form-pack').addEventListener('submit', async e => {
      e.preventDefault();
      const data = Object.fromEntries(new FormData(e.target));
      const r = await fetch('/api/packs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      });
      if (r.ok) location.reload();
    });
  </script>
</body>
</html>`;
}

export default router;
