// ── Révélo i18n ──────────────────────────────────────────────────────────────
// Usage HTML  : <el data-i18n="clé">texte par défaut</el>
//               <el data-i18n-html="clé">texte avec <strong>balises</strong></el>
// Usage JS    : t('clé')
// Switcher    : setLang('en') / setLang('es') / setLang('fr')

const TRANSLATIONS = {

  fr: {
    // ── tips.html ──
    'tips.title':          'Conseils — Révélo',
    'tips.h1':             'Avant de commencer',
    'tips.subtitle':       'Quelques conseils pour des résultats fiables',

    'tips.t1.h2':  'Le résultat n\'est qu\'un point de départ',
    'tips.t1.p1':  'L\'application a été conçue de manière tout à fait non officielle.',
    'tips.t1.p2':  'Je me suis servie des marqueurs que j\'avais en ma possession pour créer le nuancier numérique le plus proche possible de la vérité.',
    'tips.t1.p3':  'Mais l\'application ne donne que les <strong>meilleures correspondances perceptuelles</strong> — fais confiance à ton œil pour le choix final entre les premiers résultats.',

    'tips.t2.h2':   'Les PDFs de référence : la meilleure source',
    'tips.t2.p':    'Certains artistes publient des PDFs avec les <strong>couleurs numériques exactes</strong> qu\'ils avaient en tête. Ces fichiers donnent des résultats bien meilleurs qu\'une photo. <strong>Pense quand même à faire la balance des blancs</strong> avant de cliquer sur la case colorée.',
    'tips.t2.link': '🎨 Palettes de référence par Jeremy Mariez →',

    'tips.t3.h2': 'Éclairage',
    'tips.t3.p':  'Utilise une <strong>lampe de bureau</strong> plutôt que le flash de ton téléphone.<br>Le flash crée des reflets qui faussent les couleurs.<br><strong>Avec un PDF Jeremy Mariez, l\'éclairage n\'a aucune importance.</strong>',

    'tips.t4.h2':   'Balance des blancs — toujours recommandée',
    'tips.t4.p':    'Les livres Hachette ont une <strong>bande blanche naturelle</strong> juste au-dessus de chaque case colorée — c\'est ta référence parfaite. Sur un PDF, clique sur une zone blanche de la page.',
    'tips.t4.s1':   'Tape sur le bouton balance des blancs (⚪)',
    'tips.t4.s2':   'Clique sur la <strong>bande blanche au-dessus</strong> de la couleur à identifier',
    'tips.t4.s3':   'Échantillonne la couleur en dessinant un cercle dessus',

    'tips.t5.h2': 'Continue à partager tes colos !',
    'tips.t5.p':  'Tu partages tes créations sur les réseaux ? <strong>On adore voir vos colos et les codes couleurs que vous utilisez</strong> — ça inspire toute la communauté. Continue à taguer et à partager !',

    'tips.cta.start':   'C\'est parti →',
    'tips.cta.install': 'Ajouter à l\'écran d\'accueil',
    'tips.cta.ios':     'Sur iPhone : appuie sur <strong>Partager</strong> puis <strong>"Sur l\'écran d\'accueil"</strong>',
    'tips.cta.skip':    'Ces conseils sont accessibles depuis le menu à tout moment.',
    'tips.cta.kofi':    '☕ Soutenir le projet sur Tipeee',

    // ── test.html ──
    'app.back':           '← Retour',
    'app.pack':           '🎨 Pack',
    'app.photo':          '📷 Photo',
    'app.wb':             '⚪ Balance des blancs',
    'app.wb.pending':     '⚠️ Tape sur le blanc de référence…',
    'app.wb.done':        '✓ Blancs OK (retaper pour changer)',
    'app.wb.reset':       '⚪ Balance des blancs',

    'drop.text':          'Ouvre une photo ou un PDF du nuancier',
    'drop.sub':           'Images (jpg, png…) ou PDF couleurs',
    'drop.tips':          'Conseils pour de meilleurs résultats →',

    'sheet.tap':          'Tape sur une couleur',
    'sheet.all':          '↑ tous les matchs',
    'sheet.save':         '+ Enregistrer ce résultat',
    'sheet.empty':        'Tape sur une couleur du nuancier pour voir les matchs',
    'sheet.kofi':         '☕ Soutenir le projet',

    'coll.title':         'Ma collection',
    'coll.close':         '✕ Fermer',
    'coll.all':           'Toutes les couleurs',
    'coll.custom':        'Ma sélection',
    'coll.add.label':     'Ajouter une marque',
    'coll.add.marque':    '— Choisir une marque —',
    'coll.add.pack':      '— Choisir un pack —',
    'coll.add.btn':       '+ Ajouter à ma collection',
    'coll.nopacks':       '⚠️ Aucun pack enregistré pour cette marque',
    'coll.apply':         '✓ Appliquer',

    'saved.title':        'Recherches enregistrées',
    'saved.close':        '✕ Fermer',
    'saved.empty':        'Aucune recherche enregistrée',
    'saved.clear':        '🗑 Vider',
    'saved.clear.confirm':'Vider toutes les recherches enregistrées ?',
    'saved.jpeg':         '⬇ JPEG',
    'saved.json':         '⬇ JSON',

    'toast.wb.set':       '✓ Balance des blancs appliquée',
    'toast.wb.reset':     'Balance des blancs réinitialisée',
    'toast.saved':        '✓ Résultat enregistré',
    'toast.nodb':         '⚠️ Aucune couleur en base',

    'export.title':       'Révélo — Résultats',
    'export.watermark':   'révélo · généré le ',
    'export.prompt':      'Nom du fichier (sans extension) :',
    'export.filename':    'tome_page',

    'app.wb.auto':        '✓ Blancs OK (auto)',
    'match.great':        'Excellent',
    'match.good':         'Proche',
    'match.ok':           'Éloigné',

    'toast.wb.def':       '✓ Balance définie — ajuste avec les curseurs',
    'toast.wb.reset.full':'Photo originale restaurée',
    'toast.wb.auto.ok':   '✓ Balance auto — ajuste si besoin',
    'toast.wb.auto.dark': '⚠️ Photo sombre — ajuste la luminosité',
    'toast.wb.auto.no':   'Tape sur ⚪ sur la bande blanche du livre',
    'toast.wb.dark':      '⚠️ Zone trop sombre — tape sur le blanc',
    'toast.sample.fail':  '⚠️ Zone invalide — réessaie',
    'toast.clear.done':   'Liste vidée',
    'toast.export.empty': 'Aucune recherche à exporter',
    'toast.export.jpeg':  '✓ Export JPEG téléchargé',
    'toast.export.json':  '✓ Export JSON téléchargé',
    'toast.coll.fail':    '⚠️ Impossible de charger les collections — recharge la page',
    'toast.colors.fail':  '⚠️ Impossible de charger les couleurs — recharge la page',
    'toast.pdf.fail':     '⚠️ Impossible de lire ce PDF',
    'export.chosen':      'choisi',
    'pdf.pages':          ' pages — choisir une page',
  },

  en: {
    // ── tips.html ──
    'tips.title':         'Tips — Révélo',
    'tips.h1':            'Before you start',
    'tips.subtitle':      'A few tips for reliable results',

    'tips.t1.h2':  'The result is just a starting point',
    'tips.t1.p1':  'This app was created in a completely unofficial way.',
    'tips.t1.p2':  'I used the markers I had on hand to create a digital swatch chart as accurate as possible.',
    'tips.t1.p3':  'But the app only gives you the <strong>best perceptual matches</strong> — trust your eye for the final choice among the top results.',

    'tips.t2.h2':   'Reference PDFs: the best source',
    'tips.t2.p':    'Some artists publish PDFs with the <strong>exact digital colors</strong> they had in mind. These files give much better results than a photo. <strong>Still do the white balance</strong> before clicking on the colored cell.',
    'tips.t2.link': '🎨 Reference palettes by Jeremy Mariez →',

    'tips.t3.h2': 'Lighting',
    'tips.t3.p':  'Use a <strong>desk lamp</strong> rather than your phone\'s flash.<br>Flash creates reflections that distort colors.<br><strong>With a Jeremy Mariez PDF, lighting doesn\'t matter at all.</strong>',

    'tips.t4.h2':   'White balance — always recommended',
    'tips.t4.p':    'Hachette books have a <strong>natural white strip</strong> just above each colored cell — that\'s your perfect reference. On a PDF, click on any white area of the page.',
    'tips.t4.s1':   'Tap the white balance button (⚪)',
    'tips.t4.s2':   'Click on the <strong>white strip above</strong> the color you want to identify',
    'tips.t4.s3':   'Sample the color by drawing a circle over it',

    'tips.t5.h2': 'Keep sharing your colorings!',
    'tips.t5.p':  'Do you share your creations on social media? <strong>We love seeing your colorings and the color codes you use</strong> — it inspires the whole community. Keep tagging and sharing!',

    'tips.cta.start':   'Let\'s go →',
    'tips.cta.install': 'Add to home screen',
    'tips.cta.ios':     'On iPhone: tap <strong>Share</strong> then <strong>"Add to Home Screen"</strong>',
    'tips.cta.skip':    'These tips are accessible from the menu at any time.',
    'tips.cta.kofi':    '☕ Support the project on Tipeee',

    // ── test.html ──
    'app.back':           '← Back',
    'app.pack':           '🎨 Pack',
    'app.photo':          '📷 Photo',
    'app.wb':             '⚪ White balance',
    'app.wb.pending':     '⚠️ Tap on the white reference…',
    'app.wb.done':        '✓ White balance set (tap to change)',
    'app.wb.reset':       '⚪ White balance',

    'drop.text':          'Open a photo or PDF of your color chart',
    'drop.sub':           'Images (jpg, png…) or color PDF',
    'drop.tips':          'Tips for better results →',

    'sheet.tap':          'Tap on a color',
    'sheet.all':          '↑ all matches',
    'sheet.save':         '+ Save this result',
    'sheet.empty':        'Tap on a color to see matches',
    'sheet.kofi':         '☕ Support the project',

    'coll.title':         'My collection',
    'coll.close':         '✕ Close',
    'coll.all':           'All colors',
    'coll.custom':        'My selection',
    'coll.add.label':     'Add a brand',
    'coll.add.marque':    '— Choose a brand —',
    'coll.add.pack':      '— Choose a pack —',
    'coll.add.btn':       '+ Add to my collection',
    'coll.nopacks':       '⚠️ No packs registered for this brand',
    'coll.apply':         '✓ Apply',

    'saved.title':        'Saved searches',
    'saved.close':        '✕ Close',
    'saved.empty':        'No saved searches',
    'saved.clear':        '🗑 Clear',
    'saved.clear.confirm':'Clear all saved searches?',
    'saved.jpeg':         '⬇ JPEG',
    'saved.json':         '⬇ JSON',

    'toast.wb.set':       '✓ White balance applied',
    'toast.wb.reset':     'White balance reset',
    'toast.saved':        '✓ Result saved',
    'toast.nodb':         '⚠️ No colors in database',

    'export.title':       'Révélo — Results',
    'export.watermark':   'révélo · generated on ',
    'export.prompt':      'File name (without extension):',
    'export.filename':    'page',

    'app.wb.auto':        '✓ White balance auto set',
    'match.great':        'Excellent',
    'match.good':         'Close',
    'match.ok':           'Distant',

    'toast.wb.def':       '✓ Balance set — use sliders to adjust',
    'toast.wb.reset.full':'Original photo restored',
    'toast.wb.auto.ok':   '✓ Auto balance set — adjust if needed',
    'toast.wb.auto.dark': '⚠️ Dark photo — adjust brightness',
    'toast.wb.auto.no':   'Tap ⚪ on the white strip of the book',
    'toast.wb.dark':      '⚠️ Too dark — tap on white reference',
    'toast.sample.fail':  '⚠️ Invalid area — try again',
    'toast.clear.done':   'List cleared',
    'toast.export.empty': 'No searches to export',
    'toast.export.jpeg':  '✓ JPEG exported',
    'toast.export.json':  '✓ JSON exported',
    'toast.coll.fail':    '⚠️ Could not load collections — reload the page',
    'toast.colors.fail':  '⚠️ Could not load colors — reload the page',
    'toast.pdf.fail':     '⚠️ Could not read this PDF',
    'export.chosen':      'chosen',
    'pdf.pages':          ' pages — choose a page',
  },

  es: {
    // ── tips.html ──
    'tips.title':         'Consejos — Révélo',
    'tips.h1':            'Antes de empezar',
    'tips.subtitle':      'Algunos consejos para obtener resultados fiables',

    'tips.t1.h2':  'El resultado es solo un punto de partida',
    'tips.t1.p1':  'Esta aplicación fue creada de manera completamente no oficial.',
    'tips.t1.p2':  'Usé los marcadores que tenía a mano para crear la tabla de colores digital lo más precisa posible.',
    'tips.t1.p3':  'Pero la aplicación solo te da las <strong>mejores correspondencias perceptuales</strong> — confía en tu ojo para la elección final entre los primeros resultados.',

    'tips.t2.h2':   'PDFs de referencia: la mejor fuente',
    'tips.t2.p':    'Algunos artistas publican PDFs con los <strong>colores digitales exactos</strong> que tenían en mente. Estos archivos dan resultados mucho mejores que una foto. <strong>Haz igualmente el balance de blancos</strong> antes de hacer clic en la celda de color.',
    'tips.t2.link': '🎨 Paletas de referencia por Jeremy Mariez →',

    'tips.t3.h2': 'Iluminación',
    'tips.t3.p':  'Usa una <strong>lámpara de escritorio</strong> en lugar del flash de tu teléfono.<br>El flash crea reflejos que distorsionan los colores.<br><strong>Con un PDF de Jeremy Mariez, la iluminación no importa.</strong>',

    'tips.t4.h2':   'Balance de blancos — siempre recomendado',
    'tips.t4.p':    'Los libros Hachette tienen una <strong>banda blanca natural</strong> justo encima de cada celda de color — esa es tu referencia perfecta. En un PDF, haz clic en cualquier zona blanca de la página.',
    'tips.t4.s1':   'Toca el botón de balance de blancos (⚪)',
    'tips.t4.s2':   'Haz clic en la <strong>banda blanca encima</strong> del color que quieres identificar',
    'tips.t4.s3':   'Muestrea el color dibujando un círculo sobre él',

    'tips.t5.h2': '¡Sigue compartiendo tus colorings!',
    'tips.t5.p':  '¿Compartes tus creaciones en redes sociales? <strong>Nos encanta ver vuestros colorings y los códigos de color que usáis</strong> — inspira a toda la comunidad. ¡Sigue etiquetando y compartiendo!',

    'tips.cta.start':   '¡Empecemos →',
    'tips.cta.install': 'Añadir a la pantalla de inicio',
    'tips.cta.ios':     'En iPhone: toca <strong>Compartir</strong> y luego <strong>"En la pantalla de inicio"</strong>',
    'tips.cta.skip':    'Estos consejos son accesibles desde el menú en cualquier momento.',
    'tips.cta.kofi':    '☕ Apoyar el proyecto en Tipeee',

    // ── test.html ──
    'app.back':           '← Volver',
    'app.pack':           '🎨 Pack',
    'app.photo':          '📷 Foto',
    'app.wb':             '⚪ Balance de blancos',
    'app.wb.pending':     '⚠️ Toca la referencia blanca…',
    'app.wb.done':        '✓ Balance aplicado (tocar para cambiar)',
    'app.wb.reset':       '⚪ Balance de blancos',

    'drop.text':          'Abre una foto o PDF de tu tabla de colores',
    'drop.sub':           'Imágenes (jpg, png…) o PDF de colores',
    'drop.tips':          'Consejos para mejores resultados →',

    'sheet.tap':          'Toca un color',
    'sheet.all':          '↑ todos los resultados',
    'sheet.save':         '+ Guardar este resultado',
    'sheet.empty':        'Toca un color para ver los resultados',
    'sheet.kofi':         '☕ Apoyar el proyecto',

    'coll.title':         'Mi colección',
    'coll.close':         '✕ Cerrar',
    'coll.all':           'Todos los colores',
    'coll.custom':        'Mi selección',
    'coll.add.label':     'Añadir una marca',
    'coll.add.marque':    '— Elegir una marca —',
    'coll.add.pack':      '— Elegir un pack —',
    'coll.add.btn':       '+ Añadir a mi colección',
    'coll.nopacks':       '⚠️ No hay packs para esta marca',
    'coll.apply':         '✓ Aplicar',

    'saved.title':        'Búsquedas guardadas',
    'saved.close':        '✕ Cerrar',
    'saved.empty':        'No hay búsquedas guardadas',
    'saved.clear':        '🗑 Vaciar',
    'saved.clear.confirm':'¿Vaciar todas las búsquedas guardadas?',
    'saved.jpeg':         '⬇ JPEG',
    'saved.json':         '⬇ JSON',

    'toast.wb.set':       '✓ Balance de blancos aplicado',
    'toast.wb.reset':     'Balance de blancos restablecido',
    'toast.saved':        '✓ Resultado guardado',
    'toast.nodb':         '⚠️ No hay colores en la base',

    'export.title':       'Révélo — Resultados',
    'export.watermark':   'révélo · generado el ',
    'export.prompt':      'Nombre de archivo (sin extensión):',
    'export.filename':    'pagina',

    'app.wb.auto':        '✓ Balance automática aplicada',
    'match.great':        'Excelente',
    'match.good':         'Cercano',
    'match.ok':           'Lejano',

    'toast.wb.def':       '✓ Balance definido — ajusta con los controles',
    'toast.wb.reset.full':'Foto original restaurada',
    'toast.wb.auto.ok':   '✓ Balance automática — ajusta si es necesario',
    'toast.wb.auto.dark': '⚠️ Foto oscura — ajusta el brillo',
    'toast.wb.auto.no':   'Toca ⚪ en la banda blanca del libro',
    'toast.wb.dark':      '⚠️ Demasiado oscuro — toca la referencia blanca',
    'toast.sample.fail':  '⚠️ Zona inválida — inténtalo de nuevo',
    'toast.clear.done':   'Lista vaciada',
    'toast.export.empty': 'No hay búsquedas para exportar',
    'toast.export.jpeg':  '✓ JPEG exportado',
    'toast.export.json':  '✓ JSON exportado',
    'toast.coll.fail':    '⚠️ No se pudieron cargar las colecciones — recarga la página',
    'toast.colors.fail':  '⚠️ No se pudieron cargar los colores — recarga la página',
    'toast.pdf.fail':     '⚠️ No se pudo leer este PDF',
    'export.chosen':      'elegido',
    'pdf.pages':          ' páginas — elegir una',
  }
};

