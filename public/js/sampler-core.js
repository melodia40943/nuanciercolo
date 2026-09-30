// ── Sampler core — partagé entre sampler.html, couleur-form et test.html ──────
// Correction 1 point : raw * 255 / white (par canal)
// Le point noir n'est PAS utilisé — il détruit les canaux faibles des jaunes/oranges/bleus.
// Les valeurs DB ont été saisies depuis scanner (white≈255 → pas de correction),
// donc elles représentent les valeurs brutes du papier numérisé.

// ── État WB ────────────────────────────────────────────────────────────────────
let wbWhite = { r: 255, g: 255, b: 255 };
let wbBlack = { r: 0,   g: 0,   b: 0   }; // toujours 0 — non utilisé
let wbSet   = false;

// Gain session gris 18% — persiste entre photos de la même session, null si inactif
let sessionGain = null; // { r, g, b } en espace linéaire


// ── Conversion gamma sRGB ↔ linéaire ──────────────────────────────────────────
function sRGBtoLin(c) {
  const v = c / 255;
  return v <= 0.04045 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4);
}

function linToSRGB(l) {
  const clamped = Math.min(1, Math.max(0, l));
  const v = clamped <= 0.0031308
    ? 12.92 * clamped
    : 1.055 * Math.pow(clamped, 1 / 2.4) - 0.055;
  return Math.round(v * 255);
}

// ── Détecte automatiquement le point blanc (zone la plus claire et neutre) ────
// Amélioration : seuil min sur le canal le plus faible (150 au lieu de 80)
// et scan restreint à la bordure 15% de l'image d'abord.
function detectWhitePoint(imgData, natW, natH) {
  const d    = imgData.data;
  const len  = d.length / 4;
  const step = Math.max(1, Math.floor(len / 6000));

  const borderX = Math.floor(natW * 0.15);
  const borderY = Math.floor(natH * 0.15);

  function collectPixels(borderOnly) {
    const strict = [], loose = [], any = [];
    for (let i = 0; i < d.length; i += 4 * step) {
      const idx = i / 4;
      const px  = idx % natW;
      const py  = Math.floor(idx / natW);
      if (borderOnly) {
        const inBorder = px < borderX || px >= natW - borderX ||
                         py < borderY || py >= natH - borderY;
        if (!inBorder) continue;
      }
      const r = d[i], g = d[i+1], b = d[i+2];
      if (Math.min(r, g, b) < 150) continue;
      const mx  = Math.max(r, g, b);
      const sat = mx > 0 ? (mx - Math.min(r, g, b)) / mx : 0;
      const br  = (r + g + b) / 3;
      any.push([r, g, b, br]);
      if (sat <= 0.20) loose.push([r, g, b, br]);
      if (sat <= 0.12) strict.push([r, g, b, br]);
    }
    return { strict, loose, any };
  }

  // Essai 1 : bordure uniquement
  let pools = collectPixels(true);
  // Essai 2 : image entière si pas assez de pixels en bordure
  if (pools.any.length < 5) pools = collectPixels(false);

  const pool = pools.strict.length >= 5 ? pools.strict
             : pools.loose.length  >= 5 ? pools.loose
             : pools.any.length    >= 5 ? pools.any
             : null;
  if (!pool) return null;

  // Top 2% les plus lumineux → vrai blanc du papier
  pool.sort((a, b) => b[3] - a[3]);
  const top = pool.slice(0, Math.max(3, Math.floor(pool.length * 0.02)));

  const sR = top.reduce((s,p) => s+p[0], 0);
  const sG = top.reduce((s,p) => s+p[1], 0);
  const sB = top.reduce((s,p) => s+p[2], 0);
  return { r: sR/top.length, g: sG/top.length, b: sB/top.length };
}

// ── Applique la WB auto sans clic utilisateur ──────────────────────────────────
function autoDetectWB(imgData, natW, natH, onDone) {
  // Ne pas écraser une calibration manuelle déjà définie
  if (sessionGain || wbSet) return false;

  const white = detectWhitePoint(imgData, natW, natH);
  if (!white || Math.min(white.r, white.g, white.b) < 150) return false;

  wbWhite = white;
  wbBlack = { r: 0, g: 0, b: 0 };
  wbSet   = true;

  if (onDone) onDone({ white: wbWhite, black: wbBlack });
  return true;
}

