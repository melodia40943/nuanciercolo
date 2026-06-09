// Volet résultats — top 3 + autres, étiquettes Proche/Correct, équivalences
// Principe : "canvas neutre pour la couleur" → le volet est sur fond clair.
const RZ = {
  bg:'#0E0F1A', s2:'#20223A', s3:'#2A2D49', border:'rgba(255,255,255,.10)',
  text:'#ECECF4', text2:'#A2A3B8', text3:'#6E7088', blue:'#4A6CF7',
  canvas:'#F4F5F8', card:'#FFFFFF', ink:'#20223A', ink2:'#6E7088', cardBorder:'#ECECF0',
};

// Petit nuancier "feutres" de démo (hex)
const FEUTRES = [
  {brand:'Guangna', ref:'821', hex:'#7FD4F0', eq:{brand:'Languo', ref:'ye 127'}},
  {brand:'Guangna', ref:'842', hex:'#86C9E0'},
  {brand:'Guangna', ref:'841', hex:'#A9D8EC'},
  {brand:'Guangna', ref:'768', hex:'#95CCD8'},
  {brand:'Languo',  ref:'bl 205', hex:'#6FB8DE', eq:{brand:'Guangna', ref:'822'}},
  {brand:'Guangna', ref:'786', hex:'#DC7F62', eq:{brand:'Languo', ref:'ry 03'}},
  {brand:'Guangna', ref:'671', hex:'#D27158', eq:{brand:'Languo', ref:'pc 813'}},
  {brand:'Guangna', ref:'855', hex:'#E08770', eq:{brand:'Languo', ref:'hc 602'}},
  {brand:'Guangna', ref:'741', hex:'#41B3A3'},
  {brand:'Languo',  ref:'sg 154', hex:'#3FA890'},
  {brand:'Guangna', ref:'730', hex:'#45ADA8'},
  {brand:'Guangna', ref:'792', hex:'#85DCBA'},
  {brand:'Guangna', ref:'789', hex:'#9DE0AD'},
  {brand:'Guangna', ref:'673', hex:'#C38D9E'},
  {brand:'Guangna', ref:'907', hex:'#F38181'},
  {brand:'Guangna', ref:'744', hex:'#5C374C'},
  {brand:'Guangna', ref:'650', hex:'#547980'},
  {brand:'Nicety',  ref:'36',  hex:'#E4BC5E'},
  {brand:'Nicety',  ref:'120', hex:'#C9A24B'},
  {brand:'Languo',  ref:'ag 253', hex:'#8FA64E'},
  {brand:'Guangna', ref:'618', hex:'#C97A66'},
  {brand:'Guangna', ref:'644', hex:'#B97058'},
  {brand:'Guangna', ref:'855b', hex:'#F0B49E'},
  {brand:'Guangna', ref:'688', hex:'#594F4F'},
];

function hx(h){h=h.replace('#','');return [parseInt(h.slice(0,2),16),parseInt(h.slice(2,4),16),parseInt(h.slice(4,6),16)];}
function dist(a,b){const x=hx(a),y=hx(b);return Math.sqrt((x[0]-y[0])**2+(x[1]-y[1])**2+(x[2]-y[2])**2);}
function qual(d){return d<48?'proche':d<108?'correct':'loin';}
const QLABEL = {proche:'Proche', correct:'Correct', loin:'Éloigné'};
const QCOL = {
  proche:{bg:'#E6F7EF', fg:'#12A867', bd:'#19C37D'},
  correct:{bg:'#FDF2DC', fg:'#B5800E', bd:'#F5A623'},
  loin:{bg:'#FBE7E2', fg:'#C8472C', bd:'#E8674A'},
};
function matchAll(s){
  const scored = FEUTRES.map(f=>({...f, d:dist(s,f.hex), q:qual(dist(s,f.hex))})).sort((a,b)=>a.d-b.d);
  return { top3:scored.slice(0,3), rest:scored.slice(3,9) };
}

function QPill({q, big}){
  const c = QCOL[q];
  return <span style={{ fontWeight:700, fontSize: big?13:12, padding: big?'5px 13px':'3px 9px',
    borderRadius:999, background:c.bg, color:c.fg }}>{QLABEL[q]}</span>;
}

