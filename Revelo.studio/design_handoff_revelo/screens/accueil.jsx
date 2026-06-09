// Page d'accueil / hub Révélo — mène vers l'outil couleur (extensible aux futurs outils)
const HM = {
  bg:'#0E0F1A', s1:'#181A2E', s2:'#20223A', border:'rgba(255,255,255,.10)',
  text:'#ECECF4', text2:'#A2A3B8', text3:'#6E7088', blue:'#4A6CF7',
};

// Logo roue (nettoyé : trou = fond)
function ReveloMark({ size=64, hole='#0E0F1A' }) {
  return (
    <svg width={size} height={size} viewBox="0 0 200 200">
      <path d="M102.1 14.03A86 86 0 0 1 159.31 37.72L122.76 76.1A33 33 0 0 0 100.81 67.01Z" fill="#F72585"></path>
      <path d="M171.52 36.87A86 86 0 0 1 195.21 94.07L142.23 95.37A33 33 0 0 0 133.14 73.42Z" fill="#FF6635"></path>
      <path d="M185.97 102.1A86 86 0 0 1 162.28 159.31L123.9 122.76A33 33 0 0 0 132.99 100.81Z" fill="#FFD500"></path>
      <path d="M159.31 162.28A86 86 0 0 1 102.1 185.97L100.81 132.99A33 33 0 0 0 122.76 123.9Z" fill="#06D6A0"></path>
      <path d="M97.9 185.97A86 86 0 0 1 40.69 162.28L77.24 123.9A33 33 0 0 0 99.19 132.99Z" fill="#4CC9F0"></path>
      <path d="M37.72 159.31A86 86 0 0 1 14.03 102.1L67.01 100.81A33 33 0 0 0 76.1 122.76Z" fill="#4361EE"></path>
      <path d="M14.03 97.9A86 86 0 0 1 37.72 40.69L76.1 77.24A33 33 0 0 0 67.01 99.19Z" fill="#8B2FC9"></path>
      <path d="M40.69 37.72A86 86 0 0 1 97.9 14.03L99.19 67.01A33 33 0 0 0 77.24 76.1Z" fill="#FF5470"></path>
      <circle cx="100" cy="100" r="26" fill={hole}></circle>
    </svg>
  );
}

const HMIco = {
  camera:(s=24)=>(<svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"/><circle cx="12" cy="13" r="4"/></svg>),
  chevron:(s=22)=>(<svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round"><path d="m9 6 6 6-6 6"/></svg>),
  info:(s=20)=>(<svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><path d="M12 16v-4M12 8h.01"/></svg>),
  bag:(s=24)=>(<svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><path d="M6 2 3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z"/><path d="M3 6h18"/><path d="M16 10a4 4 0 0 1-8 0"/></svg>),
};

function Home({ desktop=false }) {
  const social = (grad, svg) => (
    <div style={{ width:36, height:36, borderRadius:'50%', background:grad, color:'#fff',
      display:'flex', alignItems:'center', justifyContent:'center' }}>{svg}</div>
  );
  return (
    <div style={{ height:'100%', position:'relative', overflowY:'auto', background:HM.bg, color:HM.text,
      fontFamily:'system-ui, sans-serif' }}>
      {/* Chrome haut : langue */}
      <div style={{ position:'absolute', top: desktop?18:50, right:16, zIndex:10, display:'flex', gap:8 }}>
        <button style={{ minHeight:42, padding:'0 13px', borderRadius:12, background:'rgba(255,255,255,.06)',
          border:`1px solid ${HM.border}`, color:HM.text, fontFamily:'inherit', fontSize:14, fontWeight:700 }}>🇫🇷 FR</button>
      </div>

      <div style={{ minHeight:'100%', display:'flex', flexDirection:'column', alignItems:'center',
        padding: desktop ? '70px 28px 28px' : '110px 22px 34px' }}>

        {/* Marque */}
        <ReveloMark size={desktop?76:84} hole={HM.bg} />
        <div style={{ fontFamily:'"Bricolage Grotesque", system-ui', fontSize:38, fontWeight:800, letterSpacing:-.5, marginTop:16 }}>Révélo</div>
        <div style={{ fontSize:15, color:HM.text2, textAlign:'center', maxWidth:320, marginTop:6, lineHeight:1.45 }}>
          Ton partenaire pour le coloriage.
        </div>

        {/* Outils */}
        <div style={{ width:'100%', maxWidth:440, marginTop:34, display:'flex', flexDirection:'column', gap:12 }}>
          <button style={{ width:'100%', display:'flex', alignItems:'center', gap:14, textAlign:'left',
            padding:18, borderRadius:18, cursor:'pointer', fontFamily:'inherit', color:HM.text,
            background:'rgba(74,108,247,.10)', border:'1px solid rgba(74,108,247,.4)' }}>
            <div style={{ width:52, height:52, borderRadius:14, background:HM.blue, color:'#fff', flexShrink:0,
              display:'flex', alignItems:'center', justifyContent:'center', boxShadow:'0 6px 16px rgba(74,108,247,.45)' }}>{HMIco.camera(26)}</div>
            <div style={{ flex:1, minWidth:0 }}>
              <div style={{ fontFamily:'"Bricolage Grotesque", system-ui', fontSize:18, fontWeight:800 }}>Trouver mes feutres</div>
              <div style={{ fontSize:13, color:HM.text2, marginTop:2, lineHeight:1.4 }}>Photographie une couleur, vois les références les plus proches</div>
            </div>
            <span style={{ color:HM.blue, flexShrink:0 }}>{HMIco.chevron(24)}</span>
          </button>

          <PartnerCard />
        </div>

        <div style={{ flex:1 }}></div>

        {/* Soutien */}
        <div style={{ marginTop:34, textAlign:'center' }}>
          <a href="https://fr.tipeee.com/revelo/" target="_blank" rel="noopener"
            style={{ display:'inline-flex', alignItems:'center', gap:8, minHeight:44, padding:'0 18px', borderRadius:999,
            background:'linear-gradient(135deg,#FF7A66,#FF5E5B)', color:'#fff', fontWeight:700, fontSize:14, textDecoration:'none' }}>
            ☕ Soutenir le projet
          </a>
          <div style={{ display:'flex', justifyContent:'center', gap:12, marginTop:16 }}>
            {social('linear-gradient(135deg,#FF5470,#F72585,#FF6635)', <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z"/></svg>)}
            {social('linear-gradient(135deg,#FFD500,#06D6A0,#4CC9F0)', <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="2" width="20" height="20" rx="5" ry="5"/><path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"/><circle cx="17.5" cy="6.5" r="0.5" fill="currentColor" stroke="none"/></svg>)}
            {social('linear-gradient(135deg,#4361EE,#8B2FC9,#FF5470)', <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9 12a4 4 0 1 0 4 4V4a5 5 0 0 0 5 5"/></svg>)}
          </div>
        </div>
      </div>
    </div>
  );
}

Object.assign(window, { Home, ReveloMark });
