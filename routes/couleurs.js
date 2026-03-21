import express from 'express';
import pool    from '../db.js';
import { requireAuth } from '../middleware/auth.js';

const router = express.Router();

// Liste des couleurs
router.get('/couleurs', requireAuth, async (req, res) => {
  const { marque_id, ref } = req.query;
  let conn;
  try {
    conn = await pool.getConnection();
    const marques = await conn.query('SELECT * FROM marques ORDER BY nom');

    let sql = `
      SELECT c.*, m.nom AS marque_nom
      FROM couleurs c
      JOIN marques m ON m.id = c.marque_id
      WHERE 1=1
    `;
    const params = [];
    if (marque_id) { sql += ' AND c.marque_id = ?'; params.push(marque_id); }
    if (ref)       { sql += ' AND c.reference LIKE ?'; params.push(`%${ref}%`); }
    sql += ' ORDER BY m.nom, c.reference';

    const couleurs = await conn.query(sql, params);

    res.send(renderCouleurs(couleurs, marques, { marque_id, ref }));
  } catch (err) {
    console.error(err);
    res.status(500).send('Erreur serveur');
  } finally {
    if (conn) conn.release();
  }
});

// Formulaire ajout
router.get('/couleurs/new', requireAuth, async (req, res) => {
  let conn;
  try {
    conn = await pool.getConnection();
    const marques = await conn.query('SELECT * FROM marques ORDER BY nom');
    const pointes = await conn.query('SELECT * FROM pointes ORDER BY nom');
    const packs   = await conn.query('SELECT p.*, m.nom AS marque_nom FROM packs p JOIN marques m ON m.id = p.marque_id ORDER BY m.nom, p.nom');
    res.send(renderForm({ marques, pointes, packs, couleur: null }));
  } catch (err) {
    console.error(err);
    res.status(500).send('Erreur serveur');
  } finally {
    if (conn) conn.release();
  }
});

// INSERT couleur (form classique → redirect)
router.post('/couleurs', requireAuth, async (req, res) => {
  const { marque_id, reference, hex, r, g, b, hex_photo, r_photo, g_photo, b_photo, pointe_id, pack_min_id } = req.body;
  let conn;
  try {
    conn = await pool.getConnection();
    await conn.query(
      'INSERT INTO couleurs (marque_id, reference, hex, r, g, b, hex_photo, r_photo, g_photo, b_photo, pointe_id, pack_min_id) VALUES (?,?,?,?,?,?,?,?,?,?,?,?)',
      [marque_id, reference, hex, r, g, b, hex_photo || null, r_photo || null, g_photo || null, b_photo || null, pointe_id || null, pack_min_id || null]
    );
    res.redirect('/couleurs');
  } catch (err) {
    console.error(err);
    res.status(500).send('Erreur serveur');
  } finally {
    if (conn) conn.release();
  }
});

// INSERT couleur (API JSON → pas de redirect, pour ajout multiple)
router.post('/api/couleurs', requireAuth, async (req, res) => {
  const { marque_id, reference, hex, r, g, b, hex_photo, r_photo, g_photo, b_photo, pointe_id, pack_min_id } = req.body;
  if (!marque_id || !reference || !hex) return res.status(400).json({ error: 'Champs manquants' });
  let conn;
  try {
    conn = await pool.getConnection();
    const result = await conn.query(
      'INSERT INTO couleurs (marque_id, reference, hex, r, g, b, hex_photo, r_photo, g_photo, b_photo, pointe_id, pack_min_id) VALUES (?,?,?,?,?,?,?,?,?,?,?,?)',
      [marque_id, reference, hex, r, g, b, hex_photo || null, r_photo || null, g_photo || null, b_photo || null, pointe_id || null, pack_min_id || null]
    );
    res.json({ id: Number(result.insertId), reference, hex, r, g, b });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Erreur serveur' });
  } finally {
    if (conn) conn.release();
  }
});