// ── Correction 1 point (carte blanche) ────────────────────────────────────────
function correctChannel(raw, black, white) {
  if (white <= 0) return raw;
  return Math.min(255, Math.max(0, Math.round(raw * 255 / white)));
}

// ── Applique la correction WB active sur un pixel {r,g,b} ────────────────────
// Les deux corrections sont cumulables : blanc (luminosité) puis gris (température)
function applyWB(pixel) {
  let r = pixel.r, g = pixel.g, b = pixel.b;
  // Étape 1 : carte blanche — normalise l'exposition
  if (wbSet) {
    r = correctChannel(r, 0, wbWhite.r);
    g = correctChannel(g, 0, wbWhite.g);
    b = correctChannel(b, 0, wbWhite.b);
  }
  // Étape 2 : carte grise 18% — corrige la température (espace linéaire)
  if (sessionGain) {
    r = linToSRGB(sRGBtoLin(r) * sessionGain.r);
    g = linToSRGB(sRGBtoLin(g) * sessionGain.g);
    b = linToSRGB(sRGBtoLin(b) * sessionGain.b);
  }
  return { r, g, b };
}

// ── Définit le point blanc depuis un clic canvas (carte blanche) ──────────────
function doWBAtImgCoords(imgX, imgY, imgData, natW, natH, onDone) {
  const d = imgData.data;
  const R = 14;
  let sR=0, sG=0, sB=0, n=0;

  for (let dy=-R; dy<=R; dy++) {
    for (let dx=-R; dx<=R; dx++) {
      const px=Math.round(imgX+dx), py=Math.round(imgY+dy);
      if (px<0||px>=natW||py<0||py>=natH) continue;
      const i=(py*natW+px)*4;
      sR+=d[i]; sG+=d[i+1]; sB+=d[i+2]; n++;
    }
  }
  if (!n) return false;
  const aR=sR/n, aG=sG/n, aB=sB/n;
  if (aR<30 || aG<30 || aB<30) return false;

  wbWhite = { r: aR, g: aG, b: aB };
  wbBlack = { r: 0, g: 0, b: 0 };
  wbSet   = true;
  // sessionGain reste actif — les deux corrections sont complémentaires
  saveWBToStorage();

  if (onDone) onDone({ white: wbWhite, black: wbBlack });
  return true;
}

// ── Calibration carte grise 18% (espace linéaire, par canal) ─────────────────
// Stocke le résultat dans sessionGain → persiste pour toute la session.
function doGrayCardAtImgCoords(imgX, imgY, imgData, natW, natH, onDone) {
  const d = imgData.data;
  const R = 14;
  let sR=0, sG=0, sB=0, n=0;

  for (let dy=-R; dy<=R; dy++) {
    for (let dx=-R; dx<=R; dx++) {
      const px=Math.round(imgX+dx), py=Math.round(imgY+dy);
      if (px<0||px>=natW||py<0||py>=natH) continue;
      const i=(py*natW+px)*4;
      sR+=d[i]; sG+=d[i+1]; sB+=d[i+2]; n++;
    }
  }
  if (!n) return false;
  const aR=sR/n, aG=sG/n, aB=sB/n;
  // Gris 18% ≈ sRGB 119 → on accepte 40-220 (évite les mesures hors carte)
  if (Math.min(aR,aG,aB) < 40 || Math.max(aR,aG,aB) > 220) return false;

  // Si la carte blanche est déjà définie, calculer le gain sur les valeurs corrigées
  let cR = aR, cG = aG, cB = aB;
  if (wbSet) {
    cR = Math.min(255, Math.max(0, aR * 255 / wbWhite.r));
    cG = Math.min(255, Math.max(0, aG * 255 / wbWhite.g));
    cB = Math.min(255, Math.max(0, aB * 255 / wbWhite.b));
  }

  const linR = sRGBtoLin(cR);
  const linG = sRGBtoLin(cG);
  const linB = sRGBtoLin(cB);
  if (linR < 0.001 || linG < 0.001 || linB < 0.001) return false;

  // Normalisation relative : on égalise les canaux sans toucher à la luminosité
  // (la luminosité est déjà gérée par la carte blanche)
  const avgLin = (linR + linG + linB) / 3;
  sessionGain = {
    r: avgLin / linR,
    g: avgLin / linG,
    b: avgLin / linB,
  };
  // wbWhite reste intact — les deux corrections coexistent
  saveWBToStorage();

  if (onDone) onDone({
    gain: sessionGain,
    measured: { r: Math.round(aR), g: Math.round(aG), b: Math.round(aB) }
  });
  return true;
}

