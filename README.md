# Appli-mobile

Jeu de strategie / construction de base sur grille hexagonale, en ligne,
jusqu'a 10 joueurs par partie. Chaque joueur demarre avec une mairie sur son
ile partagee, construit des batiments (revenu, civil, production) et fait
grossir son or en temps reel pendant la duree du match. A la fin, le joueur
avec le plus d'or gagne.

## Structure du projet

- `server/` - serveur Node.js (Express + Socket.io) : matchmaking, grille
  hexagonale, economie (revenu par batiment, tick d'or), validation des
  constructions, diffusion de l'etat de partie en temps reel.
- `app/` - application mobile Expo (React Native + TypeScript + Three.js /
  `@react-three/fiber`) : lobby, file d'attente, ile hexagonale en 3D
  isometrique, menu de construction, minimap, ecran de resultat.

## Lancer le serveur

```bash
cd server
npm install
npm start        # demarre sur http://localhost:3000
npm test         # tests de la grille hexagonale et de la logique de partie
```

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

1. Entrer un pseudo, puis appuyer sur **QUEUE** dans le lobby.
2. Des qu'au moins 2 joueurs sont en file, une partie demarre (decompte de
   6 secondes) sur une ile hexagonale generee pour l'occasion.
3. Chaque joueur possede une mairie de depart (+100 or/min) et 1000 or.
4. Choisir un batiment dans le **BUILD MENU** (Income / Civilian / Produce)
   puis toucher une case libre de l'ile pour le construire (l'or est deduit
   immediatement).
5. Le match dure 5 minutes. A la fin, le joueur avec le plus d'or remporte
   la partie.

## Limites connues (MVP)

- Rendu 3D valide en web (Playwright) ; le rendu natif iOS/Android via
  `expo-gl` n'a pas pu etre teste dans cet environnement (pas de simulateur
  disponible) meme si l'API utilisee (`@react-three/fiber` + `expo-gl`) est
  concue pour fonctionner nativement dans Expo Go.
- Camera fixe (pas de zoom/rotation manuelle) sur la vue 3D.
- Pas de regle de territoire/adjacence : un batiment peut etre construit sur
  n'importe quelle case libre de l'ile, pas seulement pres de ses propres
  batiments.
- Pas de comptes/authentification, pas de mode ranked fonctionnel (seul le
  mode "casual" existe), pas de persistance des statistiques entre sessions
  (elles vivent en memoire le temps de la session app).
- Missions / Recompenses / Codes sont des emplacements d'interface non
  fonctionnels ("bientot disponible").
- Le serveur est en memoire (un seul processus) : pour un vrai deploiement a
  grande echelle il faudrait un stockage partage (Redis) et plusieurs
  instances derriere un load balancer compatible websockets.
- Le personnage anime du lobby ne joue que son clip "Idle" ; les autres
  animations fournies par le modele (marche, course) ne sont pas encore
  utilisees ailleurs dans l'appli.

## Credits

Le personnage 3D texture et anime du lobby (`app/assets/models/Soldier.glb`)
provient des exemples officiels du projet [three.js](https://github.com/mrdoob/three.js)
(licence MIT), modele originellement issu de [Mixamo](https://www.mixamo.com/)
(Adobe).