// Formulaire édition
router.get('/couleurs/:id/edit', requireAuth, async (req, res) => {
  let conn;
  try {
    conn = await pool.getConnection();
    const [couleur] = await conn.query('SELECT * FROM couleurs WHERE id = ?', [req.params.id]);
    if (!couleur) return res.redirect('/couleurs');
    const marques = await conn.query('SELECT * FROM marques ORDER BY nom');
    const pointes = await conn.query('SELECT * FROM pointes ORDER BY nom');
    const packs   = await conn.query('SELECT p.*, m.nom AS marque_nom FROM packs p JOIN marques m ON m.id = p.marque_id ORDER BY m.nom, p.nom');
    res.send(renderForm({ marques, pointes, packs, couleur }));
  } catch (err) {
    console.error(err);
    res.status(500).send('Erreur serveur');
  } finally {
    if (conn) conn.release();
  }
});

// UPDATE couleur
router.post('/couleurs/:id', requireAuth, async (req, res) => {
  const { marque_id, reference, hex, r, g, b, hex_photo, r_photo, g_photo, b_photo, pointe_id, pack_min_id } = req.body;
  let conn;
  try {
    conn = await pool.getConnection();
    await conn.query(
      'UPDATE couleurs SET marque_id=?, reference=?, hex=?, r=?, g=?, b=?, hex_photo=?, r_photo=?, g_photo=?, b_photo=?, pointe_id=?, pack_min_id=? WHERE id=?',
      [marque_id, reference, hex, r, g, b, hex_photo || null, r_photo || null, g_photo || null, b_photo || null, pointe_id || null, pack_min_id || null, req.params.id]
    );
    res.redirect('/couleurs');
  } catch (err) {
    console.error(err);
    res.status(500).send('Erreur serveur');
  } finally {
    if (conn) conn.release();
  }
});

// DELETE couleur
router.post('/couleurs/:id/delete', requireAuth, async (req, res) => {
  let conn;
  try {
    conn = await pool.getConnection();
    await conn.query('DELETE FROM couleurs WHERE id = ?', [req.params.id]);
    res.redirect('/couleurs');
  } catch (err) {
    console.error(err);
    res.status(500).send('Erreur serveur');
  } finally {
    if (conn) conn.release();
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
    <tr>
      <td><span class="color-swatch" style="background:${c.hex}"></span></td>
      <td>${c.marque_nom}</td>
      <td>${c.reference}</td>
      <td>${c.hex}</td>
      <td>${c.r} / ${c.g} / ${c.b}</td>
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
      <a href="/couleurs/new" class="btn-primary">+ Ajouter</a>
    </div>

    <form method="GET" action="/couleurs" class="filters">
      <select name="marque_id">
        <option value="">Toutes les marques</option>
        ${options}
      </select>
      <input type="text" name="ref" placeholder="Référence..." value="${filters.ref || ''}">
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
          <th>Actions</th>
        </tr>
      </thead>
      <tbody>
        ${rows || '<tr><td colspan="6">Aucune couleur enregistrée.</td></tr>'}
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
          <input type="file" id="sampling-file" accept="image/*" style="display:none">
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
            <div id="sampling-lens"><canvas id="sampling-lens-c" width="110" height="110"></canvas></div>
          </div>
        </div>

        <div id="sampling-controls" style="display:none">
          <div class="sampling-wb">
            <button type="button" id="btn-wb" disabled>Cliquer sur zone blanche</button>
            <span id="wb-status" class="wb-status pending">Non définie</span>
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
            <label>Pointe</label>
            <select name="pointe_id">${optPointes}</select>
          </div>

          <div class="form-group">
            <label>Pack minimum</label>
            <div class="select-with-add">
              <select name="pack_min_id" id="select-pack">${optPacks}</select>
              <button type="button" class="btn-add-inline" onclick="openModal('modal-pack')">+</button>
            </div>
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

export default router;
