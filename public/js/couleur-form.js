// Synchronisation color picker ↔ champ hex ↔ champs R/G/B
const picker   = document.getElementById('color-picker');
const hexInput = document.getElementById('hex-input');
const rInput   = document.getElementById('r-input');
const gInput   = document.getElementById('g-input');
const bInput   = document.getElementById('b-input');

function hexToRgb(hex) {
  const r = parseInt(hex.slice(1,3),16);
  const g = parseInt(hex.slice(3,5),16);
  const b = parseInt(hex.slice(5,7),16);
  return { r, g, b };
}

function rgbToHex(r,g,b) {
  return '#'+[r,g,b].map(v=>Math.max(0,Math.min(255,parseInt(v)||0)).toString(16).padStart(2,'0')).join('');
}

picker.addEventListener('input', () => {
  const { r,g,b } = hexToRgb(picker.value);
  hexInput.value = picker.value;
  rInput.value = r; gInput.value = g; bInput.value = b;
});

hexInput.addEventListener('input', () => {
  const val = hexInput.value;
  if (/^#[0-9a-fA-F]{6}$/.test(val)) {
    picker.value = val;
    const { r,g,b } = hexToRgb(val);
    rInput.value = r; gInput.value = g; bInput.value = b;
  }
});

function syncFromRgb() {
  const hex = rgbToHex(rInput.value, gInput.value, bInput.value);
  hexInput.value = hex;
  picker.value   = hex;
}
rInput.addEventListener('input', syncFromRgb);
gInput.addEventListener('input', syncFromRgb);
bInput.addEventListener('input', syncFromRgb);
