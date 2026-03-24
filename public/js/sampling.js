// Module sampling intégré au formulaire couleur
// Utilise sampler-core.js pour la logique WB + sampling

let imgEl     = null;
let imgData   = null;
let natW = 0, natH = 0;
let wbPending = false;
let sampledColor = null;
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
  imgEl = img; natW = img.naturalWidth; natH = img.naturalHeight;
  const oc = document.createElement('canvas');
  oc.width = natW; oc.height = natH;
  oc.getContext('2d').drawImage(img, 0, 0);
  imgData = oc.getContext('2d').getImageData(0, 0, natW, natH);
  dropZone.style.display   = 'none';
  canvasWrap.style.display = 'block';
  resizeCanvas(); fitView(); render();
  document.getElementById('btn-wb').disabled = false;
  document.getElementById('sampling-controls').style.display = 'block';
  setWbStatus('pending');
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
  if (wbPending) { triggerWB(x,y); return; }
  drawing=true; drawStartCanvas={x,y}; circleCenter=null; circleRadius=0;
});
cv.addEventListener('mouseup', e => {
  cv.style.cursor='crosshair';
  if (e.button===1||e.button===2) { panning=false; panStart=null; return; }
  if (!drawing) return; drawing=false;
  if (circleRadius<3/viewScale) {
    const img=canvasToImg(cvXY(e).x,cvXY(e).y);
    circleCenter={imgX:img.x,imgY:img.y}; circleRadius=10; render();
  }
  doSample();
});
cv.addEventListener('contextmenu', e=>e.preventDefault());

// WB
document.getElementById('btn-wb').addEventListener('click', ()=>{
  if (!imgEl) return;
  wbPending=!wbPending;
  const btn=document.getElementById('btn-wb');
  if (wbPending) { btn.textContent='⚠️ Clique sur zone blanche…'; btn.classList.add('active'); cv.style.cursor='cell'; }
  else resetWbBtn();
});

function triggerWB(cvX, cvY) {
  const img=canvasToImg(cvX,cvY);
  const ok=doWBAtImgCoords(img.x,img.y,imgData,natW,natH,({white,black})=>{
    const el=document.getElementById('wb-status');
    el.textContent=`Blanc RGB(${Math.round(white.r)},${Math.round(white.g)},${Math.round(white.b)}) · Noir RGB(${black.r},${black.g},${black.b})`;
    setWbStatus('ok');
    showToast('✓ Balance des blancs définie');
  });
  if (!ok) showToast('⚠️ Zone trop sombre — clique sur une zone blanche');
  resetWbBtn();
}

function resetWbBtn() {
  wbPending=false;
  const btn=document.getElementById('btn-wb');
  btn.textContent=wbSet?'✓ Redéfinir les blancs':'Cliquer sur zone blanche';
  btn.classList.toggle('active',false); btn.classList.toggle('done',wbSet);
  cv.style.cursor='crosshair';
}
function setWbStatus(state) {
  const el=document.getElementById('wb-status');
  if (state==='pending'){el.textContent='Non définie';el.className='wb-status pending';}
  if (state==='ok'){el.className='wb-status ok';}
}

// Sampling
function doSample() {
  if (!circleCenter||circleRadius<1) return;
  const result=sampleCircle(circleCenter.imgX,circleCenter.imgY,circleRadius,imgData,natW,natH);
  if (!result) { showToast('⚠️ Zone invalide — réessaie'); return; }
  sampledColor=result;

  // Quadrants
  if (result.quads) result.quads.forEach((q,i) => {
    const cell=document.getElementById(`sc${i}`);
    if (!cell) return;
    cell.style.background=q.hex;
    cell.querySelector('span').textContent=q.hex.toUpperCase();
  });

  document.getElementById('sample-preview').style.background=result.hex;
  document.getElementById('sample-hex').textContent=result.hex.toUpperCase();
  document.getElementById('sample-rgb').textContent=`RGB(${result.r}, ${result.g}, ${result.b})`;
  document.getElementById('step-sample').style.display='block';
  document.getElementById('btn-apply').disabled=false;
  const btnPhoto = document.getElementById('btn-apply-photo');
  if (btnPhoto) btnPhoto.disabled=false;
}

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
