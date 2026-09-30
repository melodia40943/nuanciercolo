// Module sampling intégré au formulaire couleur
// Utilise sampler-core.js pour la logique WB + sampling

let imgEl     = null;
let imgData   = null;
let natW = 0, natH = 0;
let wbPending     = false;
let wbGrayPending = false;
let sampledColor    = null;
let rawSampledColor = null;
let toastTm;
let lensSize  = 55;

// Viewport
let viewX = 0, viewY = 0, viewScale = 1;

// Cercle
let circleCenter = null, circleRadius = 0;
let drawing = false, drawStartCanvas = null;
let panning = false, panStart = null;

const canvasPanel = document.getElementById('sampling-canvas-panel');
const cv          = document.getElementById('sampling-canvas');
const ctx         = cv.getContext('2d', { willReadFrequently: true });
const dropZone    = document.getElementById('sampling-drop');
const canvasWrap  = document.getElementById('sampling-canvas-wrap');
const lens        = document.getElementById('sampling-lens');
const lensC       = document.getElementById('sampling-lens-c');
const lc          = lensC.getContext('2d');

// Chargement image
document.getElementById('sampling-file').addEventListener('change', e => loadFile(e.target.files[0]));
dropZone.addEventListener('click', () => document.getElementById('sampling-file').click());
dropZone.addEventListener('dragover',  e => { e.preventDefault(); dropZone.classList.add('over'); });
dropZone.addEventListener('dragleave', () => dropZone.classList.remove('over'));
dropZone.addEventListener('drop', e => {
  e.preventDefault(); dropZone.classList.remove('over'); loadFile(e.dataTransfer.files[0]);
});

function loadFile(f) {
  if (!f) return;
  if (f.type === 'application/pdf' || f.name.toLowerCase().endsWith('.pdf')) {
    loadPdf(f); return;
  }
  if (!f.type.startsWith('image/')) return;
  const rd = new FileReader();
  rd.onload = ev => {
    const img = new Image();
    img.onload = () => { mountImage(img); };
    img.src = ev.target.result;
  };
  rd.readAsDataURL(f);
}

function mountImage(img) {
  const MAX_PX = 2500;
  let srcW = img.naturalWidth, srcH = img.naturalHeight;
  const scale = Math.min(1, MAX_PX / Math.max(srcW, srcH));
  natW = Math.round(srcW * scale); natH = Math.round(srcH * scale);

  const oc = document.createElement('canvas');
  oc.width = natW; oc.height = natH;
  oc.getContext('2d').drawImage(img, 0, 0, natW, natH);
  imgData = oc.getContext('2d').getImageData(0, 0, natW, natH);

  // imgEl pointe sur un canvas redimensionné pour l'affichage
  imgEl = oc;
  dropZone.style.display   = 'none';
  canvasWrap.style.display = 'block';
  // Appliquer le preset au chargement (ou remettre à 0 si pas de preset)
  const brightEl = document.getElementById('sample-bright');
  const tempEl   = document.getElementById('sample-temp');
  const desatEl2 = document.getElementById('sample-desat');
  const preset   = loadSamplerPreset();
  if (brightEl) brightEl.value = preset ? preset.bright : 0;
  if (tempEl)   tempEl.value   = preset ? preset.temp   : 0;
  if (desatEl2) desatEl2.value = preset ? preset.desat  : 0;
  rawSampledColor = null; sampledColor = null;
  resizeCanvas(); fitView(); render();
  document.getElementById('btn-wb').disabled      = false;
  document.getElementById('btn-wb-gray').disabled = false;
  document.getElementById('sampling-controls').style.display = 'block';
  // La session gris 18% reste active entre photos — on la conserve
  refreshWbStatus();
}

async function loadPdf(f) {
  if (typeof pdfjsLib === 'undefined') { showToast('⚠️ PDF.js non chargé — recharge la page'); return; }
  try {
    const ab  = await f.arrayBuffer();
    const pdf = await pdfjsLib.getDocument({data: ab}).promise;
    if (pdf.numPages === 1) { await renderPdfPage(pdf, 1); return; }
    showPdfModal(pdf);
  } catch(err) {
    showToast('⚠️ Erreur lecture PDF : ' + err.message);
  }
}