// ── Retourne un résumé de la correction active (pour affichage UI) ────────────
function getWBInfo() {
  const parts = [];
  if (wbSet) {
    const r = Math.round(wbWhite.r), g = Math.round(wbWhite.g), b = Math.round(wbWhite.b);
    parts.push(`Blanc RGB(${r},${g},${b})`);
  }
  if (sessionGain) {
    const rp = Math.round(sessionGain.r * 100);
    const gp = Math.round(sessionGain.g * 100);
    const bp = Math.round(sessionGain.b * 100);
    parts.push(`Gris 18% R×${rp}%G×${gp}%B×${bp}%`);
  }
  if (parts.length === 0) return { mode: 'none', label: 'Non définie' };
  const mode = wbSet && sessionGain ? 'both' : wbSet ? 'white' : 'gray18';
  return { mode, label: parts.join(' + ') };
}

// ── Réinitialise la session (efface sessionGain) ──────────────────────────────
function clearSessionGain() {
  sessionGain = null;
  wbWhite = { r: 255, g: 255, b: 255 };
  wbSet   = false;
  try { localStorage.removeItem('revelo_wb'); } catch(e) {}
}

// ── Persistance localStorage ──────────────────────────────────────────────────
function saveWBToStorage() {
  try {
    const data = {};
    if (wbSet) data.white = wbWhite;
    if (sessionGain) data.gray18 = sessionGain;
    if (Object.keys(data).length > 0) {
      localStorage.setItem('revelo_wb', JSON.stringify(data));
    } else {
      localStorage.removeItem('revelo_wb');
    }
  } catch(e) {}
}

(function loadWBFromStorage() {
  try {
    const raw = localStorage.getItem('revelo_wb');
    if (!raw) return;
    const data = JSON.parse(raw);
    if (data.white) { wbWhite = data.white; wbSet = true; }
    if (data.gray18) { sessionGain = data.gray18; }
  } catch(e) {}
})();

// ── Échantillonne un cercle dans imgData, retourne {r,g,b,hex} ou null ────────
function sampleCircle(cx, cy, radius, imgData, natW, natH) {
  const d  = imgData.data;
  const r  = radius;
  const x1 = Math.max(0, Math.floor(cx-r));
  const y1 = Math.max(0, Math.floor(cy-r));
  const x2 = Math.min(natW-1, Math.ceil(cx+r));
  const y2 = Math.min(natH-1, Math.ceil(cy+r));
  const r2 = r*r;
  const valid = [];

  for (let y=y1; y<=y2; y++) {
    for (let x=x1; x<=x2; x++) {
      const dx=x-cx, dy=y-cy;
      if (dx*dx+dy*dy > r2) continue;
      const i=(y*natW+x)*4;
      const pr=d[i], pg=d[i+1], pb=d[i+2], br=(pr+pg+pb)/3;
      if (br<25 || br>250) continue;
      valid.push({ r:pr, g:pg, b:pb, x:dx, y:dy });
    }
  }
  if (valid.length < 4) return null;

  // 4 quadrants → médiane de chaque → moyenne
  const h=Math.floor(valid.length/2), q=Math.floor(h/2);
  const quads=[valid.slice(0,q),valid.slice(q,h),valid.slice(h,h+q),valid.slice(h+q)];
  const samples=quads.map(arr=>{
    if (!arr.length) return valid[Math.floor(valid.length/2)];
    arr.sort((a,b)=>(a.r+a.g+a.b)-(b.r+b.g+b.b));
    return arr[Math.floor(arr.length/2)];
  });

  // Correction WB active (sessionGain ou wbWhite)
  const corr = samples.map(s => applyWB(s));

  const aR=Math.round(corr.reduce((a,c)=>a+c.r,0)/4);
  const aG=Math.round(corr.reduce((a,c)=>a+c.g,0)/4);
  const aB=Math.round(corr.reduce((a,c)=>a+c.b,0)/4);

  return {
    r:aR, g:aG, b:aB, hex:toHexCore(aR,aG,aB),
    quads: corr.map(c => ({ r:c.r, g:c.g, b:c.b, hex:toHexCore(c.r,c.g,c.b) }))
  };
}

function toHexCore(r,g,b) {
  return '#'+[r,g,b].map(v=>Math.max(0,Math.min(255,v)).toString(16).padStart(2,'0')).join('');
}
