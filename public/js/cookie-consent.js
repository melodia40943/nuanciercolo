// Fonction globale de signalement d'erreur (utilisée par test.html et dashboard.html)
window.reportError = function(code, page) {
  navigator.sendBeacon('/api/report-error',
    new Blob([JSON.stringify({ error_code: code, page: page || location.pathname })],
    { type: 'application/json' })
  );
};

(function () {
  const CONSENT_COOKIE = 'revelo_consent';
  const ONE_YEAR = 365 * 24 * 60 * 60;

  function getCookie(name) {
    const match = document.cookie.split(';').map(c => c.trim()).find(c => c.startsWith(name + '='));
    return match ? match.slice(name.length + 1) : null;
  }

  function setCookie(name, value, maxAgeSec) {
    const secure = location.protocol === 'https:' ? ';Secure' : '';
    document.cookie = `${name}=${value};Max-Age=${maxAgeSec};Path=/;SameSite=Lax${secure}`;
  }

  // Déjà une réponse → pas de bannière
  if (getCookie(CONSENT_COOKIE) !== null) return;

  // Textes traduits (t() disponible via i18n.js chargé avant)
  const txtAccept = (typeof t === 'function') ? t('cookie.accept') : 'Accepter';
  const txtRefuse = (typeof t === 'function') ? t('cookie.refuse') : 'Refuser';
  const txtBody   = (typeof t === 'function') ? t('cookie.text')
    : '🍪 Ce site utilise un cookie <strong>anonyme</strong> pour compter les visites. Aucune donnée personnelle n\'est collectée.';

  // Crée la bannière
  const banner = document.createElement('div');
  banner.id = 'cookie-banner';
  banner.innerHTML = `
    <div id="cookie-banner-inner">
      <p id="cookie-banner-text">${txtBody}</p>
      <div id="cookie-banner-btns">
        <button id="cookie-accept">${txtAccept}</button>
        <button id="cookie-refuse">${txtRefuse}</button>
      </div>
    </div>
  `;

  const style = document.createElement('style');
  style.textContent = `
    #cookie-banner {
      position: fixed;
      bottom: 0; left: 0; right: 0;
      background: rgba(20, 20, 30, 0.97);
      color: #eee;
      z-index: 9999;
      padding: 14px 16px;
      font-family: system-ui, sans-serif;
      font-size: 0.82rem;
      box-shadow: 0 -2px 16px rgba(0,0,0,0.3);
    }
    #cookie-banner-inner {
      max-width: 700px;
      margin: 0 auto;
      display: flex;
      align-items: center;
      gap: 16px;
      flex-wrap: wrap;
    }
    #cookie-banner-text {
      flex: 1;
      min-width: 200px;
      margin: 0;
      line-height: 1.5;
      color: #ccc;
    }
    #cookie-banner-text strong { color: #fff; }
    #cookie-banner-btns {
      display: flex;
      gap: 8px;
      flex-shrink: 0;
    }
    #cookie-accept {
      background: #F72585;
      color: #fff;
      border: none;
      border-radius: 8px;
      padding: 8px 18px;
      font-size: 0.82rem;
      font-weight: 600;
      cursor: pointer;
    }
    #cookie-accept:hover { background: #d4006e; }
    #cookie-refuse {
      background: transparent;
      color: #aaa;
      border: 1px solid #555;
      border-radius: 8px;
      padding: 8px 14px;
      font-size: 0.82rem;
      cursor: pointer;
    }
    #cookie-refuse:hover { color: #eee; border-color: #888; }
  `;

  document.head.appendChild(style);
  document.body.appendChild(banner);

  document.getElementById('cookie-accept').addEventListener('click', () => {
    setCookie(CONSENT_COOKIE, '1', ONE_YEAR);
    banner.remove();
  });

  document.getElementById('cookie-refuse').addEventListener('click', () => {
    setCookie(CONSENT_COOKIE, '0', ONE_YEAR);
    banner.remove();
  });
})();
