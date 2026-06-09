// Recherche — barre du bas + chrome, responsive mobile/desktop
const RB = {
  bg: '#0E0F1A', s1: '#181A2E', s2: '#20223A', s3: '#2A2D49',
  border: 'rgba(255,255,255,.10)', text: '#ECECF4', text2: '#A2A3B8', text3: '#6E7088',
  blue: '#4A6CF7', green: '#19C37D',
};

if (typeof document!=='undefined' && !document.getElementById('rb-slider-css')){
  const s=document.createElement('style'); s.id='rb-slider-css';
  s.textContent=`.rbsl{-webkit-appearance:none;appearance:none;width:100%;height:12px;border-radius:8px;outline:none;cursor:pointer}
  .rbsl::-webkit-slider-thumb{-webkit-appearance:none;appearance:none;width:32px;height:32px;border-radius:50%;background:#fff;border:4px solid #4a6cf7;box-shadow:0 3px 10px rgba(0,0,0,.5);cursor:pointer}
  .rbsl::-moz-range-thumb{width:32px;height:32px;border-radius:50%;background:#fff;border:4px solid #4a6cf7;box-shadow:0 3px 10px rgba(0,0,0,.5);cursor:pointer}
  .rbtrack-bright{background:linear-gradient(90deg,#1b1b24,#6b6e76,#fff)}
  .rbtrack-temp{background:linear-gradient(90deg,#4aa6ff,#d9d9de,#ffb24a)}`;
  document.head.appendChild(s);
}

