extends Spatial
# Scatters biome-appropriate resource nodes and loot crates across the
# map on load, and paints the ground in three bands (desert / plaine /
# neige) matching WorldMap - the same source Minimap.gd reads to draw
# the corner map. Uses a fixed seed (GameManager.world_seed) so the
# layout is reproducible run to run while the prototype has no save
# system yet.

const WorldMap := preload("res://scenes/world/WorldMap.gd")

const TREE_SCENE := preload("res://scenes/world/Tree.tscn")
const SNOW_TREE_SCENE := preload("res://scenes/world/SnowTree.tscn")
const ROCK_SCENE := preload("res://scenes/world/Rock.tscn")
const SNOW_ROCK_SCENE := preload("res://scenes/world/SnowRock.tscn")
const DESERT_ROCK_SCENE := preload("res://scenes/world/DesertRock.tscn")
const ORE_SCENE := preload("res://scenes/world/MetalOre.tscn")
const CACTUS_SCENE := preload("res://scenes/world/Cactus.tscn")
const CRATE_SCENE := preload("res://scenes/world/LootCrate.tscn")

const VEGETATION_COUNT := 70
const ROCK_COUNT := 45
const ORE_COUNT := 15
const CRATE_COUNT := 8
const CACTUS_COUNT := 20
const MIN_SPAWN_DIST_FROM_CENTER := 8.0

onready var spawn_root: Spatial = $Spawns
onready var ground: StaticBody = $Ground

func _ready() -> void:
	_build_ground_bands()
	var rng := RandomNumberGenerator.new()
	rng.seed = GameManager.world_seed
	_scatter_vegetation(rng)
	_scatter_rocks(rng)
	_scatter(ORE_SCENE, ORE_COUNT, rng)
	_scatter(CRATE_SCENE, CRATE_COUNT, rng)
	_scatter_cacti(rng)

func _build_ground_bands() -> void:
	var bands := [
		{"biome": WorldMap.BIOME_DESERT, "x_min": -WorldMap.WORLD_HALF_SIZE, "x_max": WorldMap.DESERT_MAX_X},
		{"biome": WorldMap.BIOME_PLAINS, "x_min": WorldMap.DESERT_MAX_X, "x_max": WorldMap.SNOW_MIN_X},
		{"biome": WorldMap.BIOME_SNOW, "x_min": WorldMap.SNOW_MIN_X, "x_max": WorldMap.WORLD_HALF_SIZE},
	]
	for band in bands:
		var width: float = band["x_max"] - band["x_min"]
		var center_x: float = (band["x_max"] + band["x_min"]) / 2.0
		var mesh_instance := MeshInstance.new()
		var plane := PlaneMesh.new()
		plane.size = Vector2(width, WorldMap.WORLD_HALF_SIZE * 2.0)
		mesh_instance.mesh = plane
		var mat := SpatialMaterial.new()
		mat.albedo_color = WorldMap.BIOME_COLORS[band["biome"]]
		mat.roughness = 1.0
		mesh_instance.material_override = mat
		mesh_instance.transform.origin = Vector3(center_x, 0, 0)
		ground.add_child(mesh_instance)

func _scatter_vegetation(rng: RandomNumberGenerator) -> void:
	for i in range(VEGETATION_COUNT):
		var pos := _random_position(rng)
		var biome := WorldMap.get_biome(pos.x)
		if biome == WorldMap.BIOME_DESERT:
			continue
		var scene: PackedScene = SNOW_TREE_SCENE if biome == WorldMap.BIOME_SNOW else TREE_SCENE
		_spawn(scene, pos, rng)

func _scatter_rocks(rng: RandomNumberGenerator) -> void:
	for i in range(ROCK_COUNT):
		var pos := _random_position(rng)
		var biome := WorldMap.get_biome(pos.x)
		var scene: PackedScene = ROCK_SCENE
		if biome == WorldMap.BIOME_SNOW:
			scene = SNOW_ROCK_SCENE
		elif biome == WorldMap.BIOME_DESERT:
			scene = DESERT_ROCK_SCENE
		_spawn(scene, pos, rng)

func _scatter_cacti(rng: RandomNumberGenerator) -> void:
	for i in range(CACTUS_COUNT):
		var pos := Vector3(
			rng.randf_range(-WorldMap.WORLD_HALF_SIZE, WorldMap.DESERT_MAX_X),
			0,
			rng.randf_range(-WorldMap.WORLD_HALF_SIZE, WorldMap.WORLD_HALF_SIZE)
		)
		_spawn(CACTUS_SCENE, pos, rng)

func _scatter(scene: PackedScene, count: int, rng: RandomNumberGenerator) -> void:
	for i in range(count):
		_spawn(scene, _random_position(rng), rng)

func _spawn(scene: PackedScene, pos: Vector3, rng: RandomNumberGenerator) -> void:
	var instance = scene.instance()
	spawn_root.add_child(instance)
	instance.transform.origin = pos
	instance.rotation.y = rng.randf_range(0, TAU)
	var s := rng.randf_range(0.85, 1.2)
	instance.scale = Vector3(s, s, s)
	_apply_tint_variation(instance, rng)

# Nudges each instance's material brightness slightly so scattered
# copies of the same tree/rock don't look like an obvious copy-paste grid.
func _apply_tint_variation(instance: Node, rng: RandomNumberGenerator) -> void:
	var jitter := rng.randf_range(0.85, 1.15)
	for mesh_instance in _find_mesh_instances(instance):
		var mat = mesh_instance.get_surface_material(0)
		if mat is SpatialMaterial:
			var tinted: SpatialMaterial = mat.duplicate()
			var c: Color = tinted.albedo_color
			tinted.albedo_color = Color(c.r * jitter, c.g * jitter, c.b * jitter, c.a)
			mesh_instance.material_override = tinted

func _find_mesh_instances(node: Node) -> Array:
	var result := []
	for child in node.get_children():
		if child is MeshInstance:
			result.append(child)
		if child.get_child_count() > 0:
			result.append_array(_find_mesh_instances(child))
	return result

func _random_position(rng: RandomNumberGenerator) -> Vector3:
	var pos := Vector3.ZERO
	while true:
		pos = Vector3(
			rng.randf_range(-WorldMap.WORLD_HALF_SIZE, WorldMap.WORLD_HALF_SIZE),
			0,
			rng.randf_range(-WorldMap.WORLD_HALF_SIZE, WorldMap.WORLD_HALF_SIZE)
		)
		if pos.length() > MIN_SPAWN_DIST_FROM_CENTER:
			break
	return pos
