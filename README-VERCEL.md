# TGV Livraison · Guide de Déploiement Vercel & Google Sheets

Bienvenue dans l'application PWA de **TGV Livraison** (Cotonou, Bénin) !
Ce document détaille le workflow complet de l'application et les étapes pour la mettre en ligne sur Vercel.

---

## 🌟 Le Workflow Complet de l'Application

### 1. Côté Client (PWA Réactive)
1. **Écran d'accueil dynamique (Splash Screen)** :
   - Présentation de la marque TGV Livraison avec le motard en mouvement et le slogan : *« Livré à temps, reçu avec le sourire »*.
2. **Étape 1 : Choix du Service** :
   - *Colis & e-commerce* (Remise en main propre)
   - *Repas & Nourriture* (Sac isotherme chaud/froid)
   - *Documents & plis* (Pochette scellée sécurisée)
   - *Courses marché* (Dantokpa & vivres)
3. **Étape 2 : Lieux & Position GPS** :
   - Sélection du départ et de la destination avec auto-complétion intelligente sur les 4 communes :
     - **Cotonou** (Dantokpa, Ganhi, Akpakpa, Cadjehoun, Haie Vive, Fidjrossè, Agla, etc.)
     - **Abomey-Calavi** (Godomey, Calavi Kpota, Arconville, Zogbadjè/UAC, etc.)
     - **Sémè-Podji** (Sémè Centre, Okoun-Sèmè, Kraké, Ekpè, Togbin Plage)
     - **Porto-Novo** (Ouando, Tokpota, Djassin, Avakpa, Attakè, etc.)
   - Bouton GPS en 1 clic : capture les coordonnées et génère un lien Google Maps pour le motard.
   - Calcul automatique du tarif (1 000 FCFA pour la même commune ou communes adjacentes, 1 500 FCFA pour Cotonou/Calavi <-> Porto-Novo).
4. **Étape 3 : Précisions & Urgence** :
   - Indication d'un repère précis (nom de rue, pharmacie, portail, numéro du destinataire).
   - Niveau d'urgence : *Standard* ou *Urgent Express*.
5. **Étape 4 : Validation & Double Envoi** :
   - Génération d'une référence unique sécurisée : `TGV-YYMMDD-XXXX`.
   - Choix du mode de paiement : *Espèces au coursier (à la livraison)* ou *Mobile Money* (MTN MoMo / Moov Money), ce dernier sélectionné par défaut.
   - **Envoi WhatsApp instantané** : Ouvre WhatsApp pré-rempli vers la ligne officielle dispatch (`+229 01 42 01 69 86`).
   - **Envoi silencieux vers `/api/order`** : Sauvegarde la commande dans Google Sheets via la fonction Vercel.
   - **Gestion hors-ligne (PWA)** : si la connexion Internet coupe, la commande est mise en file d'attente (`localStorage`, clé `tgv_offline_queue`) et automatiquement renvoyée dès le retour du réseau. Un encart sur l'écran de confirmation précise que la commande est enregistrée hors-ligne, et la bannière affiche le nombre de commandes en attente (`pendingCount`).
   - **Historique local** : Le client peut revoir ses commandes passées et les renouveler en un clic.

---

## 🚀 Déploiement sur Vercel (En 3 Étapes)

### Étape 1 : Configurer Google Sheets (Apps Script)
1. Ouvrez un classeur Google Sheets vide.
2. Allez dans **Extensions > Apps Script**.
3. Remplacez le code par celui présent dans `apps-script/Code.gs`.
4. Enregistrez le token dans les **propriétés du script** — plus aucun secret ne doit se trouver dans le code :
   - Dans l'éditeur, choisissez la fonction `configurerToken` dans la liste déroulante en haut, cliquez sur **Exécuter**, saisissez votre clé secrète (20 caractères minimum) puis autorisez l'accès demandé.
   - Équivalent manuel : **Paramètres du projet > Propriétés du script > Ajouter une propriété**, nom `SHEET_TOKEN`, valeur = votre clé secrète.
   - La **même valeur** devra être saisie dans la variable `SHEET_TOKEN` sur Vercel (Étape 3).
