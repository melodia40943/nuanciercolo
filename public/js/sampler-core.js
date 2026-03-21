// ── Sampler core — partagé entre sampler.html, couleur-form et test.html ──────
// Correction 1 point : raw * 255 / white (par canal)
// Le point noir n'est PAS utilisé — il détruit les canaux faibles des jaunes/oranges/bleus.
// Les valeurs DB ont été saisies depuis scanner (white≈255 → pas de correction),
// donc elles représentent les valeurs brutes du papier numérisé.

// État WB
let wbWhite = { r: 255, g: 255, b: 255 };
let wbBlack = { r: 0,   g: 0,   b: 0   }; // toujours 0 — non utilisé dans la correction
let wbSet   = false;

// Détecte automatiquement le point blanc (zone la plus claire et neutre du papier)
// Fallback en cascade si pas assez de pixels neutres trouvés
function detectWhitePoint(imgData, natW, natH) {
  const d    = imgData.data;
  const len  = d.length / 4;
  const step = Math.max(1, Math.floor(len / 6000));

  // Collecte tous les pixels avec différents niveaux de tolérance
  const strict = [], loose = [], any = [];

  for (let i = 0; i < d.length; i += 4 * step) {
    const r = d[i], g = d[i+1], b = d[i+2];
    const br = (r + g + b) / 3;
    if (br < 80) continue;
    const mx = Math.max(r,g,b);
    const sat = mx > 0 ? (mx - Math.min(r,g,b)) / mx : 0;
    any.push([r, g, b, br]);
    if (sat <= 0.20) loose.push([r, g, b, br]);
    if (sat <= 0.12) strict.push([r, g, b, br]);
  }

  // Choisir le meilleur ensemble disponible (au moins 5 pixels)
  const pool = strict.length >= 5 ? strict
             : loose.length  >= 5 ? loose
             : any.length    >= 5 ? any
             : null;

  if (!pool) return null;

  // Top 2% les plus lumineux → correspond au vrai blanc du papier
  pool.sort((a, b) => b[3] - a[3]);
  const top = pool.slice(0, Math.max(3, Math.floor(pool.length * 0.02)));

  const sR = top.reduce((s,p) => s+p[0], 0);
  const sG = top.reduce((s,p) => s+p[1], 0);
  const sB = top.reduce((s,p) => s+p[2], 0);
  return { r: sR/top.length, g: sG/top.length, b: sB/top.length };
}

// Applique la WB automatiquement sans clic utilisateur
function autoDetectWB(imgData, natW, natH, onDone) {
  const white = detectWhitePoint(imgData, natW, natH);
  if (!white || white.r < 80) return false;

  wbWhite = white;
  wbBlack = { r: 0, g: 0, b: 0 }; // 1-point uniquement
  wbSet   = true;

  if (onDone) onDone({ white: wbWhite, black: wbBlack });
  return true;
}

// Correction 1 point sur un canal : raw * 255 / white
function correctChannel(raw, black, white) {
  if (white <= 0) return raw;
  return Math.min(255, Math.max(0, Math.round(raw * 255 / white)));
}

// Correction WB complète sur un pixel {r,g,b}
function applyWB(pixel) {
  return {
    r: correctChannel(pixel.r, 0, wbWhite.r),
    g: correctChannel(pixel.g, 0, wbWhite.g),
    b: correctChannel(pixel.b, 0, wbWhite.b),
  };
}

// Définit le point blanc depuis un clic canvas (coordonnées image)
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
  if (aR<30 || aG<30 || aB<30) return false; // zone trop sombre

  wbWhite = { r: aR, g: aG, b: aB };
  wbBlack = { r: 0, g: 0, b: 0 }; // 1-point uniquement
  wbSet   = true;

  if (onDone) onDone({ white: wbWhite, black: wbBlack });
  return true;
}

// Échantillonne un cercle dans imgData, retourne {r,g,b,hex} ou null
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
    if (!arr.length) return valid[Math.floor(Math.random()*valid.length)];
    arr.sort((a,b)=>(a.r+a.g+a.b)-(b.r+b.g+b.b));
    return arr[Math.floor(arr.length/2)];
  });

  // Correction WB 1 point
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