async function showPdfModal(pdf) {
  const modal   = document.getElementById('pdf-page-modal');
  const thumbsEl= document.getElementById('pdf-thumbs');
  const titleEl = document.getElementById('pdf-modal-title');
  titleEl.textContent = pdf.numPages + ' pages — cliquer sur une page pour l\'ouvrir';
  thumbsEl.innerHTML  = '';
  modal.style.display = 'block';

  for (let i = 1; i <= pdf.numPages; i++) {
    const page     = await pdf.getPage(i);
    const vp       = page.getViewport({scale: 0.3});
    const c        = document.createElement('canvas');
    c.width = vp.width; c.height = vp.height;
    await page.render({canvasContext: c.getContext('2d'), viewport: vp}).promise;
    const div = document.createElement('div');
    div.className = 'pdf-thumb';
    const lbl = document.createElement('span');
    lbl.textContent = 'Page ' + i;
    div.appendChild(c); div.appendChild(lbl);
    const pageNum = i;
    div.addEventListener('click', async () => {
      modal.style.display = 'none';
      await renderPdfPage(pdf, pageNum);
    });
    thumbsEl.appendChild(div);
  }
}

async function renderPdfPage(pdf, pageNum) {
  const page = await pdf.getPage(pageNum);
  const vp   = page.getViewport({scale: 2});
  const c    = document.createElement('canvas');
  c.width = vp.width; c.height = vp.height;
  await page.render({canvasContext: c.getContext('2d'), viewport: vp}).promise;
  const img = new Image();
  img.onload = () => mountImage(img);
  img.src = c.toDataURL();
}

document.getElementById('pdf-cancel').addEventListener('click', () => {
  document.getElementById('pdf-page-modal').style.display = 'none';
});
document.getElementById('pdf-cancel-overlay').addEventListener('click', () => {
  document.getElementById('pdf-page-modal').style.display = 'none';
});

function resizeCanvas() {
  cv.width = canvasPanel.clientWidth; cv.height = canvasPanel.clientHeight; render();
}
window.addEventListener('resize', () => { if (imgEl) resizeCanvas(); });

function fitView() {
  const s = Math.min(canvasPanel.clientWidth/natW, canvasPanel.clientHeight/natH);
  viewScale=s; viewX=(canvasPanel.clientWidth-natW*s)/2; viewY=(canvasPanel.clientHeight-natH*s)/2;
}

function render() {
  if (!imgEl) return;
  ctx.clearRect(0,0,cv.width,cv.height);
  ctx.save();
  ctx.setTransform(viewScale,0,0,viewScale,viewX,viewY);
  ctx.drawImage(imgEl,0,0);
  if (circleCenter && circleRadius>0) {
    ctx.beginPath();
    ctx.arc(circleCenter.imgX,circleCenter.imgY,circleRadius,0,Math.PI*2);
    ctx.strokeStyle='#4a6cf7'; ctx.lineWidth=2/viewScale; ctx.stroke();
    ctx.fillStyle='rgba(74,108,247,0.15)'; ctx.fill();
  }
  ctx.restore();
  // Bandeau de comparaison en bas du canvas (coordonnées écran)
  if (sampledColor) {
    const bh = 28;
    ctx.fillStyle = sampledColor.hex;
    ctx.fillRect(0, cv.height - bh, cv.width, bh);
  }
}

function canvasToImg(cx,cy) { return {x:(cx-viewX)/viewScale, y:(cy-viewY)/viewScale}; }
function cvXY(e) { const r=cv.getBoundingClientRect(); return {x:e.clientX-r.left,y:e.clientY-r.top}; }

// Zoom
cv.addEventListener('wheel', e => {
  e.preventDefault();
  const {x,y}=cvXY(e);
  const ns=Math.max(0.5,Math.min(30,viewScale*(e.deltaY<0?1.15:1/1.15)));
  viewX=x-(x-viewX)*(ns/viewScale); viewY=y-(y-viewY)*(ns/viewScale);
  viewScale=ns; render();
},{passive:false});

// Loupe — taille dynamique
function applyLensSize(size) {
  lensSize = Math.max(25, Math.min(110, size));
  lens.style.width = lensSize+'px'; lens.style.height = lensSize+'px';
  lensC.width = lensSize; lensC.height = lensSize;
  const el = document.getElementById('lens-size-val');
  if (el) el.textContent = lensSize;
}
const btnLensMinus = document.getElementById('btn-lens-minus');
const btnLensPlus  = document.getElementById('btn-lens-plus');
if (btnLensMinus) btnLensMinus.addEventListener('click', () => applyLensSize(lensSize - 10));
if (btnLensPlus)  btnLensPlus.addEventListener('click',  () => applyLensSize(lensSize + 10));