let currentLang = localStorage.getItem('revelo_lang') || navigator.language?.slice(0, 2) || 'fr';
if (!TRANSLATIONS[currentLang]) currentLang = 'fr';

function t(key) {
  return TRANSLATIONS[currentLang]?.[key] ?? TRANSLATIONS['fr'][key] ?? key;
}

function applyTranslations() {
  document.querySelectorAll('[data-i18n]').forEach(el => {
    el.textContent = t(el.dataset.i18n);
  });
  document.querySelectorAll('[data-i18n-html]').forEach(el => {
    el.innerHTML = t(el.dataset.i18nHtml);
  });
  document.querySelectorAll('[data-i18n-placeholder]').forEach(el => {
    el.placeholder = t(el.dataset.i18nPlaceholder);
  });
  document.documentElement.lang = currentLang;
  document.querySelectorAll('.lang-select').forEach(sel => { sel.value = currentLang; });
}

function setLang(lang) {
  if (!TRANSLATIONS[lang]) return;
  currentLang = lang;
  localStorage.setItem('revelo_lang', lang);
  applyTranslations();
  // Déclencher un event pour que le JS de la page puisse réagir
  window.dispatchEvent(new CustomEvent('langchange', { detail: { lang } }));
}

// Auto-apply au chargement
document.addEventListener('DOMContentLoaded', applyTranslations);