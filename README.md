# Appli-mobile

Jeux mobile raph

Jeu de combat 1 vs 1 en ligne, jusqu'a 8 joueurs connectes simultanement.
Deux joueurs sont mis en relation automatiquement (matchmaking), puis
s'affrontent en temps reel : deplacement, coup de poing, coup de pied,
blocage, barres de vie et minuteur de round.

## Structure du projet

- `server/` - serveur Node.js (Express + Socket.io) : matchmaking, simulation
  autoritative des combats (positions, degats, KO), diffusion de l'etat en
  temps reel.
- `app/` - application mobile Expo (React Native + TypeScript) : ecrans
  pseudo / file d'attente / combat / resultat, connectee au serveur via
  socket.io-client.

## Lancer le serveur

```bash
cd server
npm install
npm start        # demarre sur http://localhost:3000
npm test         # lance les tests de la logique de combat
```

## Lancer l'application

```bash
cd app
npm install
npm run web       # tester rapidement dans un navigateur
# ou
npm start         # ouvre Expo (scanner le QR code avec l'app Expo Go)
```

Par defaut, l'application se connecte a `http://localhost:3000`. Pour tester
depuis un vrai telephone (via Expo Go) ou un simulateur, le serveur doit etre
joignable sur le reseau : definir la variable d'environnement
`EXPO_PUBLIC_SERVER_URL` avec l'adresse IP locale de la machine qui heberge le
serveur, par exemple :

```bash
EXPO_PUBLIC_SERVER_URL=http://192.168.1.42:3000 npm start
```

## Limites connues (MVP)

- Pas de comptes/authentification : le pseudo est libre a chaque partie.
- Pas de persistance : les parties et le classement ne sont pas sauvegardes.
- Le serveur est en memoire (un seul processus) : pour un vrai deploiement en
  production avec plus de 8 joueurs ou de la scalabilite, il faudrait un
  stockage partage (Redis) et plusieurs instances derriere un load balancer
  compatible websockets (sticky sessions).
