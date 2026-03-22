# Nuancier App — Contexte projet

## Objectif
Web app pour aider les passionnés de coloriage mystère (livres Hachette)
à trouver les feutres de leur collection qui correspondent aux couleurs
d'une légende de livre.

## Marques supportées
- Guangna (360 couleurs) — références numériques ex: 601, 749
- Languo (288 couleurs) — références alphanumériques ex: BL-208, HC-604

## Stack technique
- Backend : Node.js + Express
- Base de données : **PostgreSQL** (migré depuis MariaDB)
- Auth : express-session + bcrypt
- Frontend : HTML/CSS/JS vanilla — pas de framework
- Couleurs : chroma.js (deltaE LAB pour distance perceptuelle)
- PDF : PDF.js (CDN) pour charger les PDFs de référence couleurs
- Commentaires : français — variables/fonctions : anglais

## Environnement de développement
- **ddev** avec PostgreSQL 16 (port local : 33772)
- App Node lancée séparément avec `npm run dev` (port 3000)
- **Ne pas utiliser** `ddev exec node` — Node tourne hors ddev
- Export DB : `ddev exec pg_dump -U db -h db db --clean --if-exists --no-owner --no-privileges > nuancier.sql`
- Import DB local : `ddev exec psql -U db -d db < nuancier.sql`

## Déploiement (Railway)
- App Node.js auto-déployée depuis GitHub (branche main)
- PostgreSQL Railway : `centerbeam.proxy.rlwy.net:47079` / db `railway`
- Import DB vers prod : `ddev exec psql "<DATABASE_PUBLIC_URL>" < nuancier.sql`
  (le dump généré avec `--clean --if-exists --no-owner` est directement compatible, pas besoin de TRUNCATE préalable)
- Variables d'env Railway (sans guillemets) :
  ```
  DB_HOST     = ${{Postgres.PGHOST}}
  DB_PORT     = ${{Postgres.PGPORT}}
  DB_NAME     = ${{Postgres.PGDATABASE}}
  DB_USER     = ${{Postgres.PGUSER}}
  DB_PASS     = ${{Postgres.PGPASSWORD}}
  NODE_ENV    = production
  SESSION_SECRET = <chaine aléatoire 32 bytes>
  ```
- URL prod : https://nuanciercolo-production.up.railway.app
- Serverless activé sur les deux services pour économiser les heures

## Structure des fichiers
```
/projet
  /public
    /css
    /js
      sampler-core.js   ← WB + sampling partagé (test.html + couleur-form)
      sampling.js       ← module sampling intégré au formulaire BO
      couleur-form.js   ← synchro color picker ↔ hex ↔ RGB
      chroma.min.js
    sw.js               ← service worker (cache v6 — assets statiques uniquement, pages HTML non cachées)
  /views
    login.html
    dashboard.html
    tips.html           ← page de conseils avant /test
    test.html           ← page de test reconnaissance couleurs
  /routes
    auth.js
    couleurs.js         ← CRUD couleurs + renderForm inline + édition en masse (/couleurs/bulk)
    marques.js
    packs.js
    test.js             ← /tips, /test, /api/couleurs/all
  /scripts
    schema.sql          ← schéma PostgreSQL complet
    create-admin.mjs    ← crée l'utilisateur admin
  /middleware
    auth.js             ← vérifie session
  db.js                 ← connexion PostgreSQL (driver pg)
  app.js                ← point d'entrée
  package.json
```

