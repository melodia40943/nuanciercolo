import express from 'express';
import pool   from '../db.js';
import { requireAuth } from '../middleware/auth.js';

const router = express.Router();

// Page liste
router.get('/packs', requireAuth, async (req, res) => {
  try {
    const [resPacks]   = await pool.query(`
      SELECT p.*, m.nom AS marque_nom, po.nom AS pointe_nom
      FROM packs p JOIN marques m ON m.id = p.marque_id
      LEFT JOIN pointes po ON po.id = p.pointe_id
      ORDER BY m.nom, p.nom
    `);
    const [resMarques] = await pool.query('SELECT * FROM marques ORDER BY nom');
    const [resPointes] = await pool.query('SELECT * FROM pointes ORDER BY nom');
    const [resMediums] = await pool.query('SELECT * FROM mediums ORDER BY nom');
    res.send(renderPacks(resPacks, resMarques, resPointes, resMediums));
  } catch (err) {
    console.error(err);
    res.status(500).send('Erreur serveur');
  }
});

// Page édition d'un pack
router.get('/packs/:id/edit', requireAuth, async (req, res) => {
  try {
    const [[pack]] = await pool.query(`
      SELECT p.*, m.nom AS marque_nom
      FROM packs p JOIN marques m ON m.id = p.marque_id
      WHERE p.id = ?
    `, [req.params.id]);
    if (!pack) return res.redirect('/packs');
    const [resMarques] = await pool.query('SELECT * FROM marques ORDER BY nom');
    const [resPointes] = await pool.query('SELECT * FROM pointes ORDER BY nom');
    const [resMediums] = await pool.query('SELECT * FROM mediums ORDER BY nom');
    const [resPackMediums] = await pool.query('SELECT medium FROM pack_mediums WHERE pack_id = ?', [req.params.id]);
    const packMediums = resPackMediums.map(r => r.medium);
    res.send(renderPackForm(pack, resMarques, resPointes, resMediums, packMediums));
  } catch (err) {
    console.error(err);
    res.status(500).send('Erreur serveur');
  }
});

// Mettre à jour un pack
router.post('/packs/:id', requireAuth, async (req, res) => {
  const { marque_id, nom, nb_couleurs, prix_approx, lien_temu, lien_amazon, medium, pointe_id } = req.body;
  const rawExtra = req.body.medium_extra;
  const mediumsExtra = rawExtra ? (Array.isArray(rawExtra) ? rawExtra : [rawExtra]) : [];
  const allMediums = medium ? [medium, ...mediumsExtra.filter(m => m !== medium)] : mediumsExtra;
  try {
    await pool.query(
      `UPDATE packs SET marque_id=?, nom=?, nb_couleurs=?, prix_approx=?, lien_temu=?, lien_amazon=?, medium=?, pointe_id=? WHERE id=?`,
      [marque_id, nom, nb_couleurs || null, prix_approx || null, lien_temu || null, lien_amazon || null, medium || null, pointe_id || null, req.params.id]
    );
    await pool.query('DELETE FROM pack_mediums WHERE pack_id = ?', [req.params.id]);
    if (allMediums.length) {
      await pool.query('INSERT INTO pack_mediums (pack_id, medium) VALUES ?', [allMediums.map(m => [req.params.id, m])]);
    }
    res.redirect('/packs');
  } catch (err) {
    console.error(err);
    res.status(500).send('Erreur serveur');
  }
});

