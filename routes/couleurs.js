import express from 'express';
import pool    from '../db.js';
import { requireAuth } from '../middleware/auth.js';

const router = express.Router();

// Liste des couleurs
router.get('/couleurs', requireAuth, async (req, res) => {
  const { marque_id, ref, active } = req.query;
  try {
    const [resMarques] = await pool.query('SELECT * FROM marques ORDER BY nom');

    let sql = `
      SELECT c.*, m.nom AS marque_nom
      FROM couleurs c
      JOIN marques m ON m.id = c.marque_id
      WHERE 1=1
    `;
    const params = [];
    if (marque_id)        { sql += ` AND c.marque_id = ?`; params.push(marque_id); }
    if (ref)              { sql += ` AND c.reference LIKE ?`; params.push(`%${ref}%`); }
    if (active === '1')   { sql += ` AND c.active = TRUE`; }
    if (active === '0')   { sql += ` AND c.active = FALSE`; }
    sql += ' ORDER BY m.nom, c.reference';

    const [resCouleurs] = await pool.query(sql, params);

    res.send(renderCouleurs(resCouleurs, resMarques, { marque_id, ref, active }));
  } catch (err) {
    console.error(err);
    res.status(500).send('Erreur serveur');
  }
});

// Formulaire ajout
router.get('/couleurs/new', requireAuth, async (req, res) => {
  try {
    const [resMarques] = await pool.query('SELECT * FROM marques ORDER BY nom');
    const [resPointes] = await pool.query('SELECT * FROM pointes ORDER BY nom');
    const [resPacks]   = await pool.query('SELECT p.*, m.nom AS marque_nom FROM packs p JOIN marques m ON m.id = p.marque_id ORDER BY m.nom, p.nom');
    res.send(renderForm({ marques: resMarques, pointes: resPointes, packs: resPacks, couleur: null }));
  } catch (err) {
    console.error(err);
    res.status(500).send('Erreur serveur');
  }
});

// INSERT couleur (form classique → redirect)
router.post('/couleurs', requireAuth, async (req, res) => {
  const { marque_id, reference, hex, r, g, b, hex_photo, r_photo, g_photo, b_photo, medium, pointe_id, pack_min_id } = req.body;
  try {
    await pool.query(
      'INSERT INTO couleurs (marque_id, reference, hex, r, g, b, hex_photo, r_photo, g_photo, b_photo, medium, pointe_id, pack_min_id) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?)',
      [marque_id, reference, hex, r, g, b, hex_photo || null, r_photo || null, g_photo || null, b_photo || null, medium || 'acrylique', pointe_id || null, pack_min_id || null]
    );
    res.redirect('/couleurs');
  } catch (err) {
    console.error(err);
    res.status(500).send('Erreur serveur');
  }
});