// Loupe + interactions
cv.addEventListener('mousemove', e => {
  const {x,y}=cvXY(e);
  const img=canvasToImg(x,y);
  if (imgEl && img.x>=0 && img.x<natW && img.y>=0 && img.y<natH) {
    lens.style.display='block';
    const half=lensSize/2, offset=lensSize+18;
    let lx=x+18,ly=y-offset;
    const pr=canvasPanel.getBoundingClientRect();
    if (ly<4) ly=y+18; if (lx+lensSize>pr.width) lx=x-offset;
    lens.style.left=lx+'px'; lens.style.top=ly+'px';
    lc.imageSmoothingEnabled=false; lc.clearRect(0,0,lensSize,lensSize);
    lc.drawImage(imgEl,img.x-9,img.y-9,18,18,0,0,lensSize,lensSize);
    lc.strokeStyle='rgba(255,255,255,.6)'; lc.lineWidth=1;
    lc.beginPath(); lc.moveTo(half,0); lc.lineTo(half,lensSize); lc.stroke();
    lc.beginPath(); lc.moveTo(0,half); lc.lineTo(lensSize,half); lc.stroke();
  } else { lens.style.display='none'; }

  if (panning&&panStart) { viewX+=x-panStart.x; viewY+=y-panStart.y; panStart={x,y}; render(); return; }
  if (drawing&&drawStartCanvas) {
    const s=canvasToImg(drawStartCanvas.x,drawStartCanvas.y),c=canvasToImg(x,y);
    circleCenter={imgX:s.x,imgY:s.y}; circleRadius=Math.hypot(c.x-s.x,c.y-s.y); render();
  }
});

cv.addEventListener('mouseleave', ()=>{ lens.style.display='none'; });
cv.addEventListener('mousedown', e => {
  if (!imgEl) return; e.preventDefault();
  // Enlever le focus d'un éventuel input actif pour éviter le collage du presse-papier
  if (document.activeElement && document.activeElement !== document.body) document.activeElement.blur();
  const {x,y}=cvXY(e);
  if (e.button===1||e.button===2) { panning=true; panStart={x,y}; cv.style.cursor='grabbing'; return; }
  if (e.button!==0) return;
  if (wbPending)     { triggerWB(x,y);     return; }
  if (wbGrayPending) { triggerWBGray(x,y); return; }
  drawing=true; drawStartCanvas={x,y}; circleCenter=null; circleRadius=0;
});
cv.addEventListener('mouseup', e => {
  cv.style.cursor='crosshair';
  if (e.button===1||e.button===2) { panning=false; panStart=null; return; }
  if (!drawing) return; drawing=false;
  if (circleRadius<3/viewScale) {
    const img=canvasToImg(cvXY(e).x,cvXY(e).y);
    circleCenter={imgX:img.x,imgY:img.y}; circleRadius=Math.min(10/viewScale,30); render();
  }
  doSample();
});
cv.addEventListener('contextmenu', e=>e.preventDefault());

// WB — carte blanche (annule seulement le mode clic en attente de l'autre bouton)
document.getElementById('btn-wb').addEventListener('click', () => {
  if (!imgEl) return;
  if (wbGrayPending) { wbGrayPending = false; resetWbGrayBtn(); }
  wbPending = !wbPending;
  const btn = document.getElementById('btn-wb');
  if (wbPending) { btn.textContent = '⚠️ Clique sur zone blanche…'; btn.classList.add('active'); cv.style.cursor = 'cell'; }
  else resetWbBtn();
});

// WB — carte grise 18% (annule seulement le mode clic en attente de l'autre bouton)
document.getElementById('btn-wb-gray').addEventListener('click', () => {
  if (!imgEl) return;
  if (wbPending) { wbPending = false; resetWbBtn(); }
  wbGrayPending = !wbGrayPending;
  const btn = document.getElementById('btn-wb-gray');
  if (wbGrayPending) { btn.textContent = '⚠️ Clique sur la carte grise…'; btn.classList.add('active'); cv.style.cursor = 'cell'; }
  else resetWbGrayBtn();
});

function triggerWB(cvX, cvY) {
  const img = canvasToImg(cvX, cvY);
  const ok = doWBAtImgCoords(img.x, img.y, imgData, natW, natH, () => {
    refreshWbStatus();
    showToast('✓ Carte blanche définie');
  });
  if (!ok) showToast('⚠️ Zone trop sombre — clique sur une zone blanche');
  resetWbBtn();
}