## Base de données (PostgreSQL)
```sql
CREATE TABLE marques (
  id   SERIAL PRIMARY KEY,
  nom  VARCHAR(50),
  slug VARCHAR(50)
);

CREATE TABLE pointes (
  id          SERIAL PRIMARY KEY,
  nom         VARCHAR(50),
  description VARCHAR(100)
);
-- Pointes en base : Bille, Brush, Amorçable

CREATE TABLE packs (
  id           SERIAL PRIMARY KEY,
  marque_id    INT,
  nom          VARCHAR(100),
  nb_couleurs  INT,
  lien_temu    VARCHAR(255),
  lien_amazon  VARCHAR(255),
  prix_approx  DECIMAL(6,2),
  FOREIGN KEY (marque_id) REFERENCES marques(id)
);

CREATE TABLE couleurs (
  id          SERIAL PRIMARY KEY,
  marque_id   INT,
  reference   VARCHAR(20),
  hex         CHAR(7),
  r           SMALLINT,
  g           SMALLINT,
  b           SMALLINT,
  hex_photo   CHAR(7),        -- référence photo (éclairage standardisé)
  r_photo     SMALLINT,
  g_photo     SMALLINT,
  b_photo     SMALLINT,
  medium      VARCHAR(20) NOT NULL DEFAULT 'acrylique',  -- 'acrylique' ou 'gel'
  pointe_id   INT,
  pack_min_id INT,
  created_at  TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at  TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (marque_id)   REFERENCES marques(id),
  FOREIGN KEY (pointe_id)   REFERENCES pointes(id),
  FOREIGN KEY (pack_min_id) REFERENCES packs(id)
);

CREATE TABLE pack_couleurs (
  pack_id    INT,
  couleur_id INT,
  PRIMARY KEY (pack_id, couleur_id),
  FOREIGN KEY (pack_id)    REFERENCES packs(id),
  FOREIGN KEY (couleur_id) REFERENCES couleurs(id)
);

CREATE TABLE users (
  id         SERIAL PRIMARY KEY,
  username   VARCHAR(50),
  password   VARCHAR(255),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

## Double référence couleur (scanner + photo)
Chaque couleur peut avoir deux références RGB :
- **hex/r/g/b** : valeur scanner (référence principale, la plus fiable)
- **hex_photo/r_photo/g_photo/b_photo** : valeur photo sous éclairage standardisé
  (nuit, lampe de bureau fixe, support téléphone fixe, feuille blanche à côté)

Algorithme de matching : `score = min(deltaE_scanner, deltaE_photo)`
→ prend la meilleure correspondance des deux. Si pas de référence photo, `dPhoto = Infinity`.

**Décisions issues de l'analyse des 28 premières couleurs :**
- Le scanner est suffisant pour la saisie en masse — pas besoin d'encoder les références photo pour toutes les couleurs
- La lampe introduit une dominante chaude qui décale les bleus/violets (ex: 608 #235ab8 → #796baa en photo)
- Exception : couleurs très claires écrasées à #ffffff par le scanner → les saisir manuellement à l'œil ou via référence photo
- À faire plus tard : alerte dans le formulaire si hex trop proche du blanc (r>240 && g>240 && b>240) avec suggestion de préférer la référence photo

## Algorithme de sampling
**Correction balance des blancs 1-point** : `raw * 255 / white` par canal
(pas de correction noir — détruirait les canaux faibles des jaunes/oranges)

Workflow recommandé pour les photos de livres Hachette :
1. Utiliser la bande blanche naturelle au-dessus de chaque case pour la WB
2. Recalibrer la WB pour chaque couleur (luminosité non uniforme)
3. Les PDFs de référence (ex: Jeremy Mariez) donnent de meilleurs résultats que les photos
   → http://jeremymariez.free.fr/npainter.htm

## Pages back office
- GET  /login              → formulaire auth
- POST /login              → vérification session
- GET  /dashboard          → stats
- GET  /couleurs           → liste filtrée par marque/référence
- GET  /couleurs/new       → formulaire + module sampling intégré
- POST /couleurs           → INSERT couleur
- POST /api/couleurs       → INSERT couleur (JSON, ajout multiple sans redirect)
- GET  /couleurs/:id/edit  → formulaire prérempli
- POST /couleurs/:id       → UPDATE couleur
- POST /couleurs/:id/delete→ DELETE couleur
- GET  /couleurs/bulk      → édition en masse (pointe + pack minimum sur sélection multiple)
- POST /api/couleurs/bulk  → UPDATE masse (JSON : ids[], pointe_id, pack_min_id)
- GET  /packs              → CRUD packs
- GET  /marques            → CRUD marques
- GET  /tips               → page de conseils
- GET  /test               → page de test reconnaissance couleurs

## Plan de développement
- [x] 1. DB PostgreSQL + connexion Node (db.js)
- [x] 2. Auth login (express-session + bcrypt)
- [x] 3. CRUD couleurs saisie manuelle + sampling intégré
- [x] 4. Module sampling dans couleur-form (WB + cercle + quadrants)
- [x] 5. Page test reconnaissance (/test) avec PDF, WB auto/manuelle, matching deltaE
- [x] 6. Déploiement Railway (prod) + export/import DB
- [x] 7. Analyse double référence scanner/photo sur 28 couleurs → scanner suffisant pour la saisie en masse
- [~] 8. Saisie des références photo → abandonnée pour la saisie en masse (scanner seul suffit, voir section double référence)
- [~] 9. Saisie des couleurs Guangna : **208/360 encodées (600–807)** — Languo 288 à faire
- [ ] 10. Crash test algo de matching sur légende de livre réelle
- [ ] 11. Développement app publique côté utilisateur

## App publique (phase 2 — pas encore démarrée)
- Upload photo de légende de livre (ou PDF)
- Détection cases colorées + balance des blancs
- Filtre par collection utilisateur (marque + boîtes possédées)
- Pour chaque case :
    - Meilleur match dans la collection avec % similarité
    - Si pas de match satisfaisant → feutre exact + plus petit pack disponible
    - Liens affiliés Temu + Amazon
- Disclaimer : "Ces suggestions sont un point de départ, fais confiance à ton œil !"

## Modèle économique
- Open source
- Dons Ko-fi
- Liens affiliés Amazon Associates + Temu Affiliate (pas d'exclusivité entre les deux)
- Pas de publicité
- Mention légale : app indépendante, non affiliée à Guangna ou Languo

## Points légaux
- Images des livres jamais stockées — analyse locale dans le navigateur uniquement
- Liens affiliés mentionnés clairement dans l'interface
- Pas de reproduction des visuels produit des marques