// INSERT couleur (API JSON → pas de redirect, pour ajout multiple)
router.post('/api/couleurs', requireAuth, async (req, res) => {
  const { marque_id, reference, hex, r, g, b, hex_photo, r_photo, g_photo, b_photo, medium, pointe_id, pack_min_id } = req.body;
  if (!marque_id || !reference || !hex) return res.status(400).json({ error: 'Champs manquants' });
  try {
    const [result] = await pool.query(
      'INSERT INTO couleurs (marque_id, reference, hex, r, g, b, hex_photo, r_photo, g_photo, b_photo, medium, pointe_id, pack_min_id) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?)',
      [marque_id, reference, hex, r, g, b, hex_photo || null, r_photo || null, g_photo || null, b_photo || null, medium || 'acrylique', pointe_id || null, pack_min_id || null]
    );
    res.json({ id: result.insertId, reference, hex, r, g, b });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

// Formulaire édition
router.get('/couleurs/:id/edit', requireAuth, async (req, res) => {
  try {
    const [resCouleur] = await pool.query('SELECT * FROM couleurs WHERE id = ?', [req.params.id]);
    if (!resCouleur.length) return res.redirect('/couleurs');
    const [resMarques] = await pool.query('SELECT * FROM marques ORDER BY nom');
    const [resPointes] = await pool.query('SELECT * FROM pointes ORDER BY nom');
    const [resPacks]   = await pool.query('SELECT p.*, m.nom AS marque_nom FROM packs p JOIN marques m ON m.id = p.marque_id ORDER BY m.nom, p.nom');
    res.send(renderForm({ marques: resMarques, pointes: resPointes, packs: resPacks, couleur: resCouleur[0] }));
  } catch (err) {
    console.error(err);
    res.status(500).send('Erreur serveur');
  }
});

// UPDATE couleur
router.post('/couleurs/:id', requireAuth, async (req, res) => {
  const { marque_id, reference, hex, r, g, b, hex_photo, r_photo, g_photo, b_photo, medium, pointe_id, pack_min_id, active } = req.body;
  try {
    await pool.query(
      'UPDATE couleurs SET marque_id=?, reference=?, hex=?, r=?, g=?, b=?, hex_photo=?, r_photo=?, g_photo=?, b_photo=?, medium=?, pointe_id=?, pack_min_id=?, active=? WHERE id=?',
      [marque_id, reference, hex, r, g, b, hex_photo || null, r_photo || null, g_photo || null, b_photo || null, medium || 'acrylique', pointe_id || null, pack_min_id || null, active === '1', req.params.id]
    );
    res.redirect('/couleurs');
  } catch (err) {
    console.error(err);
    res.status(500).send('Erreur serveur');
  }
});

// TOGGLE active
router.post('/couleurs/:id/toggle-active', requireAuth, async (req, res) => {
  try {
    await pool.query('UPDATE couleurs SET active = NOT active WHERE id = ?', [req.params.id]);
    res.redirect(req.get('Referer') || '/couleurs');
  } catch (err) {
    console.error(err);
    res.status(500).send('Erreur serveur');
  }
});

// DELETE couleur
router.post('/couleurs/:id/delete', requireAuth, async (req, res) => {
  try {
    await pool.query('DELETE FROM couleurs WHERE id = ?', [req.params.id]);
    res.redirect('/couleurs');
  } catch (err) {
    console.error(err);
    res.status(500).send('Erreur serveur');
  }
});

// Page édition en masse
router.get('/couleurs/bulk', requireAuth, async (req, res) => {
  const { marque_id } = req.query;
  try {
    const [resMarques] = await pool.query('SELECT * FROM marques ORDER BY nom');
    const [resPointes] = await pool.query('SELECT * FROM pointes ORDER BY nom');
    const [resPacks]   = await pool.query('SELECT p.*, m.nom AS marque_nom FROM packs p JOIN marques m ON m.id = p.marque_id ORDER BY m.nom, p.nom');

    let sql = `
      SELECT c.*, m.nom AS marque_nom,
             po.nom AS pointe_nom,
             pa.nom AS pack_nom
      FROM couleurs c
      JOIN marques m ON m.id = c.marque_id
      LEFT JOIN pointes po ON po.id = c.pointe_id
      LEFT JOIN packs pa ON pa.id = c.pack_min_id
      WHERE 1=1
    `;
    const params = [];
    if (marque_id) { sql += ` AND c.marque_id = ?`; params.push(marque_id); }
    sql += ' ORDER BY m.nom, c.reference';

    const [resCouleurs] = await pool.query(sql, params);
    res.send(renderBulkEdit(resCouleurs, resMarques, resPointes, resPacks, { marque_id }));
  } catch (err) {
    console.error(err);
    res.status(500).send('Erreur serveur');
  }
});

// API update en masse
router.post('/api/couleurs/bulk', requireAuth, async (req, res) => {
  const { ids, pointe_id, pack_min_id } = req.body;
  if (!ids || !ids.length) return res.status(400).json({ error: 'Aucune couleur sélectionnée' });

  const fields = [];
  const params = [];
  if (pointe_id !== undefined) { fields.push(`pointe_id = ?`); params.push(pointe_id || null); }
  if (pack_min_id !== undefined) { fields.push(`pack_min_id = ?`); params.push(pack_min_id || null); }
  if (!fields.length) return res.status(400).json({ error: 'Rien à mettre à jour' });

  params.push(ids);
  try {
    const [result] = await pool.query(
      `UPDATE couleurs SET ${fields.join(', ')} WHERE id IN (?)`,
      params
    );
    res.json({ updated: result.affectedRows });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

// --- Templates ---

function nav() {
  return `
    <nav>
      <span>Nuancier — Back office</span>
      <div>
        <a href="/dashboard">Dashboard</a>
        <a href="/couleurs">Couleurs</a>
        <a href="/packs">Packs</a>
        <form method="POST" action="/logout" style="display:inline">
          <button type="submit">Déconnexion</button>
        </form>
      </div>
    </nav>`;
}

function renderCouleurs(couleurs, marques, filters) {
  const options = marques.map(m =>
    `<option value="${m.id}" ${filters.marque_id == m.id ? 'selected' : ''}>${m.nom}</option>`
  ).join('');

  const rows = couleurs.map(c => `
    <tr style="${!c.active ? 'opacity:0.45' : ''}">
      <td><span class="color-swatch" style="background:${c.hex}"></span></td>
      <td>${c.marque_nom}</td>
      <td>${c.reference}</td>
      <td>${c.hex}</td>
      <td>${c.r} / ${c.g} / ${c.b}</td>
      <td>
        <form method="POST" action="/couleurs/${c.id}/toggle-active" style="display:inline">
          <button type="submit" style="background:${c.active ? '#e8f8ee;color:#27ae60' : '#fff0f0;color:#e74c3c'}">
            ${c.active ? '✓ Publiée' : '✗ Masquée'}
          </button>
        </form>
      </td>
      <td>
        <a href="/couleurs/${c.id}/edit">Modifier</a>
        <form method="POST" action="/couleurs/${c.id}/delete" style="display:inline" onsubmit="return confirm('Supprimer cette couleur ?')">
          <button type="submit" class="btn-delete">Supprimer</button>
        </form>
      </td>
    </tr>`).join('');

  return `<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Nuancier — Couleurs</title>
  <link rel="stylesheet" href="/css/style.css">
</head>
<body>
  ${nav()}
  <main>
    <div class="page-header">
      <h1>Couleurs <span class="count">(${couleurs.length})</span></h1>
      <div style="display:flex;gap:0.5rem;">
        <a href="/couleurs/bulk" class="btn-secondary">Édition en masse</a>
        <a href="/couleurs/new" class="btn-primary">+ Ajouter</a>
      </div>
    </div>

    <form method="GET" action="/couleurs" class="filters">
      <select name="marque_id">
        <option value="">Toutes les marques</option>
        ${options}
      </select>
      <input type="text" name="ref" placeholder="Référence..." value="${filters.ref || ''}">
      <select name="active">
        <option value="">Toutes</option>
        <option value="1" ${filters.active === '1' ? 'selected' : ''}>Publiées</option>
        <option value="0" ${filters.active === '0' ? 'selected' : ''}>Dépubliées</option>
      </select>
      <button type="submit">Filtrer</button>
      <a href="/couleurs">Réinitialiser</a>
    </form>

    <table>
      <thead>
        <tr>
          <th>Couleur</th>
          <th>Marque</th>
          <th>Référence</th>
          <th>Hex</th>
          <th>R / G / B</th>
          <th>Statut</th>
          <th>Actions</th>
        </tr>
      </thead>
      <tbody>
        ${rows || '<tr><td colspan="7">Aucune couleur enregistrée.</td></tr>'}
      </tbody>
    </table>
  </main>
</body>
</html>`;
}

function renderForm({ marques, pointes, packs, couleur }) {
  const edit = !!couleur;
  const v = couleur || {};
  const action = edit ? `/couleurs/${v.id}` : '/couleurs';
  const title  = edit ? `Modifier ${v.reference}` : 'Ajouter une couleur';

  const optMarques = marques.map(m =>
    `<option value="${m.id}" ${v.marque_id == m.id ? 'selected' : ''}>${m.nom}</option>`
  ).join('');

  const brushId = pointes.find(p => p.nom.toLowerCase() === 'brush')?.id;
  const defaultPointe = edit ? v.pointe_id : brushId;
  const optPointes = ['<option value="">— Aucune —</option>',
    ...pointes.map(p => `<option value="${p.id}" ${defaultPointe == p.id ? 'selected' : ''}>${p.nom}</option>`)
  ].join('');

  const optPacks = ['<option value="">— Aucun —</option>',
    ...packs.map(p => `<option value="${p.id}" ${v.pack_min_id == p.id ? 'selected' : ''}>${p.marque_nom} — ${p.nom}</option>`)
  ].join('');

  return `<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Nuancier — ${title}</title>
  <link rel="stylesheet" href="/css/style.css">
</head>
<body>
  ${nav()}
  <main>
    <div class="page-header">
      <h1>${title}</h1>
      <a href="/couleurs">← Retour</a>
    </div>

    <div class="form-layout">

      <!-- Module sampling -->
      <section class="sampling-panel">
        <div class="sampling-header">
          <h2>Sampling couleur</h2>
          <input type="file" id="sampling-file" accept="image/*,application/pdf" style="display:none">
          <button type="button" class="btn-secondary" onclick="document.getElementById('sampling-file').click()">Ouvrir image</button>
        </div>

        <div id="sampling-canvas-panel">
          <div id="sampling-drop">
            <div class="drop-ico">🎨</div>
            <p>Glisse ta photo ici</p>
            <em>ou clique sur "Ouvrir image"</em>
          </div>
          <div id="sampling-canvas-wrap" style="display:none">
            <canvas id="sampling-canvas"></canvas>
            <div id="sampling-drag-rect"></div>
            <div id="sampling-lens"><canvas id="sampling-lens-c" width="55" height="55"></canvas></div>
          </div>
        </div>

        <div id="sampling-controls" style="display:none">
          <div class="sampling-wb">
            <button type="button" id="btn-wb" disabled>Cliquer sur zone blanche</button>
            <span id="wb-status" class="wb-status pending">Non définie</span>
          </div>
          <div class="lens-size-ctrl">
            <span>Loupe&nbsp;:</span>
            <button type="button" id="btn-lens-minus">−</button>
            <span id="lens-size-val">55</span>px
            <button type="button" id="btn-lens-plus">+</button>
          </div>

          <div class="four-grid">
            <div class="s-cell" id="sc0"><span>—</span></div>
            <div class="s-cell" id="sc1"><span>—</span></div>
            <div class="s-cell" id="sc2"><span>—</span></div>
            <div class="s-cell" id="sc3"><span>—</span></div>
          </div>

          <div id="step-sample" style="display:none">
            <div class="sample-result">
              <div id="sample-preview"></div>
              <div>
                <div id="sample-hex" class="sample-hex">—</div>
                <div id="sample-rgb" class="sample-rgb">Dessine un rectangle sur la couleur</div>
              </div>
              <div style="display:flex;flex-direction:column;gap:6px;">
                <button type="button" id="btn-apply" class="btn-primary" disabled>→ Scanner</button>
                <button type="button" id="btn-apply-photo" class="btn-secondary" disabled>→ Photo</button>
              </div>
            </div>
          </div>
        </div>

        <div id="sampling-toast"></div>
      </section>

      <div id="pdf-page-modal" style="display:none">
        <div class="pdf-modal-overlay" id="pdf-cancel-overlay"></div>
        <div class="pdf-modal-box">
          <p class="pdf-modal-title" id="pdf-modal-title"></p>
          <div id="pdf-thumbs" class="pdf-thumbs"></div>
          <div class="pdf-modal-footer">
            <button type="button" id="pdf-cancel">Annuler</button>
          </div>
        </div>
      </div>

      <!-- Formulaire -->
      <section class="form-panel">
        <form method="POST" action="${action}">
          <div class="form-group">
            <label>Marque</label>
            <div class="select-with-add">
              <select name="marque_id" id="select-marque" required>${optMarques}</select>
              <button type="button" class="btn-add-inline" onclick="openModal('modal-marque')">+</button>
            </div>
          </div>

          <div class="form-group">
            <label>Référence</label>
            <input type="text" name="reference" value="${v.reference || ''}" required placeholder="ex: 601 ou BL-208">
          </div>

          <div class="form-group color-inputs">
            <div>
              <label>Hex (scanner)</label>
              <div class="hex-row">
                <input type="color" id="color-picker" value="${v.hex || '#ffffff'}">
                <input type="text" name="hex" id="hex-input" value="${v.hex || ''}" required placeholder="#rrggbb" pattern="^#[0-9a-fA-F]{6}$">
              </div>
            </div>
            <div>
              <label>R</label>
              <input type="number" name="r" id="r-input" value="${v.r ?? ''}" min="0" max="255" required>
            </div>
            <div>
              <label>G</label>
              <input type="number" name="g" id="g-input" value="${v.g ?? ''}" min="0" max="255" required>
            </div>
            <div>
              <label>B</label>
              <input type="number" name="b" id="b-input" value="${v.b ?? ''}" min="0" max="255" required>
            </div>
          </div>

          <div class="form-group color-inputs">
            <div>
              <label>Hex (photo)</label>
              <div class="hex-row">
                <input type="color" id="color-picker-photo" value="${v.hex_photo || '#ffffff'}">
                <input type="text" name="hex_photo" id="hex-photo-input" value="${v.hex_photo || ''}" placeholder="#rrggbb" pattern="^#[0-9a-fA-F]{6}$">
              </div>
            </div>
            <div>
              <label>R</label>
              <input type="number" name="r_photo" id="r-photo-input" value="${v.r_photo ?? ''}" min="0" max="255">
            </div>
            <div>
              <label>G</label>
              <input type="number" name="g_photo" id="g-photo-input" value="${v.g_photo ?? ''}" min="0" max="255">
            </div>
            <div>
              <label>B</label>
              <input type="number" name="b_photo" id="b-photo-input" value="${v.b_photo ?? ''}" min="0" max="255">
            </div>
          </div>

          <div class="form-group">
            <label>Medium</label>
            <select name="medium">
              <option value="acrylique" ${(v.medium || 'acrylique') === 'acrylique' ? 'selected' : ''}>Acrylique</option>
              <option value="gel" ${v.medium === 'gel' ? 'selected' : ''}>Gel</option>
            </select>
          </div>

          <div class="form-group">
            <label>Pointe</label>
            <select name="pointe_id">${optPointes}</select>
          </div>

          <div class="form-group">
            <label>Pack contenant la référence</label>
            <div class="select-with-add">
              <select name="pack_min_id" id="select-pack">${optPacks}</select>
              <button type="button" class="btn-add-inline" onclick="openModal('modal-pack')">+</button>
            </div>
          </div>

          <div class="form-group">
            <label>Publication</label>
            <label style="display:flex;align-items:center;gap:8px;font-weight:normal;cursor:pointer;">
              <input type="checkbox" name="active" value="1" ${!edit || v.active ? 'checked' : ''}>
              Couleur visible dans le test
            </label>
          </div>

          <div class="form-actions">
            ${edit
              ? `<button type="submit" class="btn-primary">Enregistrer</button>
                 <a href="/couleurs">Annuler</a>`
              : `<button type="button" class="btn-primary" id="btn-save">Ajouter</button>
                 <button type="button" class="btn-secondary" id="btn-save-quit">Ajouter et quitter</button>
                 <a href="/couleurs">Annuler</a>`
            }
          </div>
        </form>

        ${!edit ? `
        <div id="added-list" style="display:none; margin-top:1.5rem;">
          <h3 style="font-size:0.9rem; color:#555; margin-bottom:0.5rem;">Ajoutées dans cette session</h3>
          <div id="added-items"></div>
          <a href="/couleurs" class="btn-primary" style="display:inline-block;margin-top:10px;text-decoration:none;">✓ Terminer</a>
        </div>` : ''}
      </section>

    </div>
  </main>

  <!-- Modale ajout marque -->
  <div class="modal-backdrop" id="modal-marque" style="display:none">
    <div class="modal">
      <h3>Ajouter une marque</h3>
      <div class="form-group">
        <label>Nom</label>
        <input type="text" id="m-nom" placeholder="ex: Guangna">
      </div>
      <div class="form-group">
        <label>Slug</label>
        <input type="text" id="m-slug" placeholder="ex: guangna">
      </div>
      <div class="modal-actions">
        <button type="button" class="btn-primary" onclick="addMarque()">Ajouter</button>
        <button type="button" class="btn-secondary" onclick="closeModal('modal-marque')">Annuler</button>
      </div>
    </div>
  </div>

  <!-- Modale ajout pack -->
  <div class="modal-backdrop" id="modal-pack" style="display:none">
    <div class="modal">
      <h3>Ajouter un pack</h3>
      <div class="form-group">
        <label>Marque</label>
        <select id="p-marque"></select>
      </div>
      <div class="form-group">
        <label>Nom du pack</label>
        <input type="text" id="p-nom" placeholder="ex: Guangna 80 couleurs">
      </div>
      <div class="form-group">
        <label>Nb de couleurs</label>
        <input type="number" id="p-nb" min="1" placeholder="ex: 80">
      </div>
      <div class="form-group">
        <label>Prix approx (€)</label>
        <input type="number" id="p-prix" step="0.01" placeholder="ex: 24.90">
      </div>
      <div class="form-group">
        <label>Lien Temu</label>
        <input type="url" id="p-temu" placeholder="https://...">
      </div>
      <div class="form-group">
        <label>Lien Amazon</label>
        <input type="url" id="p-amazon" placeholder="https://...">
      </div>
      <div class="modal-actions">
        <button type="button" class="btn-primary" onclick="addPack()">Ajouter</button>
        <button type="button" class="btn-secondary" onclick="closeModal('modal-pack')">Annuler</button>
      </div>
    </div>
  </div>

  <script src="https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.min.js"></script>
  <script>pdfjsLib.GlobalWorkerOptions.workerSrc='https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js';</script>
  <script src="/js/sampler-core.js"></script>
  <script src="/js/sampling.js"></script>
  <script src="/js/couleur-form.js"></script>
  <script>
    // Synchro color picker photo ↔ hex_photo
    const pickerPhoto   = document.getElementById('color-picker-photo');
    const hexPhotoInput = document.getElementById('hex-photo-input');
    const rPhotoInput   = document.getElementById('r-photo-input');
    const gPhotoInput   = document.getElementById('g-photo-input');
    const bPhotoInput   = document.getElementById('b-photo-input');

    pickerPhoto.addEventListener('input', () => {
      const hex = pickerPhoto.value;
      hexPhotoInput.value = hex;
      rPhotoInput.value = parseInt(hex.slice(1,3),16);
      gPhotoInput.value = parseInt(hex.slice(3,5),16);
      bPhotoInput.value = parseInt(hex.slice(5,7),16);
    });
    hexPhotoInput.addEventListener('input', () => {
      const val = hexPhotoInput.value;
      if (/^#[0-9a-fA-F]{6}$/.test(val)) {
        pickerPhoto.value = val;
        rPhotoInput.value = parseInt(val.slice(1,3),16);
        gPhotoInput.value = parseInt(val.slice(3,5),16);
        bPhotoInput.value = parseInt(val.slice(5,7),16);
      }
    });

    // Bouton "→ Photo" : applique l'échantillon aux champs photo
    document.getElementById('btn-apply-photo').addEventListener('click', () => {
      if (!sampledColor) return;
      hexPhotoInput.value  = sampledColor.hex;
      rPhotoInput.value    = sampledColor.r;
      gPhotoInput.value    = sampledColor.g;
      bPhotoInput.value    = sampledColor.b;
      pickerPhoto.value    = sampledColor.hex;
      showToast('✓ Référence photo appliquée');
    });
  </script>
  <script>
    function openModal(id) {
      document.getElementById(id).style.display = 'flex';
      if (id === 'modal-pack') loadMarquesInModal();
    }
    function closeModal(id) {
      document.getElementById(id).style.display = 'none';
    }
    document.querySelectorAll('.modal-backdrop').forEach(el => {
      el.addEventListener('click', e => { if (e.target === el) closeModal(el.id); });
    });

    // Auto-slug
    document.getElementById('m-nom').addEventListener('input', e => {
      document.getElementById('m-slug').value = e.target.value
        .toLowerCase().trim().replace(/\\s+/g, '-').replace(/[^a-z0-9-]/g, '');
    });

    async function loadMarquesInModal() {
      const r = await fetch('/api/marques');
      const marques = await r.json();
      const sel = document.getElementById('p-marque');
      sel.innerHTML = marques.map(m => \`<option value="\${m.id}">\${m.nom}</option>\`).join('');
    }

    async function addMarque() {
      const nom  = document.getElementById('m-nom').value.trim();
      const slug = document.getElementById('m-slug').value.trim();
      if (!nom || !slug) return;
      const r = await fetch('/api/marques', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ nom, slug })
      });
      if (!r.ok) return;
      const marque = await r.json();
      const sel = document.getElementById('select-marque');
      const opt = new Option(marque.nom, marque.id, true, true);
      sel.appendChild(opt);
      closeModal('modal-marque');
      document.getElementById('m-nom').value = '';
      document.getElementById('m-slug').value = '';
    }

    async function addPack() {
      const data = {
        marque_id:   document.getElementById('p-marque').value,
        nom:         document.getElementById('p-nom').value.trim(),
        nb_couleurs: document.getElementById('p-nb').value,
        prix_approx: document.getElementById('p-prix').value,
        lien_temu:   document.getElementById('p-temu').value,
        lien_amazon: document.getElementById('p-amazon').value,
      };
      if (!data.marque_id || !data.nom) return;
      const r = await fetch('/api/packs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      });
      if (!r.ok) return;
      const pack = await r.json();
      const sel = document.getElementById('select-pack');
      const label = \`\${pack.marque_nom} — \${pack.nom}\`;
      const opt = new Option(label, pack.id, true, true);
      sel.appendChild(opt);
      closeModal('modal-pack');
      ['p-nom','p-nb','p-prix','p-temu','p-amazon'].forEach(id => {
        document.getElementById(id).value = '';
      });
    }

    // ── Ajout multiple AJAX ──────────────────────────────────────────────────
    const btnSave     = document.getElementById('btn-save');
    const btnSaveQuit = document.getElementById('btn-save-quit');

    async function saveCouleur() {
      const form = document.querySelector('.form-panel form');
      const data = {
        marque_id:   document.getElementById('select-marque').value,
        reference:   form.querySelector('[name=reference]').value.trim(),
        hex:         document.getElementById('hex-input').value,
        r:           document.getElementById('r-input').value,
        g:           document.getElementById('g-input').value,
        b:           document.getElementById('b-input').value,
        hex_photo:   document.getElementById('hex-photo-input').value || null,
        r_photo:     document.getElementById('r-photo-input').value   || null,
        g_photo:     document.getElementById('g-photo-input').value   || null,
        b_photo:     document.getElementById('b-photo-input').value   || null,
        medium:      form.querySelector('[name=medium]').value || 'acrylique',
        pointe_id:   form.querySelector('[name=pointe_id]').value,
        pack_min_id: document.getElementById('select-pack').value,
      };
      if (!data.marque_id || !data.reference || !data.hex) {
        alert('Marque, référence et couleur sont requis.');
        return null;
      }
      const r = await fetch('/api/couleurs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      });
      if (!r.ok) { alert('Erreur lors de l\\'enregistrement.'); return null; }
      return { ...(await r.json()), ...data };
    }

    function addToSessionList(couleur) {
      const list = document.getElementById('added-list');
      const items = document.getElementById('added-items');
      list.style.display = 'block';
      const div = document.createElement('div');
      div.className = 'added-item';
      div.innerHTML = \`
        <span class="added-swatch" style="background:\${couleur.hex}"></span>
        <span class="added-ref">\${couleur.reference}</span>
        <span class="added-hex">\${couleur.hex.toUpperCase()}</span>
      \`;
      items.prepend(div);
    }

    function resetColorFields() {
      const form = document.querySelector('.form-panel form');
      form.querySelector('[name=reference]').value = '';
      document.getElementById('hex-input').value   = '';
      document.getElementById('r-input').value     = '';
      document.getElementById('g-input').value     = '';
      document.getElementById('b-input').value     = '';
      document.getElementById('color-picker').value = '#ffffff';
      form.querySelector('[name=reference]').focus();
    }

    if (btnSave) {
      btnSave.addEventListener('click', async () => {
        const couleur = await saveCouleur();
        if (!couleur) return;
        addToSessionList(couleur);
        resetColorFields();
      });
    }

    if (btnSaveQuit) {
      btnSaveQuit.addEventListener('click', async () => {
        const couleur = await saveCouleur();
        if (couleur) window.location.href = '/couleurs';
      });
    }
  </script>
</body>
</html>`;
}

function renderBulkEdit(couleurs, marques, pointes, packs, filters) {
  const optMarques = marques.map(m =>
    `<option value="${m.id}" ${filters.marque_id == m.id ? 'selected' : ''}>${m.nom}</option>`
  ).join('');

  const optPointes = ['<option value="">— Inchangée —</option>', '<option value="null">— Aucune —</option>',
    ...pointes.map(p => `<option value="${p.id}">${p.nom}</option>`)
  ].join('');

  const optPacks = ['<option value="">— Inchangé —</option>', '<option value="null">— Aucun —</option>',
    ...packs.map(p => `<option value="${p.id}">${p.marque_nom} — ${p.nom}</option>`)
  ].join('');

  const rows = couleurs.map(c => `
    <tr>
      <td><input type="checkbox" class="row-check" value="${c.id}"></td>
      <td><span class="color-swatch" style="background:${c.hex}"></span></td>
      <td>${c.marque_nom}</td>
      <td>${c.reference}</td>
      <td>${c.hex}</td>
      <td class="cell-photo">${c.hex_photo ? `<span class="color-swatch" style="background:${c.hex_photo}"></span> ${c.hex_photo}` : '<span class="missing">—</span>'}</td>
      <td>${c.pointe_nom || '<span class="missing">—</span>'}</td>
      <td>${c.pack_nom || '<span class="missing">—</span>'}</td>
    </tr>`).join('');

  return `<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Nuancier — Édition en masse</title>
  <link rel="stylesheet" href="/css/style.css">
  <style>
    .bulk-bar {
      position: sticky;
      top: 0;
      z-index: 10;
      background: #fff;
      border-bottom: 2px solid #e0e0e0;
      padding: 0.75rem 1rem;
      display: flex;
      align-items: center;
      gap: 1rem;
      flex-wrap: wrap;
    }
    .bulk-bar select { min-width: 180px; }
    .bulk-bar .count-label { font-size: 0.85rem; color: #666; white-space: nowrap; }
    .bulk-bar .sep { width: 1px; height: 24px; background: #ddd; }
    table td.cell-photo { font-size: 0.82rem; }
    .missing { color: #bbb; }
    td input[type=checkbox] { width: 16px; height: 16px; cursor: pointer; }
    th:first-child { width: 36px; }
    .select-all-row th { background: #f8f8f8; }
  </style>
</head>
<body>
  ${nav()}
  <main>
    <div class="page-header">
      <h1>Édition en masse <span class="count">(${couleurs.length})</span></h1>
      <a href="/couleurs">← Retour</a>
    </div>

    <form method="GET" action="/couleurs/bulk" class="filters">
      <select name="marque_id">
        <option value="">Toutes les marques</option>
        ${optMarques}
      </select>
      <button type="submit">Filtrer</button>
      <a href="/couleurs/bulk">Réinitialiser</a>
    </form>

    <div class="bulk-bar">
      <label class="count-label"><span id="sel-count">0</span> sélectionnée(s)</label>
      <div class="sep"></div>
      <label>Pointe</label>
      <select id="bulk-pointe">${optPointes}</select>
      <label>Pack contenant la référence</label>
      <select id="bulk-pack">${optPacks}</select>
      <button type="button" id="btn-apply-bulk" class="btn-primary" disabled>Appliquer</button>
      <div class="sep"></div>
      <button type="button" id="btn-select-all" class="btn-secondary">Tout sélectionner</button>
      <button type="button" id="btn-deselect-all" class="btn-secondary">Tout désélectionner</button>
      <span id="bulk-status" style="font-size:0.85rem;color:#27ae60;display:none"></span>
    </div>

    <table>
      <thead>
        <tr>
          <th><input type="checkbox" id="check-all"></th>
          <th>Couleur</th>
          <th>Marque</th>
          <th>Référence</th>
          <th>Hex (scan)</th>
          <th>Hex (photo)</th>
          <th>Pointe</th>
          <th>Pack min</th>
        </tr>
      </thead>
      <tbody>
        ${rows || '<tr><td colspan="8">Aucune couleur.</td></tr>'}
      </tbody>
    </table>
  </main>

  <script>
    const checkAll = document.getElementById('check-all');
    const btnApply = document.getElementById('btn-apply-bulk');
    const btnSelAll = document.getElementById('btn-select-all');
    const btnDeselAll = document.getElementById('btn-deselect-all');
    const selCount = document.getElementById('sel-count');
    const bulkStatus = document.getElementById('bulk-status');

    function getChecked() {
      return [...document.querySelectorAll('.row-check:checked')].map(el => parseInt(el.value));
    }

    function updateUI() {
      const n = getChecked().length;
      selCount.textContent = n;
      btnApply.disabled = n === 0;
    }

    document.querySelectorAll('.row-check').forEach(cb => {
      cb.addEventListener('change', updateUI);
    });

    checkAll.addEventListener('change', () => {
      document.querySelectorAll('.row-check').forEach(cb => cb.checked = checkAll.checked);
      updateUI();
    });

    btnSelAll.addEventListener('click', () => {
      document.querySelectorAll('.row-check').forEach(cb => cb.checked = true);
      checkAll.checked = true;
      updateUI();
    });

    btnDeselAll.addEventListener('click', () => {
      document.querySelectorAll('.row-check').forEach(cb => cb.checked = false);
      checkAll.checked = false;
      updateUI();
    });

    btnApply.addEventListener('click', async () => {
      const ids = getChecked();
      if (!ids.length) return;

      const pointeVal = document.getElementById('bulk-pointe').value;
      const packVal   = document.getElementById('bulk-pack').value;

      const body = { ids };
      if (pointeVal !== '') body.pointe_id   = pointeVal === 'null' ? null : pointeVal;
      if (packVal   !== '') body.pack_min_id = packVal   === 'null' ? null : packVal;

      if (!('pointe_id' in body) && !('pack_min_id' in body)) {
        alert('Sélectionne au moins une valeur à appliquer (Pointe ou Pack).');
        return;
      }

      btnApply.disabled = true;
      const r = await fetch('/api/couleurs/bulk', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
      });
      const data = await r.json();
      if (r.ok) {
        bulkStatus.textContent = '✓ ' + data.updated + ' couleur(s) mise(s) à jour';
        bulkStatus.style.display = 'inline';
        setTimeout(() => { bulkStatus.style.display = 'none'; }, 3000);
      } else {
        alert('Erreur : ' + (data.error || 'inconnue'));
      }
      btnApply.disabled = false;
    });
  </script>
</body>
</html>`;
}

export default router;
