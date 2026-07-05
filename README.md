# Rustline

Prototype de jeu mobile de survie en monde ouvert, vue à la première
personne, inspiré de **Rust** : récolte de ressources, construction de
base et pillage de caisses. Construit avec **Godot 3.5** (GDScript).

## Etat actuel (V1 - solo)

Ce qui est jouable aujourd'hui :

- Contrôleur FPS (déplacement, saut, sprint avec endurance, visée souris/tactile)
- Récolte de ressources : arbres (bois), rochers (pierre), gisements de
  minerai (métal) - viser et taper avec l'outil équipé
- Caisses de butin ("colliers"/loot) dispersées sur la carte et dans un
  petit point d'intérêt (ruines) près du spawn
- Construction de base : fondation, mur, porte (avec porte fonctionnelle
  qui s'ouvre/se ferme), placement en fantôme avec accroche à la grille
  et vérification du coût en ressources
- HUD complet : vie, endurance, inventaire, prompt d'interaction, panneau
  de construction
- Contrôles tactiles pour mobile : joystick virtuel (déplacement), zone
  de glissement (visée caméra), boutons d'action (sauter, sprint,
  récolter/placer, interagir, construire) - en plus du clavier/souris
  pour tester depuis l'éditeur Godot
- Monde divisé en 3 biomes (désert, plaine, neige) avec ressources et
  décors adaptés (arbres/rochers reskinnés, cactus décoratifs)
- Deux lieux abandonnés : un immeuble en ruine (désert) et une gare
  abandonnée avec un wagon rouillé (neige), tous deux lootables
- Carte complète en haut à droite du HUD (biomes, points d'intérêt,
  position/orientation du joueur)
- Panneau d'inventaire dédié (touche I ou bouton "Sac") avec un slot par
  ressource, en plus du compteur rapide déjà affiché en haut à droite
- Environnement amélioré : SSAO, glow, tonemapping filmique, feuillage
  des arbres en grappe (plus organique qu'un simple cône), légère
  variation de teinte par instance pour casser l'effet copier-coller

Pas encore implémenté (prochaines étapes) : multijoueur/réseau,
alliances et clans, PvP, faune/IA, sauvegarde de partie.

## Pourquoi Godot 3.5 ?

Ce projet est développé sans éditeur graphique (environnement CLI). Les
scènes Godot sont des fichiers texte (`.tscn`/`.gd`), donc tout le
projet peut être écrit et versionné comme du code classique. Godot 3.5
est disponible en paquet headless (`godot3-server`) dans cet
environnement, ce qui a permis de valider le projet (`--check-only`,
exécution headless avec driver vidéo `Dummy`) sans écran.

## Ouvrir le projet

1. Installer [Godot 3.5](https://godotengine.org/download/archive/) (pas Godot 4 - l'API a changé).
2. Lancer Godot, "Import", sélectionner le fichier `project.godot` à la racine.
3. Lancer la scène principale (`scenes/Main.tscn`) avec F5/F6.

## Exporter en APK Android

Un preset "Android" est déjà préparé dans `export_presets.cfg` (package
`com.rustline.game`). Il reste à faire depuis un poste avec l'éditeur
Godot (pas réalisable depuis cet environnement sans interface graphique) :

1. Dans l'éditeur Godot : Editor > Manage Export Templates, installer les
   templates 3.5.
2. Installer le SDK Android + configurer le chemin dans
   Editor > Editor Settings > Export > Android.
3. Project > Export : le preset "Android" existe déjà, cliquer sur
   "Export Project" (il te demandera un keystore de debug la première
   fois - Godot peut en générer un automatiquement).

## Exporter en IPA iOS (nécessite un Mac)

Contrainte incontournable : Xcode ne tourne que sur macOS, donc cette
étape doit être faite entièrement sur un Mac. Un preset "iOS" est déjà
préparé dans `export_presets.cfg` (bundle id `com.rustline.game`,
architecture arm64) ; il reste à renseigner les infos liées à ton compte
Apple :

1. Installer Godot 3.5 sur le Mac, ouvrir ce projet.
2. Installer Xcode depuis l'App Store (peut prendre du temps la
   première fois).
3. Dans l'éditeur Godot : Editor > Manage Export Templates, installer
   les templates 3.5 (téléchargement direct depuis le Mac, donc pas
   soumis aux restrictions réseau qu'on a dans cet environnement cloud).
4. Ouvrir Xcode > Settings > Accounts, connecter ton Apple ID (compte
   gratuit suffit pour tester sur ton propre iPhone).
5. Project > Export dans Godot : sélectionner le preset "iOS", renseigner
   `application/app_store_team_id` (visible dans Xcode > Accounts, ou
   dans ton compte developer.apple.com) et laisser Godot générer le
   projet Xcode.
6. Ouvrir le `.xcodeproj` généré dans Xcode, brancher l'iPhone en USB,
   choisir ton appareil comme cible, et lancer (bouton Play). Avec un
   compte gratuit, l'app installée expire au bout de 7 jours et doit
   être réinstallée depuis Xcode ; avec un compte développeur payant
   (99$/an) tu peux distribuer via TestFlight sans cette limite.

## Contrôles (test clavier/souris dans l'éditeur)

| Action | Touche |
|---|---|
| Se déplacer | Z/Q/S/D (WASD) |
| Sauter | Espace |
| Sprint | Shift |
| Regarder | Souris |
| Récolter / Placer une pièce | Clic gauche |
| Interagir (ouvrir caisse/porte) | E |
| Mode construction | B |
| Pièce suivante | Tab |
| Rotation de la pièce | R |
| Ouvrir/fermer l'inventaire | I |

Sur mobile, les mêmes actions sont disponibles via le joystick, la zone
de glissement et les boutons à l'écran.

## Structure du projet

```
autoload/            Inventory.gd, GameManager.gd (etat global)
scenes/
  Main.tscn/.gd       Point d'entree, assemble World + Player + HUD
  player/             Controleur FPS (deplacement, recolte, construction)
  world/              Monde, biomes (WorldMap.gd), ressources, POI abandonnes
  building/           Systeme de construction (fondation, mur, porte)
  ui/                 HUD, minimap, inventaire, joystick/visee tactiles
```

## Roadmap suggérée

1. **V1 - solo (fait)** : monde ouvert, récolte, construction, loot.
2. **V2 - multijoueur** : serveur relais (Godot High-Level Multiplayer
   ou WebSocket), synchronisation des joueurs et des bases.
3. **V3 - alliances/clans** : système de groupe, permissions de
   construction partagées, chat.
4. **V4 - PvP et survie** : armes à distance, faune, dégâts de raid sur
   les bases, cycle jour/nuit.
