// Panneau Conseils / Info — onboarding (remplace la page /conseils)
// Cartes texte + bloc partenaire + soutien. Modale centrée en desktop, plein écran mobile.
const IP = {
  bg:'#0F0F1A', s1:'#181A2E', s2:'#20223A', border:'rgba(255,255,255,.10)',
  text:'#ECECF4', text2:'#A2A3B8', text3:'#6E7088', blue:'#4A6CF7',
};

function Tip({ icon, title, children, highlight=true }) {
  return (
    <div style={{
      background: highlight ? 'rgba(74,108,247,.08)' : 'rgba(255,255,255,.05)',
      border: highlight ? '1px solid rgba(74,108,247,.35)' : `1px solid ${IP.border}`,
      borderRadius:16, padding:'16px 18px', display:'flex', gap:14, alignItems:'flex-start',
    }}>
      <div style={{ fontSize:26, flexShrink:0, lineHeight:1, marginTop:1 }}>{icon}</div>
      <div style={{ flex:1, minWidth:0 }}>
        <div style={{ fontSize:15.5, fontWeight:700, color:'#fff', marginBottom:5, lineHeight:1.25 }}>{title}</div>
        <div style={{ fontSize:13.5, lineHeight:1.55, color:IP.text2 }}>{children}</div>
      </div>
    </div>
  );
}

function Step({ n, children }) {
  return (
    <div style={{ display:'flex', alignItems:'baseline', gap:9, marginTop:7, fontSize:13.5, color:IP.text2 }}>
      <span style={{ background:IP.blue, color:'#fff', borderRadius:'50%', width:20, height:20,
        display:'flex', alignItems:'center', justifyContent:'center', fontSize:11, fontWeight:700, flexShrink:0 }}>{n}</span>
      <span>{children}</span>
    </div>
  );
}

function InfoPanel({ desktop=false, onClose }) {
  const social = (grad, svg) => (
    <div style={{ width:36, height:36, borderRadius:'50%', background:grad, color:'#fff',
      display:'flex', alignItems:'center', justifyContent:'center' }}>{svg}</div>
  );
  return (
    <div style={{ height:'100%', position:'relative', display:'flex', flexDirection:'column', background:IP.bg,
      color:IP.text, fontFamily:'system-ui, sans-serif' }}>
      {/* Fermer (flottant) */}
      <button onClick={onClose} style={{ position:'absolute', top: desktop?14:48, right:16, zIndex:10,
        width:44, height:44, borderRadius:12,
        background:IP.s2, border:`1px solid ${IP.border}`, color:IP.text2,
        display:'flex', alignItems:'center', justifyContent:'center' }}>
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round"><path d="M18 6 6 18M6 6l12 12"/></svg>
      </button>

      {/* Scroll */}
      <div style={{ flex:1, overflowY:'auto', padding: desktop ? '56px 22px 8px' : '84px 20px 8px' }}>
        {/* Partenaire — carte partagée (cf. screens/partner.jsx) */}
        <div style={{ marginBottom:20 }}><PartnerCard /></div>

        <div style={{ marginBottom:14 }}>
          <div style={{ fontFamily:'"Bricolage Grotesque", system-ui', fontSize:24, fontWeight:800 }}>Avant de commencer</div>
          <div style={{ fontSize:13.5, color:IP.text2, marginTop:2 }}>Quelques conseils pour des résultats fiables</div>
        </div>
        <div style={{ display:'flex', flexDirection:'column', gap:12 }}>

          <Tip icon="🎯" title="Le résultat n'est qu'un point de départ">
            Le nuancier numérique a été créé à partir des feutres en ma possession, de façon non officielle.
            L'app donne les <strong style={{color:IP.text}}>meilleures correspondances perceptuelles</strong> —
            fais confiance à ton œil pour le choix final.
          </Tip>

          <Tip icon="📄" title="Les PDFs de référence : la meilleure source">
            Certains artistes publient des PDFs avec les <strong style={{color:IP.text}}>couleurs numériques exactes</strong>.
            Résultats bien meilleurs qu'une photo, et <strong style={{color:IP.text}}>pas besoin de balance des blancs</strong> :
            touche directement la case colorée.
            <a style={{ display:'inline-block', marginTop:8, color:IP.blue, fontWeight:700, textDecoration:'none' }}>🎨 Palettes de référence par Jeremy Mariez →</a>
          </Tip>

          <Tip icon="💡" title="Éclairage — pour les photos uniquement">
            Utilise une <strong style={{color:IP.text}}>lampe de bureau</strong> plutôt que le flash, qui crée des reflets
            qui faussent les couleurs. Avec un PDF de référence, l'éclairage n'a aucune importance.
          </Tip>

          <Tip icon="⚪" title="Balance des blancs — pour les photos uniquement">
            Les livres Hachette ont une <strong style={{color:IP.text}}>bande blanche</strong> juste au-dessus de chaque case — c'est ta référence parfaite.
            <Step n="1">Touche le bouton Blancs → « Pointer une zone blanche »</Step>
            <Step n="2">Touche la <strong style={{color:IP.text}}>bande blanche au-dessus</strong> de la couleur</Step>
            <Step n="3">Échantillonne la couleur en la touchant</Step>
          </Tip>

          <Tip icon="📸" title="Continue à partager tes colos !" highlight={false}>
            Tu partages tes créations sur les réseaux ? <strong style={{color:IP.text}}>On adore voir vos colos et vos codes couleurs</strong> —
            ça inspire toute la communauté. Continue à taguer et à partager !
          </Tip>
        </div>

        {/* Soutien */}
        <div style={{ marginTop:22, textAlign:'center' }}>
          <a href="https://fr.tipeee.com/revelo/" target="_blank" rel="noopener"
            style={{ display:'inline-flex', alignItems:'center', gap:8, minHeight:46, padding:'0 20px', borderRadius:999,
            background:'linear-gradient(135deg,#FF7A66,#FF5E5B)', color:'#fff', fontWeight:700, fontSize:15, textDecoration:'none' }}>
            ☕ Soutenir le projet sur Tipeee
          </a>
          <div style={{ display:'flex', justifyContent:'center', gap:12, marginTop:16 }}>
            {social('linear-gradient(135deg,#FF5470,#F72585,#FF6635)', <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z"/></svg>)}
            {social('linear-gradient(135deg,#FFD500,#06D6A0,#4CC9F0)', <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="2" width="20" height="20" rx="5" ry="5"/><path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"/><circle cx="17.5" cy="6.5" r="0.5" fill="currentColor" stroke="none"/></svg>)}
            {social('linear-gradient(135deg,#4361EE,#8B2FC9,#FF5470)', <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9 12a4 4 0 1 0 4 4V4a5 5 0 0 0 5 5"/></svg>)}
          </div>
        </div>
      </div>

      {/* Footer CTA */}
      <div style={{ flexShrink:0, padding: desktop ? '14px 22px 18px' : '12px 20px 30px', borderTop:`1px solid ${IP.border}` }}>
        <button onClick={onClose} style={{ width:'100%', minHeight:58, borderRadius:16, border:'none',
          background:IP.blue, color:'#fff', fontFamily:'inherit', fontSize:18, fontWeight:700,
          boxShadow:'0 8px 22px rgba(74,108,247,.4)' }}>C'est parti →</button>
      </div>
    </div>
  );
}

Object.assign(window, { InfoPanel });