const RBIco = {
  back: (s=22)=>(<svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round"><path d="M19 12H5"/><path d="M12 19l-7-7 7-7"/></svg>),
  camera: (s=24)=>(<svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"/><circle cx="12" cy="13" r="4"/></svg>),
  wb: (s=24)=>(<svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="9"/><path d="M12 3v18"/><path d="M12 3a9 9 0 0 1 0 18z" fill="currentColor" stroke="none"/></svg>),
  pack: (s=24)=>(<svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/><path d="M3.27 6.96 12 12.01l8.73-5.05"/><path d="M12 22.08V12"/></svg>),
  list: (s=24)=>(<svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><line x1="8" y1="6" x2="21" y2="6"/><line x1="8" y1="12" x2="21" y2="12"/><line x1="8" y1="18" x2="21" y2="18"/><line x1="3" y1="6" x2="3.01" y2="6"/><line x1="3" y1="12" x2="3.01" y2="12"/><line x1="3" y1="18" x2="3.01" y2="18"/></svg>),
  info: (s=22)=>(<svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><path d="M12 16v-4M12 8h.01"/></svg>),
  check: (s=22)=>(<svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round"><path d="M20 6 9 17l-5-5"/></svg>),
  sun: (s=20)=>(<svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M6.34 17.66l-1.41 1.41M19.07 4.93l-1.41 1.41"/></svg>),
  temp: (s=20)=>(<svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><path d="M14 14.76V3.5a2.5 2.5 0 0 0-5 0v11.26a4.5 4.5 0 1 0 5 0z"/></svg>),
  reset: (s=20)=>(<svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 12a9 9 0 1 0 3-6.7L3 8"/><path d="M3 3v5h5"/></svg>),
  target: (s=20)=>(<svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="9"/><circle cx="12" cy="12" r="3.2"/><path d="M12 1v3M12 20v3M1 12h3M20 12h3"/></svg>),
};

function RBNuancierGrid() {
  const cells = [
    ['#E8A87C','871'],['#C38D9E','673'],['#85DCBA','792'],['#41B3A3','741'],
    ['#E27D60','786'],['#5C374C','744'],['#9DE0AD','789'],['#547980','650'],
    ['#45ADA8','730'],['#594F4F','688'],['#F0B49E','855'],['#F38181','671'],
  ];
  return (
    <div style={{ position:'relative', width:'100%', height:'100%', background:'#f4ede3',
      padding:'18px', display:'grid', gridTemplateColumns:'repeat(3,1fr)',
      gap:10, alignContent:'start', filter:'contrast(1.02) saturate(1.05)' }}>
      {cells.map(([c,r],i)=>(
        <div key={i} style={{ display:'flex', flexDirection:'column', gap:4 }}>
          <div style={{ height:8, background:'#fbfaf6', borderRadius:1 }}/>
          <div style={{ aspectRatio:'1.1', background:c, borderRadius:2, boxShadow:'inset 0 0 0 1px rgba(0,0,0,.04)' }}/>
          <div style={{ fontSize:8, color:'#222', fontFamily:'Georgia, serif', textAlign:'center' }}>{r}</div>
        </div>
      ))}
      {/* cercle de sélection sur la case 786 */}
      <div style={{ position:'absolute', top:'21%', left:'40%', width:40, height:40,
        borderRadius:'50%', background:'rgba(74,108,247,.18)', border:'2px solid #4a6cf7' }}/>
    </div>
  );
}

function ChromePill({ children, onClick }) {
  return (
    <button onClick={onClick} style={{
      minHeight:44, padding:'0 14px', borderRadius:13,
      background:'rgba(15,16,26,.86)', backdropFilter:'blur(10px)',
      WebkitBackdropFilter:'blur(10px)', border:`1px solid ${RB.border}`,
      color:RB.text, display:'flex', alignItems:'center', gap:7,
      fontFamily:'inherit', fontSize:14, fontWeight:700, cursor:'pointer',
    }}>{children}</button>
  );
}

function BottomItem({ icon, label, primary, active, disabled, badge, emphasize, fixedWidth, onClick }) {
  const color = disabled ? RB.text3 : primary ? '#fff' : active ? RB.green : RB.text;
  return (
    <button onClick={disabled ? undefined : onClick} style={{
      flex: fixedWidth ? '0 0 auto' : 1, width: fixedWidth || 'auto',
      minHeight:62, position:'relative',
      display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', gap:4,
      borderRadius:14, padding:'6px 2px', fontFamily:'inherit', fontSize:11.5, fontWeight:700,
      letterSpacing:.2, cursor: disabled ? 'default' : 'pointer',
      color, opacity: disabled ? .4 : 1,
      background: primary ? RB.blue : active ? 'rgba(25,195,125,.16)' : 'transparent',
      border: active ? '1px solid rgba(25,195,125,.5)' : '1px solid transparent',
      boxShadow: primary && emphasize ? '0 0 0 4px rgba(74,108,247,.22)' : 'none',
    }}>
      <span style={{ display:'flex' }}>{icon(24)}</span>
      <span>{label}</span>
      {badge>0 && (
        <span style={{ position:'absolute', top:6, right:'50%', marginRight:-22,
          minWidth:18, height:18, padding:'0 5px', borderRadius:9,
          background:RB.blue, color:'#fff', fontSize:10, fontWeight:800,
          display:'flex', alignItems:'center', justifyContent:'center' }}>{badge}</span>
      )}
    </button>
  );
}

function WBSliders({ desktop, status, onRedoAuto, onPickWhite, bright, setBright, temp, setTemp, onDone, onReset }) {
  const statusText = status==='manuel' ? '✓ Définie sur une zone blanche'
    : status==='refait' ? '✓ Refaite automatiquement'
    : '✓ Faite automatiquement au chargement';
  const actionBtn = (icon, label, sub, onClick) => (
    <button onClick={onClick} style={{ flex:1, display:'flex', flexDirection:'column', alignItems:'flex-start', gap:3,
      padding:'11px 13px', borderRadius:12, background:RB.s2, border:`1px solid ${RB.border}`,
      color:RB.text, fontFamily:'inherit', cursor:'pointer', textAlign:'left' }}>
      <span style={{ display:'flex', alignItems:'center', gap:7, fontSize:14, fontWeight:700 }}>
        <span style={{ display:'flex', color:'#9fb4ff' }}>{icon}</span>{label}</span>
      <span style={{ fontSize:11, color:RB.text3, lineHeight:1.3 }}>{sub}</span>
    </button>
  );
  const row = (icon, label, val, setVal, track, hint) => (
    <div style={{ marginBottom:14 }}>
      <div style={{ display:'flex', alignItems:'center', gap:8, marginBottom:8, color:RB.text }}>
        <span style={{ color:'#9fb4ff', display:'flex' }}>{icon}</span>
        <span style={{ fontWeight:700, fontSize:15 }}>{label}</span>
        <span style={{ marginLeft:'auto', fontFamily:'monospace', fontWeight:700, fontSize:13,
          color:'#cfd6ff', background:'rgba(74,108,247,.2)', padding:'2px 10px', borderRadius:8, minWidth:42, textAlign:'center' }}>{val>0?`+${val}`:val}</span>
      </div>
      <input type="range" min="-60" max="60" value={val} onChange={e=>setVal(+e.target.value)} className={`rbsl ${track}`} />
      <div style={{ display:'flex', justifyContent:'space-between', marginTop:6, fontSize:11, fontWeight:600, color:RB.text3 }}>
        <span>{hint[0]}</span><span>{hint[1]}</span>
      </div>
    </div>
  );
  return (
    <div style={{ position:'absolute', zIndex:49, background:'rgba(16,16,26,.97)',
      backdropFilter:'blur(16px)', WebkitBackdropFilter:'blur(16px)', color:'#fff',
      ...(desktop
        ? { bottom:112, left:'50%', transform:'translateX(-50%)', width:440, borderRadius:18,
            border:`1px solid ${RB.border}`, boxShadow:'0 14px 44px rgba(0,0,0,.55)', padding:'16px 18px' }
        : { bottom:96, left:0, right:0, borderTop:`1px solid ${RB.border}`,
            borderRadius:'18px 18px 0 0', padding:'14px 18px 16px', boxShadow:'0 -10px 30px rgba(0,0,0,.4)' }) }}>
      <div style={{ display:'flex', alignItems:'center', marginBottom:12 }}>
        <div>
          <div style={{ fontFamily:'"Bricolage Grotesque", system-ui', fontWeight:800, fontSize:16 }}>Balance des blancs</div>
          <div style={{ fontSize:12.5, color:RB.green, marginTop:2, fontWeight:600 }}>{statusText}</div>
        </div>
        <button onClick={onRedoAuto} title="Refaire automatiquement" style={{ marginLeft:'auto', width:40, height:40, borderRadius:11,
          background:'rgba(255,255,255,.1)', border:`1px solid ${RB.border}`, color:'#fff',
          display:'flex', alignItems:'center', justifyContent:'center' }}>{RBIco.reset(20)}</button>
      </div>
      <div style={{ display:'flex', gap:8, marginBottom:16 }}>
        {actionBtn(RBIco.target(18), 'Pointer une zone blanche', 'Touche le papier blanc de ta photo', onPickWhite)}
      </div>
      <div style={{ fontSize:11, fontWeight:800, letterSpacing:1, textTransform:'uppercase', color:RB.text3, marginBottom:10 }}>Ajuster finement</div>
      {row(RBIco.sun(20), 'Luminosité', bright, setBright, 'rbtrack-bright', ['Plus sombre','Plus clair'])}
      {row(RBIco.temp(20), 'Température', temp, setTemp, 'rbtrack-temp', ['Plus froid','Plus chaud'])}
      <button onClick={onDone} style={{ width:'100%', minHeight:50, borderRadius:13, border:'none',
        background:RB.blue, color:'#fff', fontFamily:'inherit', fontSize:16, fontWeight:700,
        display:'flex', alignItems:'center', justifyContent:'center', gap:8 }}>{RBIco.check(20)} Terminé</button>
    </div>
  );
}

function RechercheBar({ photoLoaded, setPhotoLoaded, wbDone, setWbDone, desktop=false }) {
  const savedCount = 3;
  const [panelOpen, setPanelOpen] = React.useState(false);
  const [pickingWhite, setPickingWhite] = React.useState(false);
  const [wbStatus, setWbStatus] = React.useState('auto');
  const [bright, setBright] = React.useState(-8);
  const [temp, setTemp] = React.useState(12);

  React.useEffect(() => {
    if (photoLoaded) { setWbDone(true); setWbStatus('auto'); }
    else { setPanelOpen(false); setPickingWhite(false); }
  }, [photoLoaded]);

  const confirmWhite = () => { setPickingWhite(false); setWbDone(true); setWbStatus('manuel'); setPanelOpen(true); };

  const dropZone = (
    <div style={{
      border:`2px dashed ${RB.s3}`, borderRadius:20,
      display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center',
      gap:14, textAlign:'center', padding: desktop ? 48 : 24,
      ...(desktop
        ? { width:'min(620px, 80%)', minHeight:380, margin:'auto' }
        : { position:'absolute', top:120, left:18, right:18, bottom:118 }),
    }}>
      <div style={{ fontFamily:'"Bricolage Grotesque", system-ui', fontSize: desktop?28:21, fontWeight:800,
        color:RB.text, maxWidth:420, lineHeight:1.2 }}>
        Trouve tes feutres pour coloriage mystère
      </div>
      <div style={{ width: desktop?88:72, height: desktop?88:72, borderRadius:'50%', background:RB.s2,
        border:`1px solid ${RB.border}`, color:RB.text2,
        display:'flex', alignItems:'center', justifyContent:'center' }}>{RBIco.camera(desktop?42:34)}</div>
      <div style={{ fontSize: desktop?17:15, color:RB.text2 }}>Ouvre une photo ou un PDF du nuancier</div>
      <div style={{ fontSize:13, color:RB.text3 }}>Images (jpg, png…) ou PDF couleurs</div>
    </div>
  );

  const photoView = desktop ? (
    <div onClick={pickingWhite ? confirmWhite : undefined}
      style={{ position:'absolute', inset:0, display:'flex', alignItems:'center', justifyContent:'center',
        padding:'80px 24px 120px', cursor: pickingWhite ? 'crosshair' : 'default' }}>
      <div style={{ width:'min(440px, 60%)', aspectRatio:'0.78', borderRadius:8, overflow:'hidden',
        boxShadow:'0 20px 60px rgba(0,0,0,.5)' }}>
        <RBNuancierGrid/>
      </div>
    </div>
  ) : (
    <div onClick={pickingWhite ? confirmWhite : undefined}
      style={{ position:'absolute', inset:0, paddingTop:90, paddingBottom:104,
        cursor: pickingWhite ? 'crosshair' : 'default' }}>
      <RBNuancierGrid/>
    </div>
  );

  const bottomBar = (
    <div style={{
      position:'absolute', zIndex:50, display:'flex', gap: desktop?8:6,
      ...(desktop
        ? { bottom:24, left:'50%', transform:'translateX(-50%)',
            background:'#0F0F1A', border:`1px solid ${RB.border}`, borderRadius:18,
            padding:8, boxShadow:'0 14px 44px rgba(0,0,0,.55)' }
        : { bottom:0, left:0, right:0, background:'#0F0F1A',
            borderTop:`1px solid ${RB.border}`, paddingTop:8, paddingBottom:26, paddingLeft:8, paddingRight:8 }),
    }}>
      <BottomItem icon={RBIco.camera} label={photoLoaded?'Photo':'Ouvrir'} primary
        emphasize={!photoLoaded} fixedWidth={desktop?108:0} onClick={()=>setPhotoLoaded(true)} />
      <BottomItem icon={wbDone?RBIco.check:RBIco.wb} label={wbDone?'Blancs OK':'Blancs'}
        active={wbDone} disabled={!photoLoaded} fixedWidth={desktop?108:0}
        onClick={()=>{ setWbDone(true); setPickingWhite(false); setPanelOpen(true); }} />
      <BottomItem icon={RBIco.pack} label="Mes feutres" fixedWidth={desktop?108:0} onClick={()=>{}} />
      <BottomItem icon={RBIco.list} label="Liste" badge={savedCount} fixedWidth={desktop?108:0} onClick={()=>{}} />
    </div>
  );

  return (
    <div style={{ height:'100%', position:'relative', overflow:'hidden',
      background:RB.bg, color:RB.text, fontFamily:'system-ui, sans-serif',
      display: desktop && !photoLoaded ? 'flex' : 'block' }}>

      {photoLoaded ? photoView : dropZone}

      {/* Chrome haut */}
      <div style={{ position:'absolute', top: desktop?20:54, left: desktop?20:14, right: desktop?20:14, zIndex:60,
        display:'flex', justifyContent:'space-between', alignItems:'flex-start' }}>
        <ChromePill>{RBIco.back(20)}<span>Retour</span></ChromePill>
        <div style={{ display:'flex', gap:8 }}>
          <button style={{
            minHeight:44, padding:'0 15px', borderRadius:13,
            background:'#4A6CF7', border:'1px solid #4A6CF7',
            color:'#fff', boxShadow:'0 2px 10px rgba(74,108,247,.4)',
            display:'flex', alignItems:'center', gap:7, fontFamily:'inherit', fontSize:14, fontWeight:700, cursor:'pointer',
          }}>
            <span style={{ display:'flex', color:'#fff' }}>{RBIco.info(20)}</span>
            <span>Conseils</span>
          </button>
          <ChromePill><span style={{ fontSize:14 }}>🇫🇷</span><span>FR</span></ChromePill>
        </div>
      </div>

      {pickingWhite && (
        <div style={{ position:'absolute', top: desktop?74:100, left:0, right:0, zIndex:58,
          display:'flex', justifyContent:'center', pointerEvents:'none' }}>
          <div style={{ background:'rgba(245,166,35,.96)', color:'#1a1300', fontWeight:800, fontSize:13,
            padding:'10px 18px', borderRadius:12, boxShadow:'0 6px 20px rgba(0,0,0,.4)' }}>
            ⚪ Touche une zone blanche du papier
          </div>
        </div>
      )}

      {panelOpen && photoLoaded && (
        <WBSliders desktop={desktop} status={wbStatus}
          onRedoAuto={()=>{ setWbStatus('refait'); setBright(0); setTemp(0); }}
          onPickWhite={()=>{ setPanelOpen(false); setPickingWhite(true); }}
          bright={bright} setBright={setBright} temp={temp} setTemp={setTemp}
          onDone={()=>setPanelOpen(false)} />
      )}

      {bottomBar}
    </div>
  );
}

Object.assign(window, { RechercheBar });
