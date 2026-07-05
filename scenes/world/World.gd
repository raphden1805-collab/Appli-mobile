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
const ABANDONED_METRO_SCENE := preload("res://scenes/world/AbandonedMetro.tscn")
const METRO_NETWORK_SCRIPT := preload("res://scenes/world/MetroNetwork.gd")

const GROUND_RESOLUTION := 160
const WATER_RESOLUTION := 130

const VEGETATION_COUNT := 220
const FOREST_CLUSTERS := 14
const TREES_PER_FOREST := 22
const FOREST_RADIUS := 22.0
const ROCK_COUNT := 300
const ORE_COUNT := 100
const CRATE_COUNT := 40
const CACTUS_COUNT := 160
const DESERT_VILLAGE_COUNT := 3
const SNOW_BUILDING_COUNT := 3
const SNOW_STATION_COUNT := 3
const SNOW_METRO_COUNT := 3
const MIN_SPAWN_DIST_FROM_CENTER := 8.0
const MAX_PLACEMENT_ATTEMPTS := 250
const GRASS_COUNT := 34000
const GRASS_ATTEMPTS_PER_BLADE := 12
const METRO_HOLE_RADIUS := 4.5
const WATER_HOLE_RADIUS := 20.0

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
	# Metro entrances need an actual hole in the ground mesh (unlike other
	# POIs, which just sit on top of it), so their positions must be known
	# before the ground is built rather than sampled afterwards.
	var metro_positions := _plan_metro_positions(rng)
	_build_ground_mesh(metro_positions)
	_build_water_mesh(metro_positions)
	_build_grass(rng)
	_scatter_forests(rng)
	_scatter_vegetation(rng)
	_scatter_rocks(rng)
	_scatter(ORE_SCENE, ORE_COUNT, rng)
	_scatter(CRATE_SCENE, CRATE_COUNT, rng)
	_scatter_cacti(rng)
	_place_pois(rng, metro_positions)
	_build_metro_network(metro_positions)

# --- Ground -----------------------------------------------------------

func _build_ground_mesh(hole_positions: Array) -> void:
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
			if _in_any_hole(Vector2((x0 + x1) * 0.5, (z0 + z1) * 0.5), hole_positions, METRO_HOLE_RADIUS):
				continue
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

func _in_any_hole(p: Vector2, hole_positions: Array, radius: float) -> bool:
	for hp in hole_positions:
		if p.distance_to(hp) < radius:
			return true
	return false

func _add_water_tri(st: SurfaceTool, a: Vector3, b: Vector3, c: Vector3) -> void:
	st.add_normal(Vector3.UP)
	st.add_vertex(a)
	st.add_normal(Vector3.UP)
	st.add_vertex(b)
	st.add_normal(Vector3.UP)
	st.add_vertex(c)

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

func _build_water_mesh(hole_positions: Array) -> void:
	# A plain PlaneMesh can't have holes, and the ocean sits at
	# WATER_LEVEL=-0.2 - just below ground level but well above the metro
	# stairwells (which descend past y=-2) - so without a matching hole
	# here the water would mask every stairwell from above. Built as a
	# hand-tessellated grid (like the ground) so those quads can be
	# skipped the same way.
	var half := WorldMap.WATER_SIZE * 0.5
	var step := (half * 2.0) / WATER_RESOLUTION
	var st := SurfaceTool.new()
	st.begin(Mesh.PRIMITIVE_TRIANGLES)
	for zi in range(WATER_RESOLUTION):
		var z0 := -half + zi * step
		var z1 := z0 + step
		for xi in range(WATER_RESOLUTION):
			var x0 := -half + xi * step
			var x1 := x0 + step
			if _in_any_hole(Vector2((x0 + x1) * 0.5, (z0 + z1) * 0.5), hole_positions, WATER_HOLE_RADIUS):
				continue
			var p00 := Vector3(x0, 0, z0)
			var p10 := Vector3(x1, 0, z0)
			var p01 := Vector3(x0, 0, z1)
			var p11 := Vector3(x1, 0, z1)
			_add_water_tri(st, p00, p10, p11)
			_add_water_tri(st, p00, p11, p01)
	var mesh_instance := MeshInstance.new()
	mesh_instance.mesh = st.commit()
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

func _place_pois(rng: RandomNumberGenerator, metro_positions: Array) -> void:
	for i in range(DESERT_VILLAGE_COUNT):
		_place_poi(DESERT_VILLAGE_SCENE, WorldMap.BIOME_DESERT, "Village desertique", "village", rng)
	for i in range(SNOW_BUILDING_COUNT):
		_place_poi(ABANDONED_BUILDING_SCENE, WorldMap.BIOME_SNOW, "Immeuble abandonne", "building", rng)
	for i in range(SNOW_STATION_COUNT):
		_place_poi(ABANDONED_STATION_SCENE, WorldMap.BIOME_SNOW, "Gare abandonnee", "station", rng)
	for pos2 in metro_positions:
		_place_metro(pos2, rng)

func _place_poi(scene: PackedScene, biome: String, label: String, poi_type: String, rng: RandomNumberGenerator) -> void:
	var pos = _random_biome_position(rng, biome)
	if pos == null:
		return
	var instance = scene.instance()
	spawn_root.add_child(instance)
	instance.transform.origin = pos
	instance.rotation.y = rng.randf_range(0, TAU)
	poi_list.append({"name": label, "pos": Vector2(pos.x, pos.z), "type": poi_type})

# Metro entrances need their ground-mesh hole cut before the ground is
# built (see _ready()), so their world position is decided up front in
# _plan_metro_positions() and reused here instead of being resampled.
func _plan_metro_positions(rng: RandomNumberGenerator) -> Array:
	var positions := []
	for i in range(SNOW_METRO_COUNT):
		var pos = _random_biome_position(rng, WorldMap.BIOME_SNOW)
		if pos != null:
			positions.append(Vector2(pos.x, pos.z))
	return positions

func _place_metro(pos2: Vector2, rng: RandomNumberGenerator) -> void:
	var instance = ABANDONED_METRO_SCENE.instance()
	spawn_root.add_child(instance)
	instance.transform.origin = Vector3(pos2.x, 0, pos2.y)
	# The surface kiosk can face any direction, but the underground
	# platform room needs to stay world-axis-aligned so MetroNetwork can
	# connect straight tunnels to it - cancel the kiosk's rotation locally
	# on the Underground node (its (0,-40,0) offset is unaffected by a
	# pure Y rotation, only its children's orientation is).
	var yaw := rng.randf_range(0, TAU)
	instance.rotation.y = yaw
	instance.get_node("Underground").rotation.y = -yaw
	poi_list.append({"name": "Metro abandonne", "pos": pos2, "type": "metro"})

# Chains every metro station's platform room into one tunnel network
# (see MetroNetwork.gd), ordered by X so each connection is a simple
# straight-ish run rather than crossing back and forth across the map.
func _build_metro_network(metro_positions: Array) -> void:
	if metro_positions.empty():
		return
	var ordered: Array = metro_positions.duplicate()
	ordered.sort_custom(self, "_sort_by_x")
	var network := Spatial.new()
	network.set_script(METRO_NETWORK_SCRIPT)
	add_child(network)
	network.build(ordered)

func _sort_by_x(a: Vector2, b: Vector2) -> bool:
	return a.x < b.x

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
