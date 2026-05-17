import express from 'express';
import pool    from '../db.js';
import { requireAuth } from '../middleware/auth.js';

const router = express.Router();

// Écrit pack_couleurs depuis une liste de pack_ids fournie manuellement.
async function syncPackCouleurs(couleurId, packIds) {
  await pool.query('DELETE FROM pack_couleurs WHERE couleur_id = ?', [couleurId]);
  if (!packIds || !packIds.length) return;
  await pool.query('INSERT INTO pack_couleurs (couleur_id, pack_id) VALUES ?', [packIds.map(id => [couleurId, id])]);
}

// Recalcule pack_couleurs depuis pack_min_id : inclut le pack min et tous les packs
// plus grands de la même marque. Si pack_min_id est null, inclut tous les packs de la marque.
async function syncPackCouleursByMin(couleurId, packMinId, marqueId) {
  await pool.query('DELETE FROM pack_couleurs WHERE couleur_id = ?', [couleurId]);
  let packs;
  if (packMinId) {
    const [[packMin]] = await pool.query('SELECT marque_id, nb_couleurs FROM packs WHERE id = ?', [packMinId]);
    if (!packMin) return;
    if (packMin.nb_couleurs != null) {
      [packs] = await pool.query('SELECT id FROM packs WHERE marque_id = ? AND nb_couleurs >= ?', [packMin.marque_id, packMin.nb_couleurs]);
    } else {
      packs = [{ id: packMinId }];
    }
  } else if (marqueId) {
    [packs] = await pool.query('SELECT id FROM packs WHERE marque_id = ?', [marqueId]);
  }
  if (!packs || !packs.length) return;
  await pool.query('INSERT INTO pack_couleurs (couleur_id, pack_id) VALUES ?', [packs.map(p => [couleurId, p.id])]);
}

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
    const [resMediums] = await pool.query('SELECT * FROM mediums ORDER BY nom');
    res.send(renderForm({ marques: resMarques, pointes: resPointes, packs: resPacks, mediums: resMediums, couleur: null, packCouleurs: [] }));
  } catch (err) {
    console.error(err);
    res.status(500).send('Erreur serveur');
  }
});