function RZIco(){return null;}
const closeIco = (<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round"><path d="M18 6 6 18M6 6l12 12"/></svg>);

function ResultsContent({ sampled, savedCount, onSave, onClose, desktop }) {
  const { top3, rest } = matchAll(sampled);
  const rgb = hx(sampled);
  return (
    <div style={{ height:'100%', display:'flex', flexDirection:'column', background:RZ.canvas,
      fontFamily:'system-ui, sans-serif' }}>
      {/* Header sampled */}
      <div style={{ flexShrink:0, padding: desktop?'18px 18px 12px':'52px 16px 12px', background:RZ.card,
        borderBottom:`1px solid ${RZ.cardBorder}` }}>
        <div style={{ display:'flex', alignItems:'center', gap:12 }}>
          <div style={{ width:48, height:48, borderRadius:11, background:sampled,
            border:'1px solid rgba(0,0,0,.1)', flexShrink:0 }}/>
          <div style={{ flex:1, minWidth:0 }}>
            <div style={{ fontFamily:'"JetBrains Mono", monospace', fontWeight:700, fontSize:18, color:RZ.ink }}>{sampled.toUpperCase()}</div>
            <div style={{ fontFamily:'"JetBrains Mono", monospace', fontSize:12, color:RZ.ink2 }}>RGB({rgb[0]}, {rgb[1]}, {rgb[2]})</div>
          </div>
          {!desktop && (
            <button onClick={onClose} style={{ width:40, height:40, borderRadius:11, flexShrink:0,
              background:'#F1F1F5', border:'none', color:RZ.ink2, display:'flex', alignItems:'center', justifyContent:'center' }}>{closeIco}</button>
          )}
        </div>
      </div>

      {/* Scroll */}
      <div style={{ flex:1, overflowY:'auto', padding:'14px 16px 10px' }}>
        <div style={{ fontSize:12, fontWeight:800, letterSpacing:1, textTransform:'uppercase', color:RZ.ink2, marginBottom:10 }}>
          Tes meilleures correspondances
        </div>
        {/* Top 3 */}
        <div style={{ display:'flex', gap:8, marginBottom:14 }}>
          {top3.map((m,i)=>{
            const c = QCOL[m.q];
            return (
              <div key={i} style={{ flex:'1 1 0', minWidth:0, background:RZ.card,
                border:`2px solid ${c.bd}`, borderRadius:14, padding:'10px 6px',
                display:'flex', flexDirection:'column', alignItems:'center', gap:5 }}>
                <div style={{ width:46, height:46, borderRadius:10, background:m.hex, border:'1px solid rgba(0,0,0,.08)' }}/>
                <div style={{ fontWeight:800, fontSize:15, color:RZ.ink }}>{m.ref}</div>
                <div style={{ fontSize:11, color:RZ.ink2 }}>{m.brand}</div>
                {m.eq && (
                  <div style={{ width:'100%', borderTop:`1px solid ${RZ.cardBorder}`, paddingTop:5, marginTop:1, textAlign:'center' }}>
                    <div style={{ fontWeight:800, fontSize:14, color:RZ.ink }}>{m.eq.ref}</div>
                    <div style={{ fontSize:11, color:RZ.ink2 }}>{m.eq.brand}</div>
                  </div>
                )}
                <QPill q={m.q} />
              </div>
            );
          })}
        </div>

        {/* Save */}
        <button onClick={onSave} style={{ width:'100%', minHeight:52, borderRadius:13, border:'none',
          background:RZ.blue, color:'#fff', fontFamily:'inherit', fontSize:16, fontWeight:700, marginBottom:18,
          boxShadow:'0 6px 18px rgba(74,108,247,.3)' }}>+ Enregistrer ce résultat</button>

        {/* Autres */}
        <div style={{ fontSize:12, fontWeight:800, letterSpacing:1, textTransform:'uppercase', color:RZ.ink2, marginBottom:10 }}>
          Autres possibilités
        </div>
        <div style={{ display:'flex', flexDirection:'column', gap:7 }}>
          {rest.map((m,i)=>(
            <div key={i} style={{ display:'flex', alignItems:'center', gap:11, padding:10,
              background:RZ.card, border:`1px solid ${RZ.cardBorder}`, borderRadius:12 }}>
              <div style={{ width:38, height:38, borderRadius:9, background:m.hex, border:'1px solid rgba(0,0,0,.08)', flexShrink:0 }}/>
              <div style={{ flex:1, minWidth:0 }}>
                <div style={{ fontWeight:700, fontSize:15, color:RZ.ink }}>{m.brand} {m.ref}</div>
                <div style={{ fontFamily:'"JetBrains Mono", monospace', fontSize:11, color:RZ.ink2 }}>{m.hex.toUpperCase()}</div>
              </div>
              <QPill q={m.q} />
            </div>
          ))}
        </div>
      </div>

      {/* Footer donate */}
      <div style={{ flexShrink:0, padding:'10px 16px 14px', borderTop:`1px solid ${RZ.cardBorder}`, background:RZ.card }}>
        <div style={{ display:'flex', alignItems:'center', justifyContent:'center', gap:8, minHeight:46, borderRadius:999,
          background:'linear-gradient(135deg,#FF7A66,#FF5E5B)', color:'#fff', fontWeight:700, fontSize:15 }}>
          ☕ Soutenir le projet
        </div>
      </div>
    </div>
  );
}

function NuancierTappable({ sampled, onPick, desktop }) {
  const cells = FEUTRES.slice(0,15);
  const grid = (
    <div style={{ display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:10, alignContent:'start' }}>
      {cells.map((c,i)=>(
        <div key={i} onClick={()=>onPick(c.hex)} style={{ display:'flex', flexDirection:'column', gap:4, cursor:'pointer' }}>
          <div style={{ height:8, background:'#fbfaf6', borderRadius:1 }}/>
          <div style={{ aspectRatio:'1.1', background:c.hex, borderRadius:2,
            boxShadow: sampled===c.hex ? '0 0 0 3px #4A6CF7' : 'inset 0 0 0 1px rgba(0,0,0,.04)' }}/>
          <div style={{ fontSize:8, color:'#222', fontFamily:'Georgia, serif', textAlign:'center' }}>{c.ref}</div>
        </div>
      ))}
    </div>
  );
  if (desktop) {
    return (
      <div style={{ position:'absolute', inset:0, display:'flex', alignItems:'center', justifyContent:'center', padding:'70px 24px 24px' }}>
        <div style={{ width:'min(420px,72%)', background:'#f4ede3', padding:16, borderRadius:8,
          boxShadow:'0 20px 60px rgba(0,0,0,.5)', filter:'contrast(1.02) saturate(1.05)' }}>{grid}</div>
      </div>
    );
  }
  return (
    <div style={{ position:'absolute', inset:0, background:'#f4ede3', padding:'90px 16px 18px',
      filter:'contrast(1.02) saturate(1.05)', overflowY:'auto' }}>{grid}</div>
  );
}

function RechercheResultats({ desktop=false }) {
  const [sampled, setSampled] = React.useState('#86C9E0');
  const [open, setOpen] = React.useState(true);
  const [saved, setSaved] = React.useState(0);
  const pick = (hex)=>{ setSampled(hex); setOpen(true); };
  const top = matchAll(sampled).top3[0];

  if (desktop) {
    return (
      <div style={{ height:'100%', display:'flex', background:RZ.bg, color:RZ.text, fontFamily:'system-ui, sans-serif' }}>
        <div style={{ position:'relative', flex:1, minWidth:0 }}>
          <NuancierTappable sampled={sampled} onPick={pick} desktop />
          <div style={{ position:'absolute', top:20, left:20, display:'flex', gap:8 }}>
            <div style={{ minHeight:40, padding:'0 14px', borderRadius:12, background:'rgba(15,16,26,.86)',
              border:`1px solid ${RZ.border}`, display:'flex', alignItems:'center', gap:6, fontSize:13, fontWeight:700 }}>← Retour</div>
          </div>
          <div style={{ position:'absolute', top:20, right:20, minHeight:40, padding:'0 14px', borderRadius:12,
            background:'#4A6CF7', display:'flex', alignItems:'center', gap:6, fontSize:13, fontWeight:700, color:'#fff' }}>ⓘ Conseils</div>
        </div>
        <div style={{ width:360, flexShrink:0, borderLeft:`1px solid ${RZ.border}` }}>
          <ResultsContent sampled={sampled} savedCount={saved} onSave={()=>setSaved(s=>s+1)} desktop />
        </div>
      </div>
    );
  }

  // Mobile : tiroir droit
  return (
    <div style={{ height:'100%', position:'relative', overflow:'hidden', background:RZ.bg, color:RZ.text, fontFamily:'system-ui, sans-serif' }}>
      <NuancierTappable sampled={sampled} onPick={pick} />
      {/* chrome haut */}
      <div style={{ position:'absolute', top:54, left:14, right:14, zIndex:40, display:'flex', justifyContent:'space-between' }}>
        <div style={{ minHeight:40, padding:'0 13px', borderRadius:12, background:'rgba(15,16,26,.86)',
          border:`1px solid ${RZ.border}`, display:'flex', alignItems:'center', gap:6, fontSize:13, fontWeight:700 }}>← Retour</div>
        <div style={{ minHeight:40, padding:'0 13px', borderRadius:12, background:'#4A6CF7', color:'#fff',
          display:'flex', alignItems:'center', gap:6, fontSize:13, fontWeight:700 }}>ⓘ Conseils</div>
      </div>

      {/* Tiroir + onglet (toujours visible, accroché au bord gauche) */}
      <div style={{ position:'absolute', top:0, right:0, bottom:0, width:'82%', maxWidth:300, zIndex:60,
        boxShadow:'-6px 0 28px rgba(0,0,0,.28)', transform: open?'translateX(0)':'translateX(100%)',
        transition:'transform .3s cubic-bezier(.4,0,.2,1)' }}>
        <button onClick={()=>setOpen(o=>!o)} style={{ position:'absolute', left:-50, top:'50%', transform:'translateY(-50%)',
          width:50, height:84, background:'#fff', borderRadius:'14px 0 0 14px', border:'none',
          boxShadow:'-3px 0 14px rgba(0,0,0,.22)', display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', gap:5, cursor:'pointer' }}>
          <div style={{ width:26, height:26, borderRadius:6, background:top.hex }}></div>
          <div style={{ fontSize:10, fontWeight:800, color:'#555' }}>{top.ref}</div>
        </button>
        <ResultsContent sampled={sampled} savedCount={saved} onSave={()=>setSaved(s=>s+1)} onClose={()=>setOpen(false)} />
      </div>
    </div>
  );
}

Object.assign(window, { RechercheResultats });
