// Carte partenaire — partagée entre l'accueil et le panneau Conseils (source unique)
const PC = { s2:'#20223A', border:'rgba(255,255,255,.10)', text:'#ECECF4', text2:'#A2A3B8', text3:'#6E7088' };

function PartnerCard() {
  return (
    <div style={{ background:'linear-gradient(135deg, rgba(247,37,133,.12), rgba(255,102,53,.09))',
      border:'1px solid rgba(247,37,133,.32)', borderRadius:16, padding:'16px 18px' }}>
      <div style={{ fontSize:11, fontWeight:800, letterSpacing:1.2, textTransform:'uppercase', color:PC.text3, marginBottom:8 }}>En partenariat avec</div>
      <div style={{ display:'flex', alignItems:'center', gap:10, marginBottom:8 }}>
        <div style={{ fontFamily:'"Bricolage Grotesque", system-ui', fontSize:19, fontWeight:800, color:PC.text }}>Popping Boutiques</div>
        <span style={{ background:'#F72585', color:'#fff', fontWeight:800, fontSize:12, padding:'3px 9px', borderRadius:999 }}>−10%</span>
      </div>
      <div style={{ fontSize:13.5, color:PC.text2, lineHeight:1.55, marginBottom:12 }}>
        Révélo est soutenu par <strong style={{color:PC.text}}>Popping Boutiques</strong>, boutique de produits dérivés et goodies sous licence, feutres &amp; coloriages. <strong style={{color:PC.text}}>Un grand merci à eux pour leur confiance ❤️</strong> Profite de <strong style={{color:PC.text}}>−10%*</strong> sur tout le site avec le code :
      </div>
      <div style={{ display:'flex', gap:10, alignItems:'center', marginBottom:14 }}>
        <div style={{ fontFamily:'"JetBrains Mono", monospace', fontWeight:700, fontSize:16, letterSpacing:1,
          background:PC.s2, border:`1px dashed ${PC.border}`, color:'#fff', padding:'8px 16px', borderRadius:10 }}>REVELO</div>
        <span style={{ fontSize:12.5, color:PC.text3 }}>à coller au paiement</span>
      </div>
      <a href="https://popping-boutiques.com/?ref=212QD95V&chn=1" target="_blank" rel="noopener"
        style={{ display:'flex', alignItems:'center', justifyContent:'center', minHeight:50, borderRadius:13,
        background:'#fff', color:'#1a1320', fontWeight:700, fontSize:15, textDecoration:'none' }}>
        Découvrir la boutique →
      </a>
      <div style={{ fontSize:11.5, color:PC.text3, marginTop:10, lineHeight:1.4, textAlign:'center' }}>
        *Hors Mystery Bag, coloriages &amp; TikTok Shop.
      </div>
    </div>
  );
}

Object.assign(window, { PartnerCard });