function triggerWBGray(cvX, cvY) {
  const img = canvasToImg(cvX, cvY);
  const ok = doGrayCardAtImgCoords(img.x, img.y, imgData, natW, natH, ({ measured }) => {
    refreshWbStatus();
    showToast(`✓ Gris 18% mesuré · RGB(${measured.r}, ${measured.g}, ${measured.b})`);
  });
  if (!ok) showToast('⚠️ Zone invalide — clique au centre de la carte grise (40–220)');
  resetWbGrayBtn();
}

function resetWbBtn() {
  wbPending = false;
  const btn = document.getElementById('btn-wb');
  btn.textContent = '⬜ Carte blanche';
  btn.classList.remove('active');
  cv.style.cursor = 'crosshair';
}

function resetWbGrayBtn() {
  wbGrayPending = false;
  const btn = document.getElementById('btn-wb-gray');
  btn.textContent = '🔲 Carte grise 18%';
  btn.classList.remove('active');
  cv.style.cursor = 'crosshair';
}

function refreshWbStatus() {
  const info = getWBInfo();
  const el   = document.getElementById('wb-status');
  el.textContent = info.label;
  el.className   = 'wb-status ' + (info.mode === 'none' ? 'pending' : 'ok');
  const btnGray  = document.getElementById('btn-wb-gray');
  if (btnGray) btnGray.classList.toggle('done', info.mode === 'gray18' || info.mode === 'both');
  const btnWhite = document.getElementById('btn-wb');
  if (btnWhite) btnWhite.classList.toggle('done', info.mode === 'white' || info.mode === 'both');
}

// Effacer le gain de session (bouton reset)
const btnWbClear = document.getElementById('btn-wb-clear');
if (btnWbClear) btnWbClear.addEventListener('click', () => {
  clearSessionGain();
  refreshWbStatus();
  showToast('Calibration effacée');
});

// Afficher la calibration persistée dès le chargement de la page
refreshWbStatus();

function adjRgbToHex(r,g,b) {
  return '#' + [r,g,b].map(v => v.toString(16).padStart(2,'0')).join('');
}

function applyAdjCorrection(raw, bright, temp, desat) {
  const bf = 1 + bright * 0.01;
  const ts = temp * 0.6;
  let r = Math.min(255, Math.max(0, raw.r * bf + ts));
  let g = Math.min(255, Math.max(0, raw.g * bf));
  let b = Math.min(255, Math.max(0, raw.b * bf - ts));
  if (desat !== 0) {
    const lum = 0.299 * r + 0.587 * g + 0.114 * b;
    const factor = 1 + desat / 100;
    r = lum + factor * (r - lum);
    g = lum + factor * (g - lum);
    b = lum + factor * (b - lum);
  }
  return {
    r: Math.round(r),
    g: Math.round(g),
    b: Math.round(b)
  };
}

function updateSampleDisplay() {
  if (!rawSampledColor) return;
  const brightEl = document.getElementById('sample-bright');
  const tempEl   = document.getElementById('sample-temp');
  const desatEl  = document.getElementById('sample-desat');
  if (!brightEl) return;
  const bright = parseInt(brightEl.value);
  const temp   = parseInt(tempEl.value);
  const desat  = desatEl ? parseInt(desatEl.value) : 0;
  document.getElementById('sample-bright-val').textContent = bright > 0 ? '+' + bright : bright;
  document.getElementById('sample-temp-val').textContent   = temp   > 0 ? '+' + temp   : temp;
  if (desatEl) document.getElementById('sample-desat-val').textContent = desat > 0 ? '+' + desat : desat;

  const corr    = applyAdjCorrection(rawSampledColor, bright, temp, desat);
  const corrHex = adjRgbToHex(corr.r, corr.g, corr.b);
  sampledColor  = { hex: corrHex, r: corr.r, g: corr.g, b: corr.b };

  document.getElementById('sample-preview').style.background = corrHex;
  document.getElementById('sample-hex').textContent = corrHex.toUpperCase();
  document.getElementById('sample-rgb').textContent = `RGB(${corr.r}, ${corr.g}, ${corr.b})`;

  // Sync automatique vers les champs scanner du formulaire (si présents)
  const hexEl = document.getElementById('hex-input');
  if (hexEl) {
    hexEl.value = sampledColor.hex;
    const rEl = document.getElementById('r-input');
    const gEl = document.getElementById('g-input');
    const bEl = document.getElementById('b-input');
    if (rEl) rEl.value = sampledColor.r;
    if (gEl) gEl.value = sampledColor.g;
    if (bEl) bEl.value = sampledColor.b;
    const cp = document.getElementById('color-picker');
    if (cp) cp.value = sampledColor.hex;
  }
  render(); // met à jour le bandeau de comparaison
}

