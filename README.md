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

1. Dans l'éditeur Godot : Editor > Manage Export Templates, installer les
   templates 3.5.
2. Installer le SDK Android + configurer le chemin dans
   Editor > Editor Settings > Export > Android.
3. Project > Export, ajouter un preset "Android", exporter l'APK.

(Cette étape doit être faite depuis un poste avec l'éditeur Godot -
elle n'est pas réalisable depuis cet environnement sans interface
graphique.)

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

Sur mobile, les mêmes actions sont disponibles via le joystick, la zone
de glissement et les boutons à l'écran.

## Structure du projet

```
autoload/            Inventory.gd, GameManager.gd (etat global)
scenes/
  Main.tscn/.gd       Point d'entree, assemble World + Player + HUD
  player/             Controleur FPS (deplacement, recolte, construction)
  world/              Monde, arbres/rochers/minerai, caisses de butin
  building/           Systeme de construction (fondation, mur, porte)
  ui/                 HUD, joystick tactile, zone de visee tactile
```

## Roadmap suggérée

1. **V1 - solo (fait)** : monde ouvert, récolte, construction, loot.
2. **V2 - multijoueur** : serveur relais (Godot High-Level Multiplayer
   ou WebSocket), synchronisation des joueurs et des bases.
3. **V3 - alliances/clans** : système de groupe, permissions de
   construction partagées, chat.
4. **V4 - PvP et survie** : armes à distance, faune, dégâts de raid sur
   les bases, cycle jour/nuit.
