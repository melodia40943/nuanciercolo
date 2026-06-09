// « Mes feutres » — gestion de collection par type de médium (prototype interactif)
// Tokens issus de Design System.html
const MF = {
  bg: '#0E0F1A', s1: '#181A2E', s2: '#20223A', s3: '#2A2D49',
  border: 'rgba(255,255,255,.10)', text: '#ECECF4', text2: '#A2A3B8', text3: '#6E7088',
  blue: '#4A6CF7',
};

const MEDIUMS = [
  { id: 'acrylique', label: 'Acrylique',       color: '#FF6635' },
  { id: 'gel',       label: 'Gel',             color: '#06D6A0' },
  { id: 'crayon',    label: 'Crayon',          color: '#FFD500' },
  { id: 'alcool',    label: 'Marqueur alcool', color: '#4CC9F0' },
];

// Catalogue marques → packs disponibles, par médium
const CATALOG = {
  acrylique: {
    Languo:  ['Pack de 9', 'Pack 48', 'Pack 126', 'Pack 240'],
    Guangna: ['Pack 168', 'Pack 288', 'Pack 360'],
    Nicety:  ['Pack 80', 'Pack 264'],
  },
  gel:    { Sakura: ['Gelly Roll 12', 'Gelly Roll 24'], Mungyo: ['Pack 36'] },
  crayon: { 'Faber-Castell': ['Pack 24', 'Pack 48'], Prismacolor: ['Pack 72', 'Pack 150'] },
  alcool: { Ohuhu: ['Pastel 48', 'Brush 120', 'Pack 320'], Arrtx: ['Pack 80', 'Pack 160'] },
};

const INITIAL_OWNED = {
  acrylique: [
    { brand: 'Guangna', pack: 'Pack 360' },
    { brand: 'Languo',  pack: 'Tous les packs de 9' },
    { brand: 'Nicety',  pack: 'Pack 264' },
  ],
  gel: [],
  crayon: [],
  alcool: [ { brand: 'Ohuhu', pack: 'Pack 320' } ],
};

// Icône type de médium (simple trait)
function MediumIcon({ id, size = 22, color }) {
  const common = { width: size, height: size, viewBox: '0 0 24 24', fill: 'none',
    stroke: color, strokeWidth: 2.1, strokeLinecap: 'round', strokeLinejoin: 'round' };
  if (id === 'acrylique') return (<svg {...common}><path d="M9 11l6-6 4 4-6 6"/><path d="M9 11l-4 8 8-4"/><path d="M5 19l2-2"/></svg>);
  if (id === 'gel')       return (<svg {...common}><path d="M12 2s5 6 5 11a5 5 0 0 1-10 0c0-5 5-11 5-11z"/></svg>);
  if (id === 'crayon')    return (<svg {...common}><path d="M12 19l7-7 3 3-7 7-3-3z"/><path d="M18 13l-1.5-1.5"/><path d="M2 22l3-1 11-11-2-2L3 19l-1 3z"/></svg>);
  return (<svg {...common}><rect x="6" y="2" width="12" height="9" rx="2"/><path d="M9 11v7a3 3 0 0 0 6 0v-7"/><path d="M10 18h4"/></svg>);
}

