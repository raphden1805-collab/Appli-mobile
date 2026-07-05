extends Spatial
# Scatters resource nodes and loot crates across the map on load. Uses a
# fixed seed (GameManager.world_seed) so the layout is reproducible run
# to run while the prototype has no save system yet.

const TREE_SCENE := preload("res://scenes/world/Tree.tscn")
const ROCK_SCENE := preload("res://scenes/world/Rock.tscn")
const ORE_SCENE := preload("res://scenes/world/MetalOre.tscn")
const CRATE_SCENE := preload("res://scenes/world/LootCrate.tscn")

const WORLD_HALF_SIZE := 90.0
const TREE_COUNT := 60
const ROCK_COUNT := 35
const ORE_COUNT := 15
const CRATE_COUNT := 8
const MIN_SPAWN_DIST_FROM_CENTER := 8.0

onready var spawn_root: Spatial = $Spawns

func _ready() -> void:
	var rng := RandomNumberGenerator.new()
	rng.seed = GameManager.world_seed
	_scatter(TREE_SCENE, TREE_COUNT, rng)
	_scatter(ROCK_SCENE, ROCK_COUNT, rng)
	_scatter(ORE_SCENE, ORE_COUNT, rng)
	_scatter(CRATE_SCENE, CRATE_COUNT, rng)

func _scatter(scene: PackedScene, count: int, rng: RandomNumberGenerator) -> void:
	for i in range(count):
		var instance = scene.instance()
		var pos := _random_position(rng)
		spawn_root.add_child(instance)
		instance.transform.origin = pos
		instance.rotation.y = rng.randf_range(0, TAU)

func _random_position(rng: RandomNumberGenerator) -> Vector3:
	var pos := Vector3.ZERO
	while true:
		pos = Vector3(
			rng.randf_range(-WORLD_HALF_SIZE, WORLD_HALF_SIZE),
			0,
			rng.randf_range(-WORLD_HALF_SIZE, WORLD_HALF_SIZE)
		)
		if pos.length() > MIN_SPAWN_DIST_FROM_CENTER:
			break
	return pos