5. Cliquez sur **Déployer > Nouveau déploiement** :
   - Type : **Application Web**
   - Exécuter en tant que : **Moi**
   - Qui a accès : **Tout le monde** (Anyone)
6. Cliquez sur Déployer, accordez les autorisations Google, puis copiez l'URL de l'application Web qui se termine par `/exec`.
7. Vérifiez le déploiement en ouvrant cette URL `/exec` dans un navigateur : vous devez obtenir
   `{"ok":true,"version":"1.2.0","token":"configure",...}`. Si vous lisez `"token":"absent"`, la propriété `SHEET_TOKEN` n'a pas été enregistrée.
8. Test facultatif : exécutez la fonction `testEnregistrement` dans l'éditeur pour injecter une ligne de test (Réf. `TGV-000000-TEST`) et vérifier que les 17 colonnes se remplissent correctement.

**Colonnes de l'onglet « Commandes »** (créées automatiquement, ordre garanti sans décalage) :

`Date et heure · Réf. · Statut · Service · Départ · Commune départ · Destination · Commune destination · Priorité · Tarif (FCFA) · Note · Position GPS · Téléphone client · Distance (km) · Destinataire · Téléphone destinataire · Paiement`

Les 13 premières colonnes sont inchangées : une feuille déjà en production est simplement complétée sur la droite, l'historique n'est jamais décalé. Le statut se pilote par la liste déroulante (`Nouvelle`, `En cours`, `Livrée`, `Annulée`).

### Étape 2 : Pousser sur GitHub et importer sur Vercel
1. Initialisez votre dépôt Git et poussez le code sur GitHub :
   ```bash
   git init
   git add .
   git commit -m "Initial commit - TGV Livraison PWA"
   git remote add origin https://github.com/votre-compte/tgv-livraison.git
   git push -u origin main
   ```
