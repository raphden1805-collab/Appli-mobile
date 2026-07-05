extends Spatial
# Builds the whole map on load: a texture-splatted ground mesh, a
# surrounding ocean, and biome-aware scattering, all driven by the same
# OpenSimplexNoise field (see WorldMap.gd) so the ground colors, the
# scattered resources and the minimap always agree on where the
# desert/plains/snow/beach are. Uses a fixed seed (GameManager.world_seed)
# so the layout is reproducible run to run while the prototype has no
# save system yet.

const WorldMap := preload("res://scenes/world/WorldMap.gd")
const GROUND_SHADER := preload("res://assets/shaders/ground.shader")
const WATER_SHADER := preload("res://assets/shaders/water.shader")
const GRASS_SHADER := preload("res://assets/shaders/grass.shader")

const TREE_SCENE := preload("res://scenes/world/Tree.tscn")
const SNOW_TREE_SCENE := preload("res://scenes/world/SnowTree.tscn")
const ROCK_SCENE := preload("res://scenes/world/Rock.tscn")
const SNOW_ROCK_SCENE := preload("res://scenes/world/SnowRock.tscn")
const DESERT_ROCK_SCENE := preload("res://scenes/world/DesertRock.tscn")
const ORE_SCENE := preload("res://scenes/world/MetalOre.tscn")
const CACTUS_SCENE := preload("res://scenes/world/Cactus.tscn")
const CRATE_SCENE := preload("res://scenes/world/LootCrate.tscn")
const DESERT_VILLAGE_SCENE := preload("res://scenes/world/DesertVillage.tscn")
const ABANDONED_BUILDING_SCENE := preload("res://scenes/world/AbandonedBuilding.tscn")
const ABANDONED_STATION_SCENE := preload("res://scenes/world/AbandonedStation.tscn")

const GROUND_RESOLUTION := 96
const WATER_RESOLUTION := 100

const VEGETATION_COUNT := 100
const FOREST_CLUSTERS := 8
const TREES_PER_FOREST := 22
const FOREST_RADIUS := 22.0
const ROCK_COUNT := 150
const ORE_COUNT := 50
const CRATE_COUNT := 24
const CACTUS_COUNT := 80
const DESERT_VILLAGE_COUNT := 2
const SNOW_BUILDING_COUNT := 2
const SNOW_STATION_COUNT := 2
const MIN_SPAWN_DIST_FROM_CENTER := 8.0
const MAX_PLACEMENT_ATTEMPTS := 250
const GRASS_COUNT := 25000
const GRASS_ATTEMPTS_PER_BLADE := 12

onready var spawn_root: Spatial = $Spawns
onready var ground: StaticBody = $Ground

var noise: OpenSimplexNoise
var coast_noise: OpenSimplexNoise
var poi_list := [{"name": "Ruines de depart", "pos": Vector2(8, 8), "type": "ruins"}]

func _ready() -> void:
	noise = WorldMap.create_noise(GameManager.world_seed)
	coast_noise = WorldMap.create_coast_noise(GameManager.world_seed)
	var rng := RandomNumberGenerator.new()
	rng.seed = GameManager.world_seed
	_build_ground_mesh()
	_build_water_mesh()
	_build_grass(rng)
	_scatter_forests(rng)
	_scatter_vegetation(rng)
	_scatter_rocks(rng)
	_scatter(ORE_SCENE, ORE_COUNT, rng)
	_scatter(CRATE_SCENE, CRATE_COUNT, rng)
	_scatter_cacti(rng)
	_place_pois(rng)

# --- Ground -----------------------------------------------------------

func _build_ground_mesh() -> void:
	var half := WorldMap.GROUND_MESH_RADIUS
	var step := (half * 2.0) / GROUND_RESOLUTION
	var st := SurfaceTool.new()
	st.begin(Mesh.PRIMITIVE_TRIANGLES)
	for zi in range(GROUND_RESOLUTION):
		var z0 := -half + zi * step
		var z1 := z0 + step
		for xi in range(GROUND_RESOLUTION):
			var x0 := -half + xi * step
			var x1 := x0 + step
			var p00 := Vector3(x0, 0, z0)
			var p10 := Vector3(x1, 0, z0)
			var p01 := Vector3(x0, 0, z1)
			var p11 := Vector3(x1, 0, z1)
			var w00 := WorldMap.get_biome_weights(noise, coast_noise, x0, z0)
			var w10 := WorldMap.get_biome_weights(noise, coast_noise, x1, z0)
			var w01 := WorldMap.get_biome_weights(noise, coast_noise, x0, z1)
			var w11 := WorldMap.get_biome_weights(noise, coast_noise, x1, z1)
			_add_tri(st, p00, p10, p11, w00, w10, w11)
			_add_tri(st, p00, p11, p01, w00, w11, w01)
	st.generate_tangents()
	var mesh_data := st.commit()
	var mesh_instance := MeshInstance.new()
	mesh_instance.mesh = mesh_data
	mesh_instance.material_override = _build_ground_material()
	ground.add_child(mesh_instance)

func _build_ground_material() -> ShaderMaterial:
	var mat := ShaderMaterial.new()
	mat.shader = GROUND_SHADER
	mat.set_shader_param("sand_albedo", load("res://assets/textures/sand/Color.jpg"))
	mat.set_shader_param("sand_normal", load("res://assets/textures/sand/NormalGL.jpg"))
	mat.set_shader_param("sand_roughness", load("res://assets/textures/sand/Roughness.jpg"))
	mat.set_shader_param("grass_albedo", load("res://assets/textures/grass/Color.jpg"))
	mat.set_shader_param("grass_normal", load("res://assets/textures/grass/NormalGL.jpg"))
	mat.set_shader_param("grass_roughness", load("res://assets/textures/grass/Roughness.jpg"))
	mat.set_shader_param("snow_albedo", load("res://assets/textures/snow/Color.jpg"))
	mat.set_shader_param("snow_normal", load("res://assets/textures/snow/NormalGL.jpg"))
	mat.set_shader_param("snow_roughness", load("res://assets/textures/snow/Roughness.jpg"))
	return mat

func _add_tri(st: SurfaceTool, a: Vector3, b: Vector3, c: Vector3, wa: Vector3, wb: Vector3, wc: Vector3) -> void:
	_add_vertex(st, a, wa)
	_add_vertex(st, b, wb)
	_add_vertex(st, c, wc)

func _add_vertex(st: SurfaceTool, pos: Vector3, w: Vector3) -> void:
	st.add_uv(Vector2(pos.x, pos.z))
	st.add_color(Color(w.x, w.y, w.z))
	st.add_normal(Vector3.UP)
	st.add_vertex(pos)

# --- Grass ----------------------------------------------------------------
# Real per-blade geometry (not a texture) scattered with MultiMesh so it
# stays a single draw call regardless of count: each blade is one
# triangle whose tip vertex is tagged (via vertex color) so the shader
# can bend it in the wind without touching the rooted base verts.

func _build_grass(rng: RandomNumberGenerator) -> void:
	var blade := _build_grass_blade_mesh()
	var mm := MultiMesh.new()
	mm.transform_format = MultiMesh.TRANSFORM_3D
	mm.mesh = blade

	var transforms := []
	for i in range(GRASS_COUNT):
		var pos = null
		for attempt in range(GRASS_ATTEMPTS_PER_BLADE):
			var candidate := _random_position(rng)
			if WorldMap.get_biome(noise, candidate.x, candidate.z) == WorldMap.BIOME_PLAINS:
				pos = candidate
				break
		if pos == null:
			continue
		var s := rng.randf_range(0.8, 1.3)
		var basis := Basis(Vector3.UP, rng.randf_range(0, TAU)).scaled(Vector3(s, s, s))
		transforms.append(Transform(basis, pos))

	mm.instance_count = transforms.size()
	for i in range(transforms.size()):
		mm.set_instance_transform(i, transforms[i])

	var mmi := MultiMeshInstance.new()
	mmi.multimesh = mm
	var mat := ShaderMaterial.new()
	mat.shader = GRASS_SHADER
	mmi.material_override = mat
	mmi.cast_shadow = GeometryInstance.SHADOW_CASTING_SETTING_OFF
	add_child(mmi)

func _build_grass_blade_mesh() -> ArrayMesh:
	var st := SurfaceTool.new()
	st.begin(Mesh.PRIMITIVE_TRIANGLES)
	var half_width := 0.028
	var height := 0.32
	var lean := 0.06
	st.add_color(Color(0, 0, 0))
	st.add_normal(Vector3.UP)
	st.add_vertex(Vector3(-half_width, 0, 0))
	st.add_color(Color(0, 0, 0))
	st.add_normal(Vector3.UP)
	st.add_vertex(Vector3(half_width, 0, 0))
	st.add_color(Color(1, 1, 1))
	st.add_normal(Vector3.UP)
	st.add_vertex(Vector3(0, height, lean))
	return st.commit()

# --- Water --------------------------------------------------------------

func _build_water_mesh() -> void:
	var plane := PlaneMesh.new()
	plane.size = Vector2(WorldMap.WATER_SIZE, WorldMap.WATER_SIZE)
	plane.subdivide_width = WATER_RESOLUTION
	plane.subdivide_depth = WATER_RESOLUTION
	var mesh_instance := MeshInstance.new()
	mesh_instance.mesh = plane
	mesh_instance.transform.origin = Vector3(0, WorldMap.WATER_LEVEL, 0)
	var mat := ShaderMaterial.new()
	mat.shader = WATER_SHADER
	mat.set_shader_param("coast_radius", WorldMap.COAST_BASE_RADIUS + WorldMap.BEACH_WIDTH)
	mat.set_shader_param("fade_distance", WorldMap.COAST_VARIATION + 60.0)
	mesh_instance.material_override = mat
	add_child(mesh_instance)

# --- Scattering ---------------------------------------------------------

func _scatter_vegetation(rng: RandomNumberGenerator) -> void:
	for i in range(VEGETATION_COUNT):
		var pos := _random_position(rng)
		var biome := WorldMap.get_biome(noise, pos.x, pos.z)
		if biome == WorldMap.BIOME_DESERT:
			continue
		var scene: PackedScene = SNOW_TREE_SCENE if biome == WorldMap.BIOME_SNOW else TREE_SCENE
		_spawn(scene, pos, rng)

func _scatter_forests(rng: RandomNumberGenerator) -> void:
	for i in range(FOREST_CLUSTERS):
		var center = _random_biome_position(rng, WorldMap.BIOME_PLAINS)
		if center == null:
			continue
		for j in range(TREES_PER_FOREST):
			var pos: Vector3 = center + Vector3(
				rng.randf_range(-FOREST_RADIUS, FOREST_RADIUS), 0,
				rng.randf_range(-FOREST_RADIUS, FOREST_RADIUS)
			)
			if WorldMap.get_biome(noise, pos.x, pos.z) != WorldMap.BIOME_PLAINS:
				continue
			_spawn(TREE_SCENE, pos, rng)

func _scatter_rocks(rng: RandomNumberGenerator) -> void:
	for i in range(ROCK_COUNT):
		var pos := _random_position(rng)
		var biome := WorldMap.get_biome(noise, pos.x, pos.z)
		var scene: PackedScene = ROCK_SCENE
		if biome == WorldMap.BIOME_SNOW:
			scene = SNOW_ROCK_SCENE
		elif biome == WorldMap.BIOME_DESERT:
			scene = DESERT_ROCK_SCENE
		_spawn(scene, pos, rng)

func _scatter_cacti(rng: RandomNumberGenerator) -> void:
	for i in range(CACTUS_COUNT):
		var pos = _random_biome_position(rng, WorldMap.BIOME_DESERT)
		if pos != null:
			_spawn(CACTUS_SCENE, pos, rng)

func _scatter(scene: PackedScene, count: int, rng: RandomNumberGenerator) -> void:
	for i in range(count):
		_spawn(scene, _random_position(rng), rng)

# --- Points of interest --------------------------------------------------

func _place_pois(rng: RandomNumberGenerator) -> void:
	for i in range(DESERT_VILLAGE_COUNT):
		_place_poi(DESERT_VILLAGE_SCENE, WorldMap.BIOME_DESERT, "Village desertique", "village", rng)
	for i in range(SNOW_BUILDING_COUNT):
		_place_poi(ABANDONED_BUILDING_SCENE, WorldMap.BIOME_SNOW, "Immeuble abandonne", "building", rng)
	for i in range(SNOW_STATION_COUNT):
		_place_poi(ABANDONED_STATION_SCENE, WorldMap.BIOME_SNOW, "Gare abandonnee", "station", rng)

func _place_poi(scene: PackedScene, biome: String, label: String, poi_type: String, rng: RandomNumberGenerator) -> void:
	var pos = _random_biome_position(rng, biome)
	if pos == null:
		return
	var instance = scene.instance()
	spawn_root.add_child(instance)
	instance.transform.origin = pos
	instance.rotation.y = rng.randf_range(0, TAU)
	poi_list.append({"name": label, "pos": Vector2(pos.x, pos.z), "type": poi_type})

# --- Helpers --------------------------------------------------------------

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

# Uniform-in-area sampling within the island's irregular coastline:
# picks a random angle, then a random radius up to that angle's actual
# coast distance (sqrt of a uniform random fraction avoids over-density
# near the center).
func _random_position(rng: RandomNumberGenerator) -> Vector3:
	var angle := rng.randf_range(0, TAU)
	var coast_r := WorldMap.get_coast_radius(coast_noise, angle)
	var r := sqrt(rng.randf()) * max(coast_r - 1.0, MIN_SPAWN_DIST_FROM_CENTER)
	if r <= MIN_SPAWN_DIST_FROM_CENTER:
		r = MIN_SPAWN_DIST_FROM_CENTER + 1.0
	return Vector3(cos(angle) * r, 0, sin(angle) * r)

# Rejection-samples a random position until it lands in the requested
# biome, or returns null if it couldn't find one within the attempt budget
# (can happen with an unlucky seed where a biome barely exists).
func _random_biome_position(rng: RandomNumberGenerator, biome: String):
	for i in range(MAX_PLACEMENT_ATTEMPTS):
		var pos := _random_position(rng)
		if WorldMap.get_biome(noise, pos.x, pos.z) == biome:
			return pos
	return null
