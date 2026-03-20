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
- Base de données : MariaDB
- Auth : express-session + bcrypt
- Frontend : HTML/CSS/JS vanilla — pas de framework
- Couleurs : chroma.js (deltaE LAB pour distance perceptuelle)
- Commentaires : français — variables/fonctions : anglais

## Structure des fichiers
```
/projet
  /public
    /css
    /js
    sampler.html   ← prototype sampling déjà fonctionnel
  /views
    login.html
    dashboard.html
    couleurs.html
    couleur-form.html
  /routes
    auth.js
    couleurs.js
    packs.js
  /middleware
    auth.js        ← vérifie session
  db.js            ← connexion MariaDB
  app.js           ← point d'entrée
  package.json
```

## Base de données
```sql
CREATE TABLE marques (
  id   INT PRIMARY KEY AUTO_INCREMENT,
  nom  VARCHAR(50),
  slug VARCHAR(50)
);

CREATE TABLE pointes (
  id          INT PRIMARY KEY AUTO_INCREMENT,
  nom         VARCHAR(50),
  description VARCHAR(100)
);

CREATE TABLE packs (
  id           INT PRIMARY KEY AUTO_INCREMENT,
  marque_id    INT,
  nom          VARCHAR(100),
  nb_couleurs  INT,
  lien_temu    VARCHAR(255),
  lien_amazon  VARCHAR(255),
  prix_approx  DECIMAL(6,2),
  FOREIGN KEY (marque_id) REFERENCES marques(id)
);

CREATE TABLE couleurs (
  id          INT PRIMARY KEY AUTO_INCREMENT,
  marque_id   INT,
  reference   VARCHAR(20),
  hex         CHAR(7),
  r           TINYINT UNSIGNED,
  g           TINYINT UNSIGNED,
  b           TINYINT UNSIGNED,
  pointe_id   INT,
  pack_min_id INT,
  created_at  TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at  TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
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
  id         INT PRIMARY KEY AUTO_INCREMENT,
  username   VARCHAR(50),
  password   VARCHAR(255),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

## Algorithme de sampling des couleurs
Logique validée, prototype disponible dans /public/sampler.html.
À intégrer dans le formulaire back office couleur-form.html.

Étapes :
1. Upload scan ou photo du nuancier
2. Balance des blancs : l'utilisateur clique sur une zone blanche →
   wbR = 255/avgR, wbG = 255/avgG, wbB = 255/avgB
   (moyenne sur une zone 28x28px autour du clic)
3. L'utilisateur dessine un rectangle sur le cercle de couleur
4. Exclusion des pixels aberrants :
    - brightness < 25 → ombre/bord
    - brightness > 215 → reflet/surexposition
5. Division de la zone valide en 4 quadrants
6. Pixel médian de chaque quadrant
7. Moyenne des 4 échantillons après correction WB → hex final + R + G + B
8. Les valeurs se remplissent automatiquement dans le formulaire → INSERT en base

## Pages back office
- GET  /login              → formulaire auth
- POST /login              → vérification session
- GET  /dashboard          → stats (nb couleurs, marques, packs)
- GET  /couleurs           → liste filtrée par marque/référence
- GET  /couleurs/new       → formulaire + module sampling intégré
- POST /couleurs           → INSERT couleur
- GET  /couleurs/:id/edit  → formulaire prérempli
- POST /couleurs/:id       → UPDATE couleur
- POST /couleurs/:id/delete→ DELETE couleur
- GET  /packs              → CRUD packs
- GET  /test               → page de test reconnaissance couleurs

## Page de test reconnaissance
Permet de valider l'algorithme avant de saisir les 648 couleurs :
- Upload d'une photo de légende de livre sous différents éclairages
- Détection automatique des cases colorées
- Balance des blancs automatique ou manuelle
- Pour chaque case → SELECT * FROM couleurs, calcul deltaE chroma.js
- Affichage : couleur détectée vs meilleurs matchs en base
- Objectif : valider la fiabilité avant saisie complète

## Plan de développement (cocher au fur et à mesure)
- [ ] 1. DB MariaDB + connexion Node (db.js)
- [ ] 2. Auth login (express-session + bcrypt)
- [ ] 3. CRUD couleurs saisie manuelle
- [ ] 4. Intégration module sampling dans couleur-form.html
- [ ] 5. Page test reconnaissance
- [ ] 6. Validation avec photos sous différents éclairages
- [ ] 7. Si validation OK → saisie des 648 couleurs (Guangna 360 + Languo 288)
- [ ] 8. Développement app publique côté utilisateur

## App publique (phase 2 — pas encore démarrée)
- Upload photo de légende de livre
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