const Ico = {
  close: (s = 22) => (<svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round"><path d="M18 6 6 18M6 6l12 12"/></svg>),
  trash: (s = 20) => (<svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 6h18M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/></svg>),
  plus: (s = 20) => (<svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round"><path d="M12 5v14M5 12h14"/></svg>),
  check: (s = 22) => (<svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round"><path d="M20 6 9 17l-5-5"/></svg>),
  chevron: (s = 18) => (<svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round"><path d="m6 9 6 6 6-6"/></svg>),
};

// Carte pack : marque + pack, épuré (pas d'éléments décoratifs qui troublent)
function MesFeutres({ desktop=false }) {
  const [active, setActive] = React.useState('acrylique');
  const [owned, setOwned] = React.useState(INITIAL_OWNED);
  const [brand, setBrand] = React.useState('');
  const [pack, setPack] = React.useState('');

  const medium = MEDIUMS.find(m => m.id === active);
  const list = owned[active];
  const brands = Object.keys(CATALOG[active] || {});
  const packs = brand ? (CATALOG[active][brand] || []) : [];

  const remove = (i) => setOwned(o => ({ ...o, [active]: o[active].filter((_, k) => k !== i) }));
  const add = () => {
    if (!brand || !pack) return;
    setOwned(o => ({ ...o, [active]: [...o[active], { brand, pack }] }));
    setBrand(''); setPack('');
  };
  const switchMedium = (id) => { setActive(id); setBrand(''); setPack(''); };

  const selStyle = {
    width: '100%', minHeight: 52, background: MF.s2, color: MF.text,
    border: `1.5px solid ${MF.border}`, borderRadius: 12, padding: '0 14px',
    fontSize: 16, fontWeight: 600, fontFamily: 'inherit', appearance: 'none',
    WebkitAppearance: 'none', outline: 'none', cursor: 'pointer',
  };

  return (
    <div style={{
      height: '100%', display: 'flex', flexDirection: 'column',
      background: MF.bg, color: MF.text, fontFamily: 'system-ui, sans-serif',
    }}>
      {/* Header */}
      <div style={{
        flexShrink: 0, padding: desktop ? '20px 22px 14px' : '54px 18px 14px',
        display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between',
        borderBottom: `1px solid ${MF.border}`,
      }}>
        <div>
          <div style={{ fontFamily: '"Bricolage Grotesque", system-ui', fontSize: 26, fontWeight: 800 }}>Mes feutres</div>
          <div style={{ fontSize: 14, color: MF.text2, marginTop: 2 }}>Choisis ton type, puis tes packs</div>
        </div>
        <button style={{
          width: 44, height: 44, borderRadius: 12, flexShrink: 0,
          background: MF.s2, border: `1px solid ${MF.border}`, color: MF.text2,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}>{Ico.close()}</button>
      </div>

      {/* Scroll */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '18px 18px 16px' }}>
        {/* Sélecteur de médium */}
        <div style={{ fontSize: 12, fontWeight: 800, letterSpacing: 1.2, textTransform: 'uppercase', color: MF.text3, marginBottom: 12 }}>
          Type de feutre
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 26 }}>
          {MEDIUMS.map(m => {
            const sel = m.id === active;
            const count = owned[m.id].length;
            return (
              <button key={m.id} onClick={() => switchMedium(m.id)} style={{
                display: 'flex', alignItems: 'center', gap: 11, padding: 14,
                minHeight: 72, textAlign: 'left',
                borderRadius: 14, cursor: 'pointer',
                background: sel ? `${m.color}1f` : MF.s2,
                border: sel ? `2px solid ${m.color}` : `1.5px solid ${MF.border}`,
                color: MF.text, fontFamily: 'inherit',
              }}>
                <div style={{
                  width: 38, height: 38, borderRadius: 10, flexShrink: 0,
                  background: sel ? `${m.color}2e` : MF.s3,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}>
                  <MediumIcon id={m.id} color={sel ? m.color : MF.text2} />
                </div>
                <div style={{ minWidth: 0 }}>
                  <div style={{ fontSize: 14.5, fontWeight: 700, lineHeight: 1.15 }}>{m.label}</div>
                  <div style={{ fontSize: 12, color: count ? m.color : MF.text3, marginTop: 3, fontWeight: 600 }}>
                    {count ? `${count} pack${count > 1 ? 's' : ''}` : 'Aucun'}
                  </div>
                </div>
              </button>
            );
          })}
        </div>

        {/* Collection du médium actif */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
          <span style={{ fontSize: 12, fontWeight: 800, letterSpacing: 1.2, textTransform: 'uppercase', color: MF.text3 }}>
            Ta collection
          </span>
          <span style={{ width: 8, height: 8, borderRadius: '50%', background: medium.color }} />
          <span style={{ fontSize: 13, fontWeight: 700, color: medium.color }}>{medium.label}</span>
        </div>

        {list.length === 0 ? (
          <div style={{
            border: `1.5px dashed ${MF.border}`, borderRadius: 14, padding: '28px 18px',
            textAlign: 'center', color: MF.text3, marginBottom: 26,
          }}>
            <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 10, opacity: .6 }}>
              <MediumIcon id={active} size={30} color={medium.color} />
            </div>
            <div style={{ fontSize: 14, lineHeight: 1.5 }}>
              Aucun feutre <strong style={{ color: MF.text2 }}>{medium.label.toLowerCase()}</strong> pour l'instant.<br/>
              Ajoute ta première marque ci-dessous.
            </div>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 26 }}>
            {list.map((it, i) => (
              <div key={i} style={{
                display: 'flex', alignItems: 'center', gap: 12, padding: '12px 12px 12px 14px',
                background: MF.s1, border: `1px solid ${MF.border}`, borderRadius: 14,
              }}>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 16, fontWeight: 700 }}>{it.brand}</div>
                  <div style={{ fontSize: 13, color: MF.text2, marginTop: 2 }}>{it.pack}</div>
                </div>
                <button onClick={() => remove(i)} style={{
                  width: 44, height: 44, borderRadius: 11, flexShrink: 0,
                  background: 'transparent', border: `1px solid ${MF.border}`, color: MF.text3,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}>{Ico.trash()}</button>
              </div>
            ))}
          </div>
        )}

        {/* Ajout marque + pack */}
        <div style={{ fontSize: 12, fontWeight: 800, letterSpacing: 1.2, textTransform: 'uppercase', color: MF.text3, marginBottom: 12 }}>
          Ajouter une marque
        </div>
        <div style={{
          background: MF.s1, border: `1px solid ${MF.border}`, borderRadius: 16,
          padding: 16, display: 'flex', flexDirection: 'column', gap: 12,
        }}>
          <div style={{ position: 'relative' }}>
            <select value={brand} onChange={e => { setBrand(e.target.value); setPack(''); }} style={selStyle}>
              <option value="">— Choisir une marque —</option>
              {brands.map(b => <option key={b} value={b}>{b}</option>)}
            </select>
            <span style={{ position: 'absolute', right: 14, top: '50%', transform: 'translateY(-50%)', color: MF.text3, pointerEvents: 'none' }}>{Ico.chevron()}</span>
          </div>
          <div style={{ position: 'relative', opacity: brand ? 1 : .45 }}>
            <select value={pack} onChange={e => setPack(e.target.value)} disabled={!brand} style={selStyle}>
              <option value="">— Choisir un pack —</option>
              {packs.map(p => <option key={p} value={p}>{p}</option>)}
            </select>
            <span style={{ position: 'absolute', right: 14, top: '50%', transform: 'translateY(-50%)', color: MF.text3, pointerEvents: 'none' }}>{Ico.chevron()}</span>
          </div>
          <button onClick={add} disabled={!pack} style={{
            minHeight: 52, borderRadius: 12, border: 'none',
            background: pack ? MF.blue : MF.s3, color: pack ? '#fff' : MF.text3,
            fontFamily: 'inherit', fontSize: 16, fontWeight: 700, cursor: pack ? 'pointer' : 'default',
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
          }}>{Ico.plus()} Ajouter à ma collection</button>
        </div>
      </div>

      {/* Footer */}
      <div style={{
        flexShrink: 0, padding: desktop ? '14px 22px 18px' : '12px 18px 30px',
        borderTop: `1px solid ${MF.border}`, background: MF.bg,
      }}>
        <div style={{ fontSize: 12.5, color: MF.text2, textAlign: 'center', marginBottom: 10 }}>
          Correspondances dans :{' '}
          <strong style={{ color: medium.color }}>{medium.label}</strong>
          {' · '}{list.length} pack{list.length > 1 ? 's' : ''}
        </div>
        <button style={{
          width: '100%', minHeight: 58, borderRadius: 16, border: 'none',
          background: MF.blue, color: '#fff', fontFamily: 'inherit', fontSize: 18, fontWeight: 700,
          boxShadow: '0 8px 22px rgba(74,108,247,.4)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10,
        }}>{Ico.check()} Appliquer</button>
      </div>
    </div>
  );
}

Object.assign(window, { MesFeutres });
