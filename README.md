# Appli-mobile

Jeu de strategie / construction de base sur grille hexagonale, en ligne,
jusqu'a 10 joueurs par partie. Chaque joueur (ou equipe) demarre avec une
mairie sur son ile partagee, construit des batiments (revenu, civil,
production) et fait grossir son or en temps reel pendant la duree du match.

Deux facons de jouer :
- **Solo (sans compte)** : file d'attente classique, chacun a sa propre
  nation, le joueur avec le plus d'or a la fin gagne.
- **En equipe (compte requis)** : ajoute des amis, forme un groupe de 2 ou
  3 joueurs et lancez un empire commun ensemble - or et batiments
  entierement partages, sans adversaire.

## Structure du projet

- `server/` - serveur Node.js (Express + Socket.io) :
  - `match.js` / `hexGrid.js` / `buildings.js` / `matchmaking.js` : grille
    hexagonale, economie, matchmaking solo, logique de partie (chaque
    "nation" peut regrouper un ou plusieurs joueurs qui partagent le meme
    tresor).
  - `db.js` / `auth.js` : comptes persistants (SQLite via `node:sqlite`,
    mots de passe haches avec `crypto.scrypt`).
  - `friends.js` : demandes d'ami, liste d'amis persistante.
  - `party.js` : groupes ephemeres (invitation, 2-3 membres), lancement
    d'une partie en equipe.
- `app/` - application mobile Expo (React Native + TypeScript + Three.js /
  `@react-three/fiber`) : ecran de connexion, lobby (avec panneau
  amis/groupe), ile hexagonale en 3D isometrique, menu de construction,
  minimap, ecran de resultat (adapte au mode equipe).

## Lancer le serveur

```bash
cd server
npm install
npm start        # demarre sur http://localhost:3000
npm test         # tests (grille hex, logique de partie, comptes, amis, groupes)
```

Les donnees des comptes sont stockees dans `server/data/app.db` (SQLite,
cree automatiquement, ignore par git).

## Lancer l'application

```bash
cd app
npm install
npm run web       # tester rapidement dans un navigateur
# ou
npm start          # ouvre Expo (scanner le QR code avec l'app Expo Go)
```

Par defaut, l'application se connecte a `http://localhost:3000`. Pour tester
depuis un vrai telephone (via Expo Go), le serveur doit etre joignable sur le
reseau : definir `EXPO_PUBLIC_SERVER_URL` avec l'adresse IP locale de la
machine qui heberge le serveur :

```bash
EXPO_PUBLIC_SERVER_URL=http://192.168.1.42:3000 npm start
```

## Comment jouer

### Solo

1. Sur l'ecran d'accueil, choisir **Continuer sans compte**, entrer un
   pseudo, puis appuyer sur **QUEUE** dans le lobby.
2. Des qu'au moins 2 joueurs sont en file, une partie demarre (decompte de
   6 secondes) sur une ile hexagonale generee pour l'occasion.
3. Chaque joueur possede une mairie de depart (+100 or/min) et 1000 or.
4. Choisir un batiment dans le **BUILD MENU** (Income / Civilian / Produce)
   puis toucher une case libre de l'ile pour le construire (l'or est deduit
   immediatement).
5. Le match dure 5 minutes. A la fin, le joueur avec le plus d'or remporte
   la partie.

### En equipe (empire commun)

1. Se connecter ou creer un compte sur l'ecran d'accueil.
2. Dans le lobby, ouvrir **Amis**, ajouter un ami par son pseudo exact.
3. Une fois amis, inviter cet ami au groupe (2-3 joueurs). Il doit accepter
   l'invitation depuis son propre panneau Amis.
4. Quand le groupe compte 2 ou 3 membres en ligne, n'importe quel membre
   peut appuyer sur **Lancer l'empire commun** : une partie privee demarre
   immediatement (pas de file d'attente, pas d'adversaire).
5. Tous les membres partagent le meme tresor, le meme revenu et peuvent
   construire n'importe ou sur l'ile commune. A la fin des 5 minutes,
   l'ecran de resultat affiche l'or final de l'empire (pas de
   victoire/defaite, c'est cooperatif).

## Limites connues (MVP)

- Rendu 3D valide en web (Playwright) ; le rendu natif iOS/Android via
  `expo-gl` n'a pas pu etre teste dans cet environnement (pas de simulateur
  disponible) meme si l'API utilisee (`@react-three/fiber` + `expo-gl`) est
  concue pour fonctionner nativement dans Expo Go.
- Camera fixe (pas de zoom/rotation manuelle) sur la vue 3D.
- Pas de regle de territoire/adjacence : un batiment peut etre construit sur
  n'importe quelle case libre de l'ile, pas seulement pres de ses propres
  batiments.
- Comptes : pas de recuperation de mot de passe, pas d'email. Le token de
  session est garde en memoire cote client (pas persiste sur disque) : il
  faut se reconnecter a chaque redemarrage de l'application.
- Groupes (party) geres uniquement en memoire cote serveur (perdus si le
  serveur redemarre), contrairement aux comptes/amis qui sont en base
  SQLite.
- SQLite via `node:sqlite` est une API experimentale de Node.js (>= 22.5).
- Missions / Recompenses / Codes sont des emplacements d'interface non
  fonctionnels ("bientot disponible").
- Le serveur applicatif est en memoire pour tout ce qui touche aux parties
  (un seul processus) : pour un vrai deploiement a grande echelle il
  faudrait un stockage partage (Redis) et plusieurs instances derriere un
  load balancer compatible websockets.
- Le personnage anime du lobby ne joue que son clip "Idle" ; les autres
  animations fournies par le modele (marche, course) ne sont pas encore
  utilisees ailleurs dans l'appli.

## Credits

Le personnage 3D texture et anime du lobby (`app/assets/models/Soldier.glb`)
provient des exemples officiels du projet [three.js](https://github.com/mrdoob/three.js)
(licence MIT), modele originellement issu de [Mixamo](https://www.mixamo.com/)
(Adobe).