// INSERT couleur (form classique → redirect)
router.post('/couleurs', requireAuth, async (req, res) => {
  const { marque_id, reference, hex, r, g, b, hex_photo, r_photo, g_photo, b_photo, medium, pointe_id, pack_min_id } = req.body;
  const rawPc = req.body.pack_couleurs;
  const packIds = rawPc ? (Array.isArray(rawPc) ? rawPc : [rawPc]).map(Number).filter(Boolean) : null;
  try {
    const [result] = await pool.query(
      'INSERT INTO couleurs (marque_id, reference, hex, r, g, b, hex_photo, r_photo, g_photo, b_photo, medium, pointe_id, pack_min_id) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?)',
      [marque_id, reference, hex, r, g, b, hex_photo || null, r_photo || null, g_photo || null, b_photo || null, medium || 'Feutre acrylique', pointe_id || null, pack_min_id || null]
    );
    if (packIds) {
      await syncPackCouleurs(result.insertId, packIds);
    } else {
      await syncPackCouleursByMin(result.insertId, pack_min_id || null, marque_id || null);
    }
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
  const rawPc = req.body.pack_couleurs;
  const packIds = rawPc ? (Array.isArray(rawPc) ? rawPc : [rawPc]).map(Number).filter(Boolean) : null;
  try {
    const [result] = await pool.query(
      'INSERT INTO couleurs (marque_id, reference, hex, r, g, b, hex_photo, r_photo, g_photo, b_photo, medium, pointe_id, pack_min_id) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?)',
      [marque_id, reference, hex, r, g, b, hex_photo || null, r_photo || null, g_photo || null, b_photo || null, medium || 'Feutre acrylique', pointe_id || null, pack_min_id || null]
    );
    if (packIds) {
      await syncPackCouleurs(result.insertId, packIds);
    } else {
      await syncPackCouleursByMin(result.insertId, pack_min_id || null, marque_id || null);
    }
    res.json({ id: result.insertId, reference, hex, r, g, b });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

// Formulaire édition
router.get('/couleurs/:id/edit', requireAuth, async (req, res) => {
  try {
    const [resCouleur]     = await pool.query('SELECT * FROM couleurs WHERE id = ?', [req.params.id]);
    if (!resCouleur.length) return res.redirect('/couleurs');
    const [resMarques]     = await pool.query('SELECT * FROM marques ORDER BY nom');
    const [resPointes]     = await pool.query('SELECT * FROM pointes ORDER BY nom');
    const [resPacks]       = await pool.query('SELECT p.*, m.nom AS marque_nom FROM packs p JOIN marques m ON m.id = p.marque_id ORDER BY m.nom, p.nom');
    const [resMediums]     = await pool.query('SELECT * FROM mediums ORDER BY nom');
    const [resPackCouleurs] = await pool.query('SELECT pack_id FROM pack_couleurs WHERE couleur_id = ?', [req.params.id]);
    const packCouleurs = resPackCouleurs.map(r => r.pack_id);
    res.send(renderForm({ marques: resMarques, pointes: resPointes, packs: resPacks, mediums: resMediums, couleur: resCouleur[0], packCouleurs }));
  } catch (err) {
    console.error(err);
    res.status(500).send('Erreur serveur');
  }
});

// UPDATE couleur
router.post('/couleurs/:id', requireAuth, async (req, res) => {
  const { marque_id, reference, hex, r, g, b, hex_photo, r_photo, g_photo, b_photo, medium, pointe_id, pack_min_id, active } = req.body;
  const rawPc = req.body.pack_couleurs;
  const packIds = rawPc ? (Array.isArray(rawPc) ? rawPc : [rawPc]).map(Number).filter(Boolean) : null;
  try {
    await pool.query(
      'UPDATE couleurs SET marque_id=?, reference=?, hex=?, r=?, g=?, b=?, hex_photo=?, r_photo=?, g_photo=?, b_photo=?, medium=?, pointe_id=?, pack_min_id=?, active=? WHERE id=?',
      [marque_id, reference, hex, r, g, b, hex_photo || null, r_photo || null, g_photo || null, b_photo || null, medium || 'Feutre acrylique', pointe_id || null, pack_min_id || null, active === '1', req.params.id]
    );
    if (packIds) {
      await syncPackCouleurs(req.params.id, packIds);
    } else {
      await syncPackCouleursByMin(req.params.id, pack_min_id || null, marque_id || null);
    }
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
    await pool.query('DELETE FROM pack_couleurs WHERE couleur_id = ?', [req.params.id]);
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
    if (pack_min_id !== undefined) {
      const [[couleurRef]] = await pool.query('SELECT marque_id FROM couleurs WHERE id = ? LIMIT 1', [ids[0]]);
      const marqueId = couleurRef?.marque_id || null;
      for (const id of ids) {
        await syncPackCouleursByMin(id, pack_min_id || null, marqueId);
      }
    }
    res.json({ updated: result.affectedRows });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

// API suppression en masse
router.post('/api/couleurs/bulk-delete', requireAuth, async (req, res) => {
  const { ids } = req.body;
  if (!ids || !ids.length) return res.status(400).json({ error: 'Aucune couleur sélectionnée' });
  try {
    await pool.query('DELETE FROM pack_couleurs WHERE couleur_id IN (?)', [ids]);
    const [result] = await pool.query('DELETE FROM couleurs WHERE id IN (?)', [ids]);
    res.json({ deleted: result.affectedRows });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

// --- API Mediums ---

router.get('/api/mediums', requireAuth, async (req, res) => {
  try {
    const [rows] = await pool.query('SELECT * FROM mediums ORDER BY nom');
    res.json(rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

router.post('/api/mediums', requireAuth, async (req, res) => {
  const { nom } = req.body;
  if (!nom) return res.status(400).json({ error: 'Nom requis' });
  try {
    const [result] = await pool.query('INSERT INTO mediums (nom) VALUES (?)', [nom.trim()]);
    res.json({ id: result.insertId, nom: nom.trim() });
  } catch (err) {
    if (err.code === 'ER_DUP_ENTRY') return res.status(409).json({ error: 'Ce medium existe déjà' });
    console.error(err);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

router.post('/api/mediums/:id/delete', requireAuth, async (req, res) => {
  try {
    await pool.query('DELETE FROM mediums WHERE id = ?', [req.params.id]);
    res.json({ ok: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

// Page correction batch
router.get('/couleurs/correction', requireAuth, async (req, res) => {
  try {
    const [couleurs] = await pool.query(`
      SELECT c.id, c.reference, c.r, c.g, c.b, c.hex,
             c.r_photo, c.g_photo, c.b_photo, c.hex_photo,
             c.marque_id, m.nom AS marque_nom
      FROM couleurs c
      JOIN marques m ON m.id = c.marque_id
      ORDER BY m.nom, c.reference
    `);
    const [marques] = await pool.query('SELECT * FROM marques ORDER BY nom');
    res.send(renderCorrection(couleurs, marques));
  } catch (err) {
    console.error(err);
    res.status(500).send('Erreur serveur');
  }
});

// API correction batch — applique les valeurs corrigées dans hex_photo / r_photo / g_photo / b_photo
router.post('/api/couleurs/correction', requireAuth, async (req, res) => {
  const { corrections } = req.body;
  if (!corrections || !corrections.length) return res.status(400).json({ error: 'Aucune correction' });
  try {
    for (const c of corrections) {
      const hex = '#' + [c.r, c.g, c.b].map(v => Math.max(0, Math.min(255, Math.round(v))).toString(16).padStart(2, '0')).join('');
      await pool.query(
        'UPDATE couleurs SET hex_photo=?, r_photo=?, g_photo=?, b_photo=? WHERE id=?',
        [hex, Math.round(c.r), Math.round(c.g), Math.round(c.b), c.id]
      );
    }
    res.json({ updated: corrections.length });
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
        <a href="/couleurs/correction">Correction batch</a>
        <a href="/packs">Packs</a>
        <form method="POST" action="/logout" style="display:inline">
          <button type="submit">Déconnexion</button>
        </form>
      </div>
    </nav>`;
}

function renderCorrection(couleurs, marques) {
  const couleursJson = JSON.stringify(couleurs.map(c => ({
    id: c.id, reference: c.reference,
    marque_id: c.marque_id, marque_nom: c.marque_nom,
    r: c.r, g: c.g, b: c.b, hex: c.hex,
    hasPhoto: c.r_photo != null,
    rp: c.r_photo, gp: c.g_photo, bp: c.b_photo, hexP: c.hex_photo
  })));

  const optMarques = marques.map(m => `<option value="${m.id}">${m.nom}</option>`).join('');

  return `<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Révélo BO — Correction batch</title>
  <link rel="stylesheet" href="/css/style.css">
  <style>
    .correction-grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(210px,1fr));gap:8px;margin-top:16px}
    .correction-card{border:1px solid #ddd;border-radius:6px;padding:8px;display:flex;gap:8px;align-items:center}
    .correction-card.has-photo{opacity:0.45}
    .swatch-pair{display:flex;gap:4px;flex-shrink:0}
    .swatch-col{display:flex;flex-direction:column;align-items:center;gap:2px}
    .swatch-sm{width:36px;height:36px;border-radius:4px;border:1px solid #ccc}
    .swatch-lbl{font-size:10px;color:#888}
    .correction-ref{font-weight:600;font-size:13px}
    .correction-brand{font-size:11px;color:#888}
    .correction-hex{font-size:10px;color:#aaa;font-family:monospace}
    .photo-warn{font-size:10px;color:#e67e22}
    .settings-panel{background:#f5f5f5;border-radius:8px;padding:16px;margin-bottom:16px}
    .s-row{display:grid;grid-template-columns:170px 1fr 54px;align-items:center;gap:8px;margin-bottom:10px}
    .stats-bar{background:#e8f4e8;border-radius:6px;padding:8px 12px;margin:12px 0;font-size:13px}
  </style>
</head>
<body>
  ${nav()}
  <main>
    <div class="page-header">
      <h1>Correction couleur batch</h1>
      <p style="color:#888;font-size:13px">Applique un boost de saturation et/ou un décalage de teinte sur une plage de teinte. Le résultat est stocké dans <code>hex_photo</code>.</p>
    </div>

    <div class="settings-panel">
      <div class="s-row">
        <label>Teinte — début</label>
        <input type="range" id="hueFrom" min="0" max="359" value="300">
        <span style="display:flex;align-items:center;gap:4px;justify-content:flex-end">
          <span id="hue-from-sw" style="width:16px;height:16px;border-radius:3px;border:1px solid #ccc;background:hsl(300,80%,50%);display:inline-block;flex-shrink:0"></span>
          <span id="hueFromVal">300°</span>
        </span>
      </div>
      <div class="s-row">
        <label>Teinte — fin</label>
        <input type="range" id="hueTo" min="0" max="359" value="70">
        <span style="display:flex;align-items:center;gap:4px;justify-content:flex-end">
          <span id="hue-to-sw" style="width:16px;height:16px;border-radius:3px;border:1px solid #ccc;background:hsl(70,80%,50%);display:inline-block;flex-shrink:0"></span>
          <span id="hueToVal">70°</span>
        </span>
      </div>
      <div style="margin:2px 0 10px;position:relative;height:20px">
        <div style="position:absolute;inset:0;border-radius:4px;background:linear-gradient(to right,hsl(0,80%,55%),hsl(30,80%,55%),hsl(60,80%,55%),hsl(90,80%,55%),hsl(120,80%,55%),hsl(150,80%,55%),hsl(180,80%,55%),hsl(210,80%,55%),hsl(240,80%,55%),hsl(270,80%,55%),hsl(300,80%,55%),hsl(330,80%,55%),hsl(360,80%,55%))"></div>
        <div id="hue-m-from" style="position:absolute;width:3px;height:100%;top:0;left:83.6%;background:rgba(0,0,0,0.75);border-radius:2px;transform:translateX(-50%)"></div>
        <div id="hue-m-to" style="position:absolute;width:3px;height:100%;top:0;left:19.5%;background:rgba(0,0,0,0.75);border-radius:2px;transform:translateX(-50%)"></div>
      </div>
      <small style="color:#888;display:block;margin-bottom:12px">Plage 300°→70° = bordeaux, rouges, oranges, jaunes (avec passage par 0°). Plage 40°→70° = jaunes seuls.</small>

      <div class="s-row">
        <label>Boost saturation</label>
        <input type="range" id="satBoost" min="0" max="80" value="20">
        <span id="satBoostVal">+20%</span>
      </div>
      <div class="s-row">
        <label>Décalage teinte</label>
        <input type="range" id="hueShift" min="-30" max="30" value="0">
        <span id="hueShiftVal">0°</span>
      </div>
      <div class="s-row">
        <label>Aperçu correction</label>
        <div style="display:flex;gap:8px;align-items:center">
          <span style="display:flex;flex-direction:column;align-items:center;gap:2px">
            <span style="width:22px;height:22px;border-radius:3px;border:1px solid #ccc;background:hsl(30,70%,50%);display:block"></span>
            <span style="font-size:10px;color:#888">avant</span>
          </span>
          <span style="color:#ccc">→</span>
          <span style="display:flex;flex-direction:column;align-items:center;gap:2px">
            <span id="sample-after" style="width:22px;height:22px;border-radius:3px;border:1px solid #ccc;display:block"></span>
            <span style="font-size:10px;color:#888">après</span>
          </span>
          <span style="font-size:11px;color:#888">sur orange de référence</span>
        </div>
        <span></span>
      </div>
      <div class="s-row">
        <label>Modulation chroma</label>
        <label style="font-size:13px"><input type="checkbox" id="chromaMod" checked> Réduire le boost pour les couleurs désaturées (bruns)</label>
        <span></span>
      </div>
      <div class="s-row">
        <label>Filtre marque</label>
        <select id="filterMarque" style="width:100%">
          <option value="">Toutes les marques</option>
          ${optMarques}
        </select>
        <span></span>
      </div>
      <div class="s-row">
        <label>Référence</label>
        <input type="text" id="filterRef" placeholder="ex: 821 ou cs 50…" style="width:100%">
        <span></span>
      </div>
      <div class="s-row">
        <label>Écraser existants</label>
        <label style="font-size:13px"><input type="checkbox" id="overwrite"> Inclure les couleurs qui ont déjà une valeur photo (affichées en grisé)</label>
        <span></span>
      </div>
      <div style="margin-top:14px;display:flex;gap:8px;align-items:center;flex-wrap:wrap">
        <button class="btn-primary" id="btn-preview">Prévisualiser</button>
        <button class="btn-delete" id="btn-apply" disabled>Appliquer (0 couleurs)</button>
        <button type="button" id="btn-check-all" style="display:none;background:none;border:1px solid #ccc;border-radius:4px;padding:4px 10px;cursor:pointer;font-size:12px">Tout cocher</button>
        <button type="button" id="btn-uncheck-all" style="display:none;background:none;border:1px solid #ccc;border-radius:4px;padding:4px 10px;cursor:pointer;font-size:12px">Tout décocher</button>
      </div>
    </div>

    <div id="stats-bar" class="stats-bar" style="display:none"></div>
    <div id="correction-grid" class="correction-grid"></div>
    <button id="btn-apply2" class="btn-delete" style="display:none;margin:12px 0" disabled>Appliquer les couleurs cochées</button>
  </main>

  <script>
  const ALL_COLORS = ${couleursJson};
  let pending = [];

  function rgbToHsl(r,g,b){
    r/=255;g/=255;b/=255;
    const max=Math.max(r,g,b),min=Math.min(r,g,b),l=(max+min)/2;
    if(max===min)return[0,0,l];
    const d=max-min,s=l>0.5?d/(2-max-min):d/(max+min);
    let h;
    switch(max){case r:h=((g-b)/d+(g<b?6:0))/6;break;case g:h=((b-r)/d+2)/6;break;default:h=((r-g)/d+4)/6;}
    return[h*360,s,l];
  }
  function hslToRgb(h,s,l){
    h/=360;
    if(s===0){const v=Math.round(l*255);return[v,v,v];}
    const q=l<0.5?l*(1+s):l+s-l*s,p=2*l-q;
    const f=(p,q,t)=>{if(t<0)t+=1;if(t>1)t-=1;if(t<1/6)return p+(q-p)*6*t;if(t<1/2)return q;if(t<2/3)return p+(q-p)*(2/3-t)*6;return p;};
    return[Math.round(f(p,q,h+1/3)*255),Math.round(f(p,q,h)*255),Math.round(f(p,q,h-1/3)*255)];
  }
  function toHex(r,g,b){return'#'+[r,g,b].map(v=>Math.max(0,Math.min(255,v)).toString(16).padStart(2,'0')).join('');}
  function inRange(h,from,to){return from<=to?h>=from&&h<=to:h>=from||h<=to;}

  function correct(r,g,b,satBoost,hueShift,chromaMod){
    let[h,s,l]=rgbToHsl(r,g,b);
    const mod=chromaMod?Math.min(1,s/0.25):1;
    const newS=Math.min(1,s+(satBoost/100)*mod);
    const newH=((h+hueShift)+360)%360;
    return hslToRgb(newH,newS,l);
  }

  document.getElementById('btn-preview').addEventListener('click',()=>{
    const hFrom  =+document.getElementById('hueFrom').value;
    const hTo    =+document.getElementById('hueTo').value;
    const sat    =+document.getElementById('satBoost').value;
    const shift  =+document.getElementById('hueShift').value;
    const chroma = document.getElementById('chromaMod').checked;
    const over   = document.getElementById('overwrite').checked;
    const marque = document.getElementById('filterMarque').value;
    const refFilter = document.getElementById('filterRef').value.trim().toLowerCase();

    pending=[];const cards=[];
    let nBrand=0,nPhoto=0,nHue=0;
    for(const c of ALL_COLORS){
      if(marque&&String(c.marque_id)!==String(marque))continue;
      if(refFilter&&c.reference.toLowerCase()!==refFilter)continue;
      nBrand++;
      if(c.hasPhoto&&!over){nPhoto++;continue;}
      const baseR=c.hasPhoto?Number(c.rp):Number(c.r);
      const baseG=c.hasPhoto?Number(c.gp):Number(c.g);
      const baseB=c.hasPhoto?Number(c.bp):Number(c.b);
      const baseHex=c.hasPhoto?c.hexP:c.hex;
      const[h]=rgbToHsl(baseR,baseG,baseB);
      if(!refFilter&&!inRange(h,hFrom,hTo)){nHue++;continue;}
      const[nr,ng,nb]=correct(baseR,baseG,baseB,sat,shift,chroma);
      const newHex=toHex(nr,ng,nb);
      pending.push({id:c.id,r:nr,g:ng,b:nb});
      const baseLbl=c.hasPhoto?'photo':'scan';
      cards.push(\`<div class="correction-card\${c.hasPhoto?' has-photo':''}" data-id="\${c.id}" data-br="\${baseR}" data-bg="\${baseG}" data-bb="\${baseB}">
        <input type="checkbox" class="card-check" data-id="\${c.id}" checked style="margin-right:2px;flex-shrink:0">
        <div class="swatch-pair">
          <div class="swatch-col"><div class="swatch-sm" style="background:\${baseHex}"></div><div class="swatch-lbl">\${baseLbl}</div></div>
          <div class="swatch-col"><div class="swatch-sm" style="background:\${newHex}"></div><div class="swatch-lbl">corrigé</div></div>
        </div>
        <div>
          <div class="correction-ref">\${c.reference}</div>
          <div class="correction-brand">\${c.marque_nom}</div>
          <div class="correction-hex" data-base="\${baseHex}" data-new="\${newHex}">\${baseHex} → \${newHex}</div>
          \${c.hasPhoto?'<div class="photo-warn">⚠ base = valeur photo</div>':''}
        </div>
      </div>\`);
    }
    document.getElementById('correction-grid').innerHTML=cards.length?cards.join(''):'<p style="color:#888">Aucune couleur dans cette plage.</p>';
    document.getElementById('stats-bar').style.display='';
    var dbg='<b>'+pending.length+' couleur(s) retenue(s)</b>';
    if(marque)dbg+=' — marque filtrée : '+nBrand+' couleurs';
    dbg+=' — exclues valeur photo : '+nPhoto+', exclues hors plage : '+nHue;
    document.getElementById('stats-bar').innerHTML=dbg;
    var hasCards=pending.length>0;
    document.getElementById('btn-check-all').style.display=hasCards?'':'none';
    document.getElementById('btn-uncheck-all').style.display=hasCards?'':'none';
    updateApplyBtn();
    document.getElementById('correction-grid').addEventListener('change',updateApplyBtn);
    updateVis();
  });

  function updateApplyBtn(){
    const n=document.querySelectorAll('#correction-grid .card-check:checked').length;
    const btn=document.getElementById('btn-apply');
    btn.disabled=n===0;
    btn.textContent='Appliquer ('+n+' couleur'+(n>1?'s':'')+')';
  }

  async function doApply(){
    const checkedIds=new Set([...document.querySelectorAll('#correction-grid .card-check:checked')].map(cb=>+cb.dataset.id));
    const toApply=pending.filter(p=>checkedIds.has(p.id));
    if(!toApply.length)return;
    if(!confirm('Appliquer la correction sur '+toApply.length+' couleur(s) ?'))return;
    const r=await fetch('/api/couleurs/correction',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({corrections:toApply})});
    if(r.ok){const{updated}=await r.json();alert(updated+' couleur(s) mises à jour.');location.reload();}
    else alert('Erreur lors de l\\'application.');
  }
  document.getElementById('btn-apply').addEventListener('click',doApply);
  document.getElementById('btn-apply2').addEventListener('click',doApply);

  document.getElementById('btn-check-all').addEventListener('click',()=>{
    document.querySelectorAll('#correction-grid .card-check').forEach(cb=>cb.checked=true);
    updateApplyBtn();
  });
  document.getElementById('btn-uncheck-all').addEventListener('click',()=>{
    document.querySelectorAll('#correction-grid .card-check').forEach(cb=>cb.checked=false);
    updateApplyBtn();
  });

  function dot(c){return'<span style="display:inline-block;width:11px;height:11px;border-radius:2px;border:1px solid #ccc;background:'+c+';vertical-align:middle;margin-right:3px"></span>';}

  function updateVis(){
    const from=+document.getElementById('hueFrom').value;
    const to=+document.getElementById('hueTo').value;
    const sat=+document.getElementById('satBoost').value;
    const shift=+document.getElementById('hueShift').value;
    const chroma=document.getElementById('chromaMod').checked;
    document.getElementById('hueFromVal').textContent=from+'°';
    document.getElementById('hue-from-sw').style.background='hsl('+from+',80%,50%)';
    document.getElementById('hue-m-from').style.left=(from/359*100).toFixed(1)+'%';
    document.getElementById('hueToVal').textContent=to+'°';
    document.getElementById('hue-to-sw').style.background='hsl('+to+',80%,50%)';
    document.getElementById('hue-m-to').style.left=(to/359*100).toFixed(1)+'%';
    document.getElementById('satBoostVal').textContent='+'+sat+'%';
    const v=shift;document.getElementById('hueShiftVal').textContent=(v>=0?'+':'')+v+'°';
    const[nr,ng,nb]=correct(217,127,38,sat,shift,chroma);
    document.getElementById('sample-after').style.background=toHex(nr,ng,nb);

    const cardEls=document.querySelectorAll('#correction-grid .correction-card[data-id]');
    if(!cardEls.length)return;
    const btnApply2=document.getElementById('btn-apply2');
    btnApply2.style.display='';
    btnApply2.disabled=false;
    if(cardEls.length>10)return;
    pending=[];
    cardEls.forEach(card=>{
      const br=+card.dataset.br,bg=+card.dataset.bg,bb=+card.dataset.bb,id=+card.dataset.id;
      const[cr,cg,cb]=correct(br,bg,bb,sat,shift,chroma);
      const newHex=toHex(cr,cg,cb);
      const swatches=card.querySelectorAll('.swatch-sm');
      if(swatches[1])swatches[1].style.background=newHex;
      const hexDiv=card.querySelector('.correction-hex');
      if(hexDiv){
        const baseHex=hexDiv.dataset.base;
        hexDiv.dataset.new=newHex;
        hexDiv.innerHTML=dot(baseHex)+baseHex+' → '+dot(newHex)+newHex;
      }
      pending.push({id,r:cr,g:cg,b:cb});
    });
    updateApplyBtn();
  }
  document.querySelectorAll('#hueFrom,#hueTo,#satBoost,#hueShift,#chromaMod').forEach(el=>el.addEventListener('input',updateVis));
  updateVis();
  </script>
</body>
</html>`;
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

function renderForm({ marques, pointes, packs, mediums, couleur, packCouleurs = [] }) {
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
            <div class="sample-adj">
              <div class="wb-slider-row">
                <span class="wb-slider-label">Luminosité</span>
                <input type="range" id="sample-bright" min="-60" max="60" value="0">
                <span id="sample-bright-val" class="wb-slider-val">0</span>
              </div>
              <div class="wb-slider-row">
                <span class="wb-slider-label">Température</span>
                <input type="range" id="sample-temp" min="-60" max="60" value="0">
                <span id="sample-temp-val" class="wb-slider-val">0</span>
              </div>
              <button type="button" id="sample-adj-reset" class="btn-secondary btn-sm">↺ Reset</button>
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
            <div class="select-with-add">
              <select name="medium" id="select-medium">
                ${(mediums || []).map(m =>
                  `<option value="${m.nom}" ${(v.medium || 'Feutre acrylique') === m.nom ? 'selected' : ''}>${m.nom}</option>`
                ).join('')}
              </select>
              <button type="button" class="btn-add-inline" onclick="openModal('modal-medium')">+</button>
            </div>
          </div>

          <div class="form-group">
            <label>Pointe</label>
            <select name="pointe_id">${optPointes}</select>
          </div>

          <div class="form-group">
            <label>Pack minimum contenant la référence</label>
            <div class="select-with-add">
              <select name="pack_min_id" id="select-pack">${optPacks}</select>
              <button type="button" class="btn-add-inline" onclick="openModal('modal-pack')">+</button>
            </div>
          </div>

          <div class="form-group">
            <label>Inclus dans les packs
              <button type="button" class="btn-add-inline" style="margin-left:8px" onclick="autoCalcPacks()">Recalculer auto.</button>
            </label>
            <select name="pack_couleurs" id="select-packs-multi" multiple size="5" style="width:100%">
              ${packs.map(p => `<option value="${p.id}" ${packCouleurs.includes(p.id) ? 'selected' : ''}>${p.marque_nom} — ${p.nom}</option>`).join('')}
            </select>
            <small style="color:#888">Ctrl+clic pour sélection multiple. Laisser vide = recalcul automatique depuis pack min.</small>
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

  <!-- Modale ajout medium -->
  <div class="modal-backdrop" id="modal-medium" style="display:none">
    <div class="modal">
      <h3>Ajouter un medium</h3>
      <div class="form-group">
        <label>Nom</label>
        <input type="text" id="med-nom" placeholder="ex: Feutre à alcool">
      </div>
      <div class="modal-actions">
        <button type="button" class="btn-primary" onclick="addMedium()">Ajouter</button>
        <button type="button" class="btn-secondary" onclick="closeModal('modal-medium')">Annuler</button>
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
    const ALL_PACKS = ${JSON.stringify(packs.map(p => ({ id: p.id, marque_id: p.marque_id, nb_couleurs: p.nb_couleurs || null })))};

    function autoCalcPacks() {
      const packMinId = Number(document.getElementById('select-pack').value);
      const multiSel  = document.getElementById('select-packs-multi');
      if (!packMinId) {
        Array.from(multiSel.options).forEach(o => o.selected = false);
        return;
      }
      const packMin = ALL_PACKS.find(p => p.id === packMinId);
      if (!packMin) return;
      Array.from(multiSel.options).forEach(opt => {
        const p = ALL_PACKS.find(x => x.id === Number(opt.value));
        opt.selected = p && p.marque_id === packMin.marque_id &&
          (packMin.nb_couleurs == null || p.nb_couleurs == null || p.nb_couleurs >= packMin.nb_couleurs);
      });
    }

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

    async function addMedium() {
      const nom = document.getElementById('med-nom').value.trim();
      if (!nom) return;
      const r = await fetch('/api/mediums', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ nom })
      });
      if (!r.ok) {
        const err = await r.json();
        alert(err.error || 'Erreur');
        return;
      }
      const medium = await r.json();
      const sel = document.getElementById('select-medium');
      const opt = new Option(medium.nom, medium.nom, true, true);
      sel.appendChild(opt);
      closeModal('modal-medium');
      document.getElementById('med-nom').value = '';
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
        pack_min_id:   document.getElementById('select-pack').value,
        pack_couleurs: [...document.getElementById('select-packs-multi').selectedOptions].map(o => Number(o.value)),
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
      <label>Pack minimum contenant la référence</label>
      <select id="bulk-pack">${optPacks}</select>
      <button type="button" id="btn-apply-bulk" class="btn-primary" disabled>Appliquer</button>
      <div class="sep"></div>
      <button type="button" id="btn-select-all" class="btn-secondary">Tout sélectionner</button>
      <button type="button" id="btn-deselect-all" class="btn-secondary">Tout désélectionner</button>
      <div class="sep"></div>
      <button type="button" id="btn-delete-bulk" class="btn-delete" disabled>Supprimer les sélectionnées</button>
      <span id="bulk-status" class="bulk-status-msg"></span>
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
          <th>Pack minimum</th>
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
    const btnDelete = document.getElementById('btn-delete-bulk');
    const btnSelAll = document.getElementById('btn-select-all');
    const btnDeselAll = document.getElementById('btn-deselect-all');
    const selCount = document.getElementById('sel-count');
    const bulkStatus = document.getElementById('bulk-status');

    function getChecked() {
      return [...document.querySelectorAll('.row-check:checked')].map(el => parseInt(el.value));
    }

    function showStatus(msg, isError) {
      bulkStatus.textContent = msg;
      bulkStatus.style.color = isError ? '#e74c3c' : '#27ae60';
      bulkStatus.style.display = 'inline';
      setTimeout(() => { bulkStatus.style.display = 'none'; }, 3000);
    }

    function updateUI() {
      const n = getChecked().length;
      selCount.textContent = n;
      btnApply.disabled = n === 0;
      btnDelete.disabled = n === 0;
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
        showStatus('✓ ' + data.updated + ' couleur(s) mise(s) à jour');
      } else {
        alert('Erreur : ' + (data.error || 'inconnue'));
      }
      btnApply.disabled = getChecked().length === 0;
    });

    btnDelete.addEventListener('click', async () => {
      const ids = getChecked();
      if (!ids.length) return;
      if (!confirm('Supprimer définitivement ' + ids.length + ' couleur(s) ? Cette action est irréversible.')) return;

      btnDelete.disabled = true;
      const r = await fetch('/api/couleurs/bulk-delete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ids })
      });
      const data = await r.json();
      if (r.ok) {
        document.querySelectorAll('.row-check:checked').forEach(cb => cb.closest('tr').remove());
        const remaining = document.querySelectorAll('.row-check').length;
        document.querySelector('h1 .count').textContent = '(' + remaining + ')';
        checkAll.checked = false;
        updateUI();
        showStatus('✓ ' + data.deleted + ' couleur(s) supprimée(s)');
      } else {
        alert('Erreur : ' + (data.error || 'inconnue'));
        updateUI();
      }
    });
  </script>
</body>
</html>`;
}

export default router;
