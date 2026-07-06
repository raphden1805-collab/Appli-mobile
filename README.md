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
- Monde d'environ 1600x1600 (agrandi nettement par rapport aux versions
  précédentes - 4x la surface) avec biomes **générés aléatoirement**
  (bruit de Perlin/Simplex, formes organiques) : désert, plaine, neige -
  la zone de spawn reste toujours en plaine quelle que soit la seed
- **Île de forme vraiment aléatoire** : le littoral n'est pas un cercle
  mais un bruit angulaire (baies, péninsules) - change complètement de
  forme à chaque seed, visible sur la minimap
- Forêts denses regroupées dans les plaines (en plus d'arbres épars),
  cactus décoratifs dans le désert
- Points d'intérêt placés aléatoirement selon le biome : 4 villages
  désertiques (huttes + caisses), 4 immeubles abandonnés et 4 gares
  abandonnées (wagon rouillé) dans les zones enneigées, tous lootables
- **Réseau de métro souterrain branché** (4 stations, zone enneigée) :
  chaque station a un kiosque de surface (auvent, piliers, panneau,
  escalier réel qui descend dans une fosse en béton) relié - via
  téléportation au pied de l'escalier (touche interagir, comme une
  caisse ou une porte ; le monde n'a pas de collision de terrain
  "trouable", donc c'est la seule façon de passer du niveau du sol au
  sous-sol) - à un vrai quai souterrain (plateforme surélevée de chaque
  côté d'une voie en contrebas avec rails, comme une vraie station,
  et non plus un simple couloir plat). L'espace des rails (voie, quai,
  tunnels) est volontairement **3x plus grand** que dans les toutes
  premières versions - un vrai grand tunnel, pas un couloir étriqué. Les
  4 quais sont reliés entre eux
  par un vrai réseau de tunnels voûtés (section en fer à cheval, pas des
  couloirs carrés) qui se rejoignent à un **carrefour central** avec
  4 branches dans 4 directions différentes - en suivant les rails depuis
  n'importe quelle station on peut donc rejoindre n'importe quelle autre.
  Les jonctions (virages et carrefour) sont de vraies pièces creuses
  ouvertes seulement du côté des tunnels connectés - pas des blocs
  pleins, donc on peut vraiment marcher au travers, pas juste les voir en
  vidéo. Nervures de soutènement et éclairage périodique dans les
  tunnels, et une **rame automatique** (deux wagons + phare) fait la
  tournée de toutes les branches en boucle - du vrai trafic souterrain
  sous la carte plutôt que des salles isolées
- Minimap en haut à droite : image générée à partir du même bruit que
  le monde réel (donc toujours exacte), icônes différentes par type de
  point d'intérêt (carré = village, cercle = immeuble, losange = gare,
  triangle turquoise = métro, cercle jaune = ruines de départ), boussole
  "N", flèche joueur
- Panneau d'inventaire dédié (touche I ou bouton "Sac") avec un slot par
  ressource, en plus du compteur rapide déjà affiché en haut à droite
- Environnement amélioré : SSAO, glow, tonemapping filmique, anti-aliasing
  (MSAA), feuillage des arbres en grappe (plus organique qu'un simple
  cône), légère variation de teinte par instance pour casser l'effet
  copier-coller
- L'île est entourée d'une plage de sable puis d'un océan à perte de vue :
  eau animée (vagues, transparence, reflets de fresnel, dégradé
  peu profond/profond) via un shader dédié
- Textures PBR réelles **2K (2048x2048)**, libres de droits (CC0, via
  ambientcg.com), sur le sol (mélange herbe/sable/neige par shader selon
  le biome), les arbres (écorce), les rochers, les pièces de
  construction (bois/béton), les bâtiments abandonnés, les caisses et
  le minerai - fini les couleurs plates, look nettement plus réaliste
  tout en restant des formes simples (pas d'accès à une bibliothèque de
  modèles 3D détaillés ici). Résolution volontairement limitée à 2K et
  non 4K : sur une appli mobile, des textures 4K (8 matériaux x plusieurs
  cartes chacun) représenteraient facilement 1 Go+ rien que pour les
  textures de base - trop lourd à télécharger/charger en mémoire sur
  téléphone. Le 2K est déjà un bond net en qualité et reste raisonnable.
- Flou d'arrière-plan (depth of field) sur la caméra : le décor lointain
  est légèrement flouté, le premier plan net
- Herbe individuelle animée par le vent (des milliers de brins réels via
  MultiMesh, pas une texture plate) dans les plaines
- L'outil tenu en main est un vrai modèle 3D de hache basse-poly (CC0,
  Quaternius), plus les deux boîtes texturées d'avant

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
de glissement et des boutons à l'écran (affichés en texte simple, sans
cadre, pour ne pas surcharger l'écran).

## Structure du projet

```
assets/
  textures/           Textures PBR CC0 (ambientcg.com) : grass/sand/snow/
                      rock/bark/wood/metal/concrete
  shaders/            ground.shader (melange biomes), water.shader (ocean),
                      grass.shader (brins d'herbe animes)
  models/             Modeles CC0 (Quaternius) : Axe.obj (outil tenu en main)
autoload/            Inventory.gd, GameManager.gd (etat global)
scenes/
  Main.tscn/.gd       Point d'entree, assemble World + Player + HUD
  player/             Controleur FPS (deplacement, recolte, construction)
  world/              Monde, biomes (WorldMap.gd), ressources, POI abandonnes
  building/           Systeme de construction (fondation, mur, porte)
  ui/                 HUD, minimap, inventaire, joystick/visee tactiles
```

Les textures viennent d'[ambientcg.com](https://ambientcg.com) et le
modele de hache d'un pack CC0 de [Quaternius](https://www.patreon.com/quaternius)
(via opengameart.org) - licence CC0, domaine public, utilisation libre y
compris commerciale, aucune attribution requise mais c'est une bonne
pratique de la mentionner.

### Sur le photoréalisme

Une capture du vrai jeu Rust a été comparée à ce projet : ce niveau de
détail (mains/personnages modélisés et animés à la main, brouillard
volumétrique) demande une équipe d'artistes 3D et des années de travail -
structurellement hors de portée ici (pas d'outil de modélisation 3D,
pas de pipeline d'animation de personnage). Ce qui a été fait à la
place : de vraies textures et un vrai modèle d'outil (CC0), et les
effets de rendu que Godot 3.5 permet nativement (DOF, herbe individuelle,
SSAO, glow) - un plafond stylisé mais net, pas du photoréalisme AAA.

## Roadmap suggérée

1. **V1 - solo (fait)** : monde ouvert, récolte, construction, loot.
2. **V2 - multijoueur** : serveur relais (Godot High-Level Multiplayer
   ou WebSocket), synchronisation des joueurs et des bases.
3. **V3 - alliances/clans** : système de groupe, permissions de
   construction partagées, chat.
4. **V4 - PvP et survie** : armes à distance, faune, dégâts de raid sur
   les bases, cycle jour/nuit.
