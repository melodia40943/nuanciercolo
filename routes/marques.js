import express from 'express';
import pool   from '../db.js';
import { requireAuth } from '../middleware/auth.js';

const router = express.Router();

// Page liste
router.get('/marques', requireAuth, async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM marques ORDER BY nom');
    res.send(renderMarques(result.rows));
  } catch (err) {
    console.error(err);
    res.status(500).send('Erreur serveur');
  }
});

// API — ajouter une marque (JSON)
router.post('/api/marques', requireAuth, async (req, res) => {
  const { nom, slug } = req.body;
  if (!nom || !slug) return res.status(400).json({ error: 'Champs manquants' });
  try {
    const result = await pool.query(
      'INSERT INTO marques (nom, slug) VALUES ($1, $2) RETURNING id', [nom, slug]
    );
    const marque = await pool.query('SELECT * FROM marques WHERE id = $1', [result.rows[0].id]);
    res.json(marque.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

// Supprimer
router.post('/marques/:id/delete', requireAuth, async (req, res) => {
  try {
    await pool.query('DELETE FROM marques WHERE id = $1', [req.params.id]);
    res.redirect('/marques');
  } catch (err) {
    console.error(err);
    res.status(500).send('Erreur serveur');
  }
});

function renderMarques(marques) {
  const rows = marques.map(m => `
    <tr>
      <td>${m.nom}</td>
      <td><code>${m.slug}</code></td>
      <td>
        <form method="POST" action="/marques/${m.id}/delete" style="display:inline"
              onsubmit="return confirm('Supprimer ${m.nom} ?')">
          <button type="submit" class="btn-delete">Supprimer</button>
        </form>
      </td>
    </tr>`).join('');

  return `<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Nuancier — Marques</title>
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
      <h1>Marques</h1>
    </div>

    <div class="two-col">
      <div>
        <table>
          <thead>
            <tr><th>Nom</th><th>Slug</th><th>Actions</th></tr>
          </thead>
          <tbody>
            ${rows || '<tr><td colspan="3">Aucune marque.</td></tr>'}
          </tbody>
        </table>
      </div>

      <div class="panel">
        <h2>Ajouter une marque</h2>
        <form method="POST" action="/api/marques" id="form-marque">
          <div class="form-group">
            <label>Nom</label>
            <input type="text" name="nom" id="nom" required placeholder="ex: Guangna">
          </div>
          <div class="form-group">
            <label>Slug</label>
            <input type="text" name="slug" id="slug" required placeholder="ex: guangna">
          </div>
          <div class="form-actions">
            <button type="submit" class="btn-primary">Ajouter</button>
          </div>
        </form>
      </div>
    </div>
  </main>

  <script>
    // Auto-slug depuis le nom
    document.getElementById('nom').addEventListener('input', e => {
      document.getElementById('slug').value = e.target.value
        .toLowerCase().trim().replace(/\\s+/g, '-').replace(/[^a-z0-9-]/g, '');
    });

    // Soumission via fetch pour rester sur la page
    document.getElementById('form-marque').addEventListener('submit', async e => {
      e.preventDefault();
      const data = Object.fromEntries(new FormData(e.target));
      const r = await fetch('/api/marques', {
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