// Sampling
function doSample() {
  if (!circleCenter||circleRadius<1) return;
  const result=sampleCircle(circleCenter.imgX,circleCenter.imgY,circleRadius,imgData,natW,natH);
  if (!result) { showToast('⚠️ Zone invalide — réessaie'); return; }
  rawSampledColor = result;

  // Quadrants
  if (result.quads) result.quads.forEach((q,i) => {
    const cell=document.getElementById(`sc${i}`);
    if (!cell) return;
    cell.style.background=q.hex;
    cell.querySelector('span').textContent=q.hex.toUpperCase();
  });

  document.getElementById('step-sample').style.display='block';
  document.getElementById('btn-apply').disabled=false;
  const btnPhoto = document.getElementById('btn-apply-photo');
  if (btnPhoto) btnPhoto.disabled=false;

  updateSampleDisplay();
}

// ── Preset lightbox ───────────────────────────────────────────────────────────
const PRESET_KEY = 'revelo_sampler_preset';

function loadSamplerPreset() {
  try {
    const raw = localStorage.getItem(PRESET_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch(e) { return null; }
}

function refreshPresetBtn() {
  const btn = document.getElementById('sample-preset-save');
  if (!btn) return;
  const preset = loadSamplerPreset();
  btn.classList.toggle('done', !!preset);
  btn.title = preset
    ? `Preset actif : Lum ${preset.bright > 0 ? '+' : ''}${preset.bright} · Temp ${preset.temp > 0 ? '+' : ''}${preset.temp} · Sat ${preset.desat > 0 ? '+' : ''}${preset.desat}`
    : 'Aucun preset';
}

const btnPresetSave = document.getElementById('sample-preset-save');
if (btnPresetSave) btnPresetSave.addEventListener('click', () => {
  const bright = sampleBrightEl ? parseInt(sampleBrightEl.value) : 0;
  const temp   = sampleTempEl   ? parseInt(sampleTempEl.value)   : 0;
  const desat  = sampleDesatEl  ? parseInt(sampleDesatEl.value)  : 0;
  if (bright === 0 && temp === 0 && desat === 0) {
    localStorage.removeItem(PRESET_KEY);
    showToast('Preset effacé');
  } else {
    localStorage.setItem(PRESET_KEY, JSON.stringify({ bright, temp, desat }));
    showToast(`✓ Preset sauvegardé · Lum ${bright > 0 ? '+' : ''}${bright} · Temp ${temp > 0 ? '+' : ''}${temp} · Sat ${desat > 0 ? '+' : ''}${desat}`);
  }
  refreshPresetBtn();
});

refreshPresetBtn();

// Sliders d'ajustement en temps réel
const sampleBrightEl = document.getElementById('sample-bright');
const sampleTempEl   = document.getElementById('sample-temp');
const sampleDesatEl  = document.getElementById('sample-desat');
const sampleResetEl  = document.getElementById('sample-adj-reset');
if (sampleBrightEl) sampleBrightEl.addEventListener('input', updateSampleDisplay);
if (sampleTempEl)   sampleTempEl.addEventListener('input', updateSampleDisplay);
if (sampleDesatEl)  sampleDesatEl.addEventListener('input', updateSampleDisplay);
if (sampleResetEl)  sampleResetEl.addEventListener('click', () => {
  if (sampleBrightEl) sampleBrightEl.value = 0;
  if (sampleTempEl)   sampleTempEl.value   = 0;
  if (sampleDesatEl)  sampleDesatEl.value  = 0;
  updateSampleDisplay();
});

// Appliquer au formulaire
document.getElementById('btn-apply').addEventListener('click', ()=>{
  if (!sampledColor) return;
  document.getElementById('hex-input').value    = sampledColor.hex;
  document.getElementById('r-input').value      = sampledColor.r;
  document.getElementById('g-input').value      = sampledColor.g;
  document.getElementById('b-input').value      = sampledColor.b;
  document.getElementById('color-picker').value = sampledColor.hex;
  showToast('✓ Couleur appliquée au formulaire');
});

function showToast(msg) {
  const el=document.getElementById('sampling-toast');
  if (!el) return;
  el.textContent=msg; el.classList.add('show');
  clearTimeout(toastTm);
  toastTm=setTimeout(()=>el.classList.remove('show'),2400);
}