2. Rendez-vous sur [vercel.com](https://vercel.com) et cliquez sur **Add New Project**.
3. Sélectionnez votre dépôt GitHub `tgv-livraison`.
4. Vercel détecte automatiquement le framework **Vite** avec le dossier de sortie `dist`.

### Étape 3 : Ajouter les variables d'environnement sur Vercel
Dans les paramètres du projet Vercel (**Settings > Environment Variables**), ajoutez les 2 variables suivantes, pour les environnements **Production ET Preview** :
- `SHEET_WEBHOOK_URL` = L'URL de votre Google Apps Script (`https://script.google.com/macros/s/.../exec`)
- `SHEET_TOKEN` = Exactement la même clé secrète que la propriété `SHEET_TOKEN` du script Apps Script (Étape 1). Si les deux valeurs diffèrent, l'API renvoie `502` et la commande n'est jamais écrite dans la feuille.

**Rotation du token** : le token ne doit jamais être commité (ni dans `.env`, ni dans `Code.gs`). Pour le changer : exécutez à nouveau `configurerToken('<nouvelle-valeur>')`, mettez à jour `SHEET_TOKEN` sur Vercel, redéployez l'application Web Apps Script, puis reportez la **nouvelle** URL `/exec` dans `SHEET_WEBHOOK_URL` (chaque nouveau déploiement génère une URL différente).

**Mise à jour du code sans changer d'URL** : dans **Déployer > Gérer les déploiements**, cliquez sur le crayon du déploiement actif, choisissez **Version : Nouvelle version**, puis **Déployer**. L'URL `/exec` reste identique et rien n'est à modifier côté Vercel.

- `SHEET_CSV_URL` (optionnel) = l'export CSV public de l'onglet des tarifs. S'il est renseigné, les prix
  sont retéléchargés **à chaque déploiement** ; s'il est absent ou en erreur, le fichier versionné
  `scripts/parsed-routes.json` est utilisé et le build n'échoue jamais.

Cliquez sur **Deploy** (ou **Redeploy**). Votre PWA TGV Livraison est en ligne !

---

## 💰 Grille tarifaire : deux niveaux de fraîcheur

### 1. Au build (prix à jour à chaque déploiement)
`npm run build` déclenche automatiquement `npm run prebuild`, qui exécute `scripts/sync-sheet.cjs` :

1. télécharge l'export CSV public (`SHEET_CSV_URL`) ;
2. le valide (au moins 500 trajets, 40 lieux, moins de 10 % de lignes illisibles — sinon abandon) ;
3. réécrit `scripts/parsed-routes.json` puis régénère `src/data/routesMatrix.json` (**1 entrée = 1 ligne du CSV**, soit 843 liaisons : aucune paire ajoutée, aucune distance ni aucun tarif extrapolé) et `src/data/sheetQuartiers.json` (les 52 quartiers du document, tels qu'écrits).

En cas de panne réseau, de CSV tronqué ou de variable absente, la grille du dépôt est conservée :
**le build ne casse jamais** à cause du Sheet. Contrôle local : `npm run sync-sheet`, puis `npm run test:routes`.

### 2. En direct (prix modifiés sans redéployer)
- `apps-script/Code.gs` expose `action: 'routes'` : lecture de l'onglet tarifaire (auto-détecté via les en-têtes « Départ » / « Arrivée », ou forcé par la propriété de script `ONGLET_TARIFS`), avec cache de 10 minutes.
- `api/routes.js` (fonction Vercel) relaie cette grille et la met en cache CDN 30 minutes (`s-maxage=1800`).
- L'application appelle `/api/routes` au démarrage (`src/data/routesLive.ts`), mémorise le résultat 6 h dans `localStorage` et **retombe toujours** sur la matrice embarquée en cas d'échec.

Conséquence : modifier un tarif dans Google Sheets se reflète en quelques minutes sans redéploiement, et l'application reste factuelle hors-ligne.

### 3. Grille stricte : le client ne peut choisir qu'une liaison du CSV

- **La liste des quartiers vient du CSV** : `src/data/communes.ts` ne contient plus de liste saisie à la main, elle est construite depuis `sheetQuartiers.json` (généré). Un quartier absent du document n'est donc pas sélectionnable, et les libellés affichés sont exactement ceux du CSV (`Fidjrossè`, `Jéricho / Marocana`, `Étoile Rouge`…).
- **L'étape 2 ne propose que les destinations desservies** : dès qu'un départ est choisi, la liste des arrivées est celle des quartiers reliés par le CSV, triée de la plus proche à la plus lointaine, avec la distance et le tarif affichés **avant** le clic. Plus de saisie libre, plus de prix estimé.
- **Aucun tarif inventé** : une paire absente du CSV renvoie `distance 0 / tarif 0 / isExactSheetRoute = false`. L'interface affiche alors « À confirmer » (jamais `0 FCFA`) et la régulation valide le prix ; la paire est journalisée côté navigateur et dans les logs Vercel (`tarifEstime`).
- Chiffres de contrôle donnés par `npm run test:routes` : **843 lignes CSV · 843 liaisons · 52 quartiers · 1 686 paires desservies (les 2 sens) · 1 018 paires non desservies → tarif 0 · 18 à 51 destinations par quartier (moyenne 32,4)**.

### 4. Expérience de sélection (étape 2)

1. **Vos derniers trajets** : jusqu'à 3 raccourcis issus de l'historique local remplissent départ et arrivée en un seul tap (uniquement si la liaison existe toujours dans la grille).
2. **Départ** : recherche insensible aux accents + filtres par commune (`Cotonou`, `Abomey-Calavi`, `Porto-Novo`, `Ouidah`), listes groupées par commune avec compteurs. Les communes sans quartier (Sémè-Podji) ne sont jamais affichées.
3. **Destination** : le panneau s'ouvre automatiquement après le départ et n'affiche que les quartiers reliés, avec un badge « Le plus proche » sur la première proposition, la distance et le tarif sur chaque ligne.
4. **Récapitulatif** : trajet, distance officielle, tarif officiel et indicateur « à jour » quand la valeur vient de la grille live.
5. **Inversion** : un bouton inverse départ/arrivée — la grille étant symétrique, le retour suit le même tarif.

---

## 📱 Installation de la PWA sur Mobile
- **Android (Chrome)** : Cliquez sur le bouton « Installer » affiché dans l'application ou dans le menu de Chrome (trois points) > « Installer l'application ».
- **iPhone / iPad (Safari)** : Cliquez sur l'icône de partage (carré avec flèche vers le haut) puis sélectionnez « Sur l'écran d'accueil ».