// API — ajouter un pack (JSON)
router.post('/api/packs', requireAuth, async (req, res) => {
  const { marque_id, nom, nb_couleurs, prix_approx, lien_temu, lien_amazon, medium, pointe_id } = req.body;
  if (!marque_id || !nom || !nb_couleurs) return res.status(400).json({ error: 'Champs manquants (marque, nom et nb couleurs requis)' });
  try {
    const [result] = await pool.query(
      `INSERT INTO packs (marque_id, nom, nb_couleurs, prix_approx, lien_temu, lien_amazon, medium, pointe_id)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [marque_id, nom, nb_couleurs || null, prix_approx || null, lien_temu || null, lien_amazon || null, medium || null, pointe_id || null]
    );
    const [[pack]] = await pool.query(`
      SELECT p.*, m.nom AS marque_nom
      FROM packs p JOIN marques m ON m.id = p.marque_id
      WHERE p.id = ?`, [result.insertId]
    );
    res.json(pack);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

// API — liste des packs (JSON, pour le formulaire)
router.get('/api/packs', requireAuth, async (req, res) => {
  try {
    const [rows] = await pool.query(`
      SELECT p.*, m.nom AS marque_nom
      FROM packs p JOIN marques m ON m.id = p.marque_id
      ORDER BY m.nom, p.nom
    `);
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

// API — liste des marques (JSON, pour le formulaire)
router.get('/api/marques', requireAuth, async (req, res) => {
  try {
    const [rows] = await pool.query('SELECT * FROM marques ORDER BY nom');
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

// Supprimer
router.post('/packs/:id/delete', requireAuth, async (req, res) => {
  try {
    await pool.query('DELETE FROM packs WHERE id = ?', [req.params.id]);
    res.redirect('/packs');
  } catch (err) {
    console.error(err);
    res.status(500).send('Erreur serveur');
  }
});

function nav() {
  return `
    <nav>
      <div style="display:flex;align-items:center;gap:1.25rem;">
        <a href="/" class="nav-back-app">← App</a>
        <span class="nav-bo-label">Back office</span>
      </div>
      <div>
        <a href="/dashboard">Dashboard</a>
        <a href="/couleurs">Couleurs</a>
        <a href="/couleurs/new">+ Ajouter</a>
        <a href="/couleurs/bulk">Édition masse</a>
        <a href="/couleurs/correction">Correction batch</a>
        <a href="/packs">Packs</a>
        <a href="/marques">Marques</a>
        <form method="POST" action="/logout" style="display:inline">
          <button type="submit">Déconnexion</button>
        </form>
      </div>
    </nav>`;
}

function renderPacks(packs, marques, pointes, mediums) {
  const optMarques = marques.map(m =>
    `<option value="${m.id}">${m.nom}</option>`
  ).join('');

  const optPointes = ['<option value="">— Aucune —</option>',
    ...pointes.map(p => `<option value="${p.id}">${p.nom}</option>`)
  ].join('');

  const optMediums = ['<option value="">— Non défini —</option>',
    ...mediums.map(m => `<option value="${m.nom}">${m.nom}</option>`)
  ].join('');

  const rows = packs.map(p => `
    <tr>
      <td>${p.marque_nom}</td>
      <td>${p.nom}</td>
      <td>${p.nb_couleurs ?? '—'}</td>
      <td>${p.medium || '<span style="color:#bbb">—</span>'}</td>
      <td>${p.pointe_nom || '<span style="color:#bbb">—</span>'}</td>
      <td>${p.prix_approx ? p.prix_approx + ' €' : '—'}</td>
      <td>
        <a href="/packs/${p.id}/edit" class="btn-secondary" style="font-size:0.8rem;padding:3px 10px;text-decoration:none;">Modifier</a>
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
  <title>Révélo BO — Packs</title>
  <link rel="stylesheet" href="/css/style.css">
</head>
<body>
  ${nav()}
  <main>
    <div class="page-header">
      <h1>Packs</h1>
    </div>

    <div class="two-col">
      <div>
        <table>
          <thead>
            <tr><th>Marque</th><th>Nom</th><th>Nb</th><th>Medium</th><th>Pointe</th><th>Prix</th><th>Actions</th></tr>
          </thead>
          <tbody>
            ${rows || '<tr><td colspan="7">Aucun pack.</td></tr>'}
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
            <input type="number" name="nb_couleurs" min="1" placeholder="ex: 80" required>
          </div>
          <div class="form-group">
            <label>Medium</label>
            <select name="medium">${optMediums}</select>
          </div>
          <div class="form-group">
            <label>Type de pointe</label>
            <select name="pointe_id">${optPointes}</select>
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

function renderPackForm(pack, marques, pointes, mediums, packMediums = []) {
  const optMarques = marques.map(m =>
    `<option value="${m.id}" ${pack.marque_id == m.id ? 'selected' : ''}>${m.nom}</option>`
  ).join('');

  const optPointes = ['<option value="">— Aucune —</option>',
    ...pointes.map(p => `<option value="${p.id}" ${pack.pointe_id == p.id ? 'selected' : ''}>${p.nom}</option>`)
  ].join('');

  const optMediums = ['<option value="">— Non défini —</option>',
    ...mediums.map(m => `<option value="${m.nom}" ${pack.medium === m.nom ? 'selected' : ''}>${m.nom}</option>`)
  ].join('');

  return `<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Révélo BO — Modifier ${pack.nom}</title>
  <link rel="stylesheet" href="/css/style.css">
</head>
<body>
  ${nav()}
  <main>
    <div class="page-header">
      <h1>Modifier le pack</h1>
      <a href="/packs">← Retour</a>
    </div>

    <div class="form-layout" style="max-width:600px">
      <section class="form-panel">
        <form method="POST" action="/packs/${pack.id}">
          <div class="form-group">
            <label>Marque</label>
            <select name="marque_id" required>${optMarques}</select>
          </div>
          <div class="form-group">
            <label>Nom du pack</label>
            <input type="text" name="nom" value="${pack.nom}" required>
          </div>
          <div class="form-group">
            <label>Nb de couleurs</label>
            <input type="number" name="nb_couleurs" value="${pack.nb_couleurs ?? ''}" min="1">
          </div>
          <div class="form-group">
            <label>Medium (affiché sur les cartes)</label>
            <select name="medium">${optMediums}</select>
          </div>
          <div class="form-group">
            <label>Aussi visible sous <small style="color:#999;font-weight:normal">(filtres de collection)</small></label>
            <div style="display:flex;flex-wrap:wrap;gap:8px;margin-top:4px">
              ${mediums.map(m => `<label style="display:flex;align-items:center;gap:4px;font-weight:normal;cursor:pointer">
                <input type="checkbox" name="medium_extra" value="${m.nom}" ${packMediums.includes(m.nom) && m.nom !== pack.medium ? 'checked' : ''}>
                ${m.nom}
              </label>`).join('')}
            </div>
          </div>
          <div class="form-group">
            <label>Type de pointe</label>
            <select name="pointe_id">${optPointes}</select>
          </div>
          <div class="form-group">
            <label>Prix approx (€)</label>
            <input type="number" name="prix_approx" step="0.01" value="${pack.prix_approx ?? ''}">
          </div>
          <div class="form-group">
            <label>Lien Temu</label>
            <input type="url" name="lien_temu" value="${pack.lien_temu || ''}">
          </div>
          <div class="form-group">
            <label>Lien Amazon</label>
            <input type="url" name="lien_amazon" value="${pack.lien_amazon || ''}">
          </div>
          <div class="form-actions">
            <button type="submit" class="btn-primary">Enregistrer</button>
            <a href="/packs">Annuler</a>
          </div>
        </form>
      </section>
    </div>
  </main>
</body>
</html>`;
}

export default router;
