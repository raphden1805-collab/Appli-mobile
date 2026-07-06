extends Spatial
# Connects every abandoned metro station's platform room (see
# AbandonedMetro.tscn) into one underground network, plus a train that
# tours the whole thing - real branching underground traffic instead of
# isolated rooms or a single straight line.
#
# Topology: a central hub junction sits at the stations' centroid; each
# station (up to 4) is assigned one of the 4 cardinal ports around the
# hub (sorted by angle so they fan out to genuinely different
# directions) and connected via a straight-segment "dogleg" (at most one
# 90-degree turn, or two for a station on the opposite side of the hub).
# Every tunnel piece is a straight, axis-aligned extrusion - no curves
# needed. Junctions (corners and the hub) are hollow rooms open only on
# the sides an actual tunnel connects to - a solid filled block there
# would physically block the player/train from ever passing through.

const TUNNEL_Y := -40.0
# The rail/track cross-section (width+height) is 3x the original size
# per user request - a much grander bore, not a cramped corridor. Only
# width/height scale; tunnel run lengths and station spacing are
# unaffected. TUNNEL_HALF_WIDTH must match AbandonedMetro.TRACK_HALF_WIDTH
# so station track beds line up with the tunnels connecting to them.
const TUNNEL_HALF_WIDTH := 6.0
const TUNNEL_WALL_HEIGHT := 6.0
const TUNNEL_ARCH_HEIGHT := 10.5
const STATION_HALF_LENGTH := 14.0
const SEGMENT_LENGTH := 8.0
const RIB_EVERY := 4
const LIGHT_EVERY := 6
const HUB_HALF := TUNNEL_HALF_WIDTH + 3.6

const PORT_DIRS := [Vector2(0, -1), Vector2(1, 0), Vector2(0, 1), Vector2(-1, 0)]
const CARDINALS := [Vector2(0, -1), Vector2(1, 0), Vector2(0, 1), Vector2(-1, 0)]

const CONCRETE_COLOR := preload("res://assets/textures/concrete/Color.jpg")
const CONCRETE_NORMAL := preload("res://assets/textures/concrete/NormalGL.jpg")
const CONCRETE_ROUGH := preload("res://assets/textures/concrete/Roughness.jpg")
const METAL_COLOR := preload("res://assets/textures/metal/Color.jpg")
const METAL_NORMAL := preload("res://assets/textures/metal/NormalGL.jpg")
const METAL_ROUGH := preload("res://assets/textures/metal/Roughness.jpg")
const WOOD_COLOR := preload("res://assets/textures/wood/Color.jpg")
const WOOD_NORMAL := preload("res://assets/textures/wood/NormalGL.jpg")
const WOOD_ROUGH := preload("res://assets/textures/wood/Roughness.jpg")
const TRAIN_SCRIPT := preload("res://scenes/world/MetroTrain.gd")

const TIE_EVERY := 1.4
const PIPE_EVERY := 3

var tunnel_mat: SpatialMaterial
var rib_mat: SpatialMaterial
var rail_mat: SpatialMaterial
var rust_mat: SpatialMaterial
var tie_mat: SpatialMaterial
var pipe_mat: SpatialMaterial
var _sort_hub := Vector2.ZERO

func build(station_positions: Array) -> void:
	_init_materials()
	var n := station_positions.size()
	if n == 0:
		return
	if n == 1:
		_cap_end(station_positions[0], true)
		_cap_end(station_positions[0], false)
		return

	var hub := Vector2.ZERO
	for p in station_positions:
		hub += p
	hub /= n

	# Only 4 cardinal ports exist at the hub - extra stations beyond that
	# just get a sealed room (still reachable from the surface, just not
	# part of the tunnel network). Not expected with the default station
	# count, but kept safe rather than crashing.
	var hub_stations: Array = station_positions
	var orphan_stations: Array = []
	if n > 4:
		hub_stations = station_positions.slice(0, 3)
		orphan_stations = station_positions.slice(4, n - 1)
	for st in orphan_stations:
		_cap_end(st, true)
		_cap_end(st, false)

	_sort_hub = hub
	hub_stations.sort_custom(self, "_sort_by_angle")

	var used_ports := []
	var train_legs := []
	for i in range(hub_stations.size()):
		var station: Vector2 = hub_stations[i]
		var port_dir: Vector2 = PORT_DIRS[i]
		used_ports.append(port_dir)
		var hub_exit := hub + port_dir * HUB_HALF
		var port_is_x := abs(port_dir.x) > 0.5

		# Whichever station end faces the hub gets the tunnel; the other
		# end is sealed (see AbandonedMetro.tscn - the platform's own
		# end-walls already flank the track-width gap on both ends, so
		# this cap only needs to plug that gap, not the whole room).
		var front_faces_hub: bool = hub.y < station.y
		var station_exit := station + Vector2(0, -STATION_HALF_LENGTH if front_faces_hub else STATION_HALF_LENGTH)
		_cap_end(station, not front_faces_hub)

		var leg := _connect_ports(hub_exit, port_is_x, station_exit, false)
		train_legs.append({"leg": leg, "station": station})

	_build_junction(hub, HUB_HALF, used_ports)
	_build_train_tour(train_legs)

func _sort_by_angle(a: Vector2, b: Vector2) -> bool:
	return (a - _sort_hub).angle() < (b - _sort_hub).angle()

func _init_materials() -> void:
	tunnel_mat = SpatialMaterial.new()
	tunnel_mat.albedo_color = Color(0.66, 0.64, 0.61)
	tunnel_mat.albedo_texture = CONCRETE_COLOR
	tunnel_mat.roughness = 1.0
	tunnel_mat.roughness_texture = CONCRETE_ROUGH
	tunnel_mat.normal_enabled = true
	tunnel_mat.normal_texture = CONCRETE_NORMAL
	tunnel_mat.uv1_scale = Vector3(1.5, 1.5, 1.5)
	tunnel_mat.params_cull_mode = SpatialMaterial.CULL_DISABLED

	rib_mat = SpatialMaterial.new()
	rib_mat.albedo_color = Color(0.25, 0.24, 0.24)
	rib_mat.albedo_texture = METAL_COLOR
	rib_mat.metallic = 0.4
	rib_mat.roughness = 0.7
	rib_mat.roughness_texture = METAL_ROUGH
	rib_mat.normal_enabled = true
	rib_mat.normal_texture = METAL_NORMAL

	rail_mat = SpatialMaterial.new()
	rail_mat.albedo_color = Color(0.5, 0.5, 0.53)
	rail_mat.albedo_texture = METAL_COLOR
	rail_mat.metallic = 0.6
	rail_mat.roughness = 0.4
	rail_mat.roughness_texture = METAL_ROUGH
	rail_mat.normal_enabled = true
	rail_mat.normal_texture = METAL_NORMAL

	rust_mat = SpatialMaterial.new()
	rust_mat.albedo_color = Color(0.5, 0.32, 0.22)
	rust_mat.albedo_texture = METAL_COLOR
	rust_mat.metallic = 0.3
	rust_mat.roughness = 0.8
	rust_mat.roughness_texture = METAL_ROUGH
	rust_mat.normal_enabled = true
	rust_mat.normal_texture = METAL_NORMAL
	rust_mat.uv1_scale = Vector3(2, 1, 1)

	tie_mat = SpatialMaterial.new()
	tie_mat.albedo_color = Color(0.22, 0.16, 0.12)
	tie_mat.albedo_texture = WOOD_COLOR
	tie_mat.roughness = 0.95
	tie_mat.roughness_texture = WOOD_ROUGH
	tie_mat.normal_enabled = true
	tie_mat.normal_texture = WOOD_NORMAL

	pipe_mat = SpatialMaterial.new()
	pipe_mat.albedo_color = Color(0.35, 0.16, 0.12)
	pipe_mat.albedo_texture = METAL_COLOR
	pipe_mat.metallic = 0.5
	pipe_mat.roughness = 0.6
	pipe_mat.roughness_texture = METAL_ROUGH
	pipe_mat.normal_enabled = true
	pipe_mat.normal_texture = METAL_NORMAL

# Rounded horseshoe cross-section (floor-left up the wall, over the arch,
# back down to floor-right) - reads as a real tunnel bore instead of a box.
func _arch_profile() -> Array:
	var w := TUNNEL_HALF_WIDTH
	var wh := TUNNEL_WALL_HEIGHT
	var ah := TUNNEL_ARCH_HEIGHT
	return [
		Vector2(-w, 0.0),
		Vector2(-w, wh),
		Vector2(-w * 0.8, wh + 0.8),
		Vector2(-w * 0.4, ah - 0.2),
		Vector2(0.0, ah),
		Vector2(w * 0.4, ah - 0.2),
		Vector2(w * 0.8, wh + 0.8),
		Vector2(w, wh),
		Vector2(w, 0.0),
	]

# Builds a straight-segment connector between two "ports" (a point plus
# whether its outward tunnel direction is along X or always along Z for
# a station). Uses a single corner if the two ports face perpendicular
# directions, or two corners (a Z/X dogleg) if they face the same axis.
# Returns the ordered waypoints from from_point to to_point (inclusive)
# for the train path.
func _connect_ports(from_point: Vector2, from_is_x: bool, to_point: Vector2, to_is_x: bool) -> Array:
	var waypoints := [from_point]
	if from_is_x != to_is_x:
		var corner: Vector2 = Vector2(to_point.x, from_point.y) if from_is_x else Vector2(from_point.x, to_point.y)
		_build_straight(from_point, corner)
		_build_straight(corner, to_point)
		var d1 := (corner - from_point).normalized()
		var d2 := (to_point - corner).normalized()
		_build_junction(corner, TUNNEL_HALF_WIDTH + 0.9, [-d1, d2])
		waypoints.append(corner)
	else:
		var c1: Vector2
		var c2: Vector2
		if from_is_x:
			var mid_x := (from_point.x + to_point.x) * 0.5
			c1 = Vector2(mid_x, from_point.y)
			c2 = Vector2(mid_x, to_point.y)
		else:
			var mid_z := (from_point.y + to_point.y) * 0.5
			c1 = Vector2(from_point.x, mid_z)
			c2 = Vector2(to_point.x, mid_z)
		_build_straight(from_point, c1)
		_build_straight(c1, c2)
		_build_straight(c2, to_point)
		var d1b := (c1 - from_point).normalized()
		var d2b := (c2 - c1).normalized()
		var d3b := (to_point - c2).normalized()
		_build_junction(c1, TUNNEL_HALF_WIDTH + 0.9, [-d1b, d2b])
		_build_junction(c2, TUNNEL_HALF_WIDTH + 0.9, [-d2b, d3b])
		waypoints.append(c1)
		waypoints.append(c2)
	waypoints.append(to_point)
	return waypoints

func _build_straight(from2: Vector2, to2: Vector2) -> void:
	var length := from2.distance_to(to2)
	if length < 0.1:
		return
	var dir := (to2 - from2) / length
	var yaw := atan2(-dir.x, -dir.y)
	var root := Spatial.new()
	root.transform.origin = Vector3(from2.x, TUNNEL_Y, from2.y)
	root.rotation.y = yaw
	add_child(root)

	var segments := max(1, int(round(length / SEGMENT_LENGTH)))
	var seg_len := length / segments
	var profile := _arch_profile()
	var st := SurfaceTool.new()
	st.begin(Mesh.PRIMITIVE_TRIANGLES)
	for i in range(segments):
		_extrude_ring(st, profile, -i * seg_len, -(i + 1) * seg_len)
	st.generate_normals()
	st.generate_tangents()
	var mesh_instance := MeshInstance.new()
	mesh_instance.mesh = st.commit()
	mesh_instance.material_override = tunnel_mat
	root.add_child(mesh_instance)

	_add_tunnel_floor(root, length)
	_add_pipes(root, length)

	for i in range(segments + 1):
		var z := -i * seg_len
		if i % RIB_EVERY == 0:
			_add_truss(root, z)
		if i % LIGHT_EVERY == 0:
			_add_light(root, z)

func _extrude_ring(st: SurfaceTool, profile: Array, z0: float, z1: float) -> void:
	var n := profile.size() - 1
	for j in range(n):
		var a0 := Vector3(profile[j].x, profile[j].y, z0)
		var b0 := Vector3(profile[j + 1].x, profile[j + 1].y, z0)
		var a1 := Vector3(profile[j].x, profile[j].y, z1)
		var b1 := Vector3(profile[j + 1].x, profile[j + 1].y, z1)
		var ua := float(j) / n
		var ub := float(j + 1) / n
		st.add_uv(Vector2(ua, z0))
		st.add_vertex(a0)
		st.add_uv(Vector2(ub, z0))
		st.add_vertex(b0)
		st.add_uv(Vector2(ub, z1))
		st.add_vertex(b1)
		st.add_uv(Vector2(ua, z0))
		st.add_vertex(a0)
		st.add_uv(Vector2(ub, z1))
		st.add_vertex(b1)
		st.add_uv(Vector2(ua, z1))
		st.add_vertex(a1)

func _add_tunnel_floor(root: Spatial, length: float) -> void:
	_make_box(Vector3(0, -0.1, -length * 0.5), Vector3(TUNNEL_HALF_WIDTH * 2.0, 0.2, length), tunnel_mat, root)
	var tie_count := max(1, int(length / TIE_EVERY))
	for i in range(tie_count):
		var z := -i * (length / tie_count) - 0.3
		_make_box(Vector3(0, 0.03, z), Vector3(TUNNEL_HALF_WIDTH * 1.4, 0.16, 0.35), tie_mat, root)
	for side in [-2.4, 2.4]:
		_make_box(Vector3(side, 0.12, -length * 0.5), Vector3(0.15, 0.1, length), rail_mat, root)

# A real rusted steel truss (two posts + a top crossbeam + a diagonal
# brace) instead of a bare post - the dominant structural motif in real
# industrial subway tunnels.
func _add_truss(root: Spatial, z: float) -> void:
	for side in [-1.0, 1.0]:
		_make_box(Vector3(side * (TUNNEL_HALF_WIDTH + 0.15), TUNNEL_WALL_HEIGHT * 0.5, z), Vector3(0.25, TUNNEL_WALL_HEIGHT, 0.3), rust_mat, root)
	_make_box(Vector3(0, TUNNEL_WALL_HEIGHT - 0.15, z), Vector3((TUNNEL_HALF_WIDTH + 0.15) * 2.0, 0.3, 0.3), rust_mat, root)
	var brace := StaticBody.new()
	var brace_len := sqrt(pow(TUNNEL_HALF_WIDTH, 2) + pow(TUNNEL_WALL_HEIGHT, 2))
	var cube := CubeMesh.new()
	cube.size = Vector3(0.15, brace_len, 0.2)
	var mesh_instance := MeshInstance.new()
	mesh_instance.mesh = cube
	mesh_instance.material_override = rust_mat
	brace.add_child(mesh_instance)
	brace.transform.origin = Vector3(0, TUNNEL_WALL_HEIGHT * 0.5, z)
	brace.rotation.z = atan2(TUNNEL_HALF_WIDTH, TUNNEL_WALL_HEIGHT)
	root.add_child(brace)

func _add_pipes(root: Spatial, length: float) -> void:
	for i in range(PIPE_EVERY):
		var y := TUNNEL_WALL_HEIGHT * 0.3 + i * (TUNNEL_WALL_HEIGHT * 0.35)
		var pipe := StaticBody.new()
		var cyl := CylinderMesh.new()
		cyl.top_radius = 0.18
		cyl.bottom_radius = 0.18
		cyl.height = length
		var mesh_instance := MeshInstance.new()
		mesh_instance.mesh = cyl
		mesh_instance.material_override = pipe_mat
		pipe.add_child(mesh_instance)
		pipe.transform.origin = Vector3(-(TUNNEL_HALF_WIDTH - 0.3), y, -length * 0.5)
		pipe.rotation.x = PI / 2.0
		root.add_child(pipe)

func _add_light(root: Spatial, z: float) -> void:
	_make_box(Vector3(0, TUNNEL_ARCH_HEIGHT - 0.85, z), Vector3(1.2, 0.15, 0.4), rib_mat, root)
	var light := OmniLight.new()
	light.transform.origin = Vector3(0, TUNNEL_ARCH_HEIGHT - 0.95, z)
	light.light_color = Color(0.75, 0.85, 1.0)
	light.light_energy = 0.8
	light.omni_range = 18.0
	root.add_child(light)

# A hollow junction room (floor, ceiling, and walls only on the sides
# without a tunnel) - open on every direction listed in open_dirs so the
# player/train can actually pass through instead of hitting a solid block.
func _build_junction(pos2: Vector2, half: float, open_dirs: Array) -> void:
	var height := TUNNEL_ARCH_HEIGHT
	_make_box(Vector3(pos2.x, TUNNEL_Y - 0.1, pos2.y), Vector3(half * 2.0, 0.2, half * 2.0), tunnel_mat)
	_make_box(Vector3(pos2.x, TUNNEL_Y + height, pos2.y), Vector3(half * 2.0, 0.2, half * 2.0), tunnel_mat)
	for d in CARDINALS:
		if _dirs_contain(open_dirs, d):
			continue
		var wall_pos: Vector3
		var wall_size: Vector3
		if abs(d.y) > 0.5:
			wall_pos = Vector3(pos2.x, TUNNEL_Y + height * 0.5, pos2.y + d.y * half)
			wall_size = Vector3(half * 2.0, height, 0.2)
		else:
			wall_pos = Vector3(pos2.x + d.x * half, TUNNEL_Y + height * 0.5, pos2.y)
			wall_size = Vector3(0.2, height, half * 2.0)
		_make_box(wall_pos, wall_size, tunnel_mat)

func _dirs_contain(dirs: Array, d: Vector2) -> bool:
	for dd in dirs:
		if dd.distance_to(d) < 0.1:
			return true
	return false

func _cap_end(pos2: Vector2, is_front: bool) -> void:
	var z_offset := -STATION_HALF_LENGTH if is_front else STATION_HALF_LENGTH
	var half_w := TUNNEL_HALF_WIDTH + 0.3
	_make_box(Vector3(pos2.x, TUNNEL_Y + TUNNEL_ARCH_HEIGHT * 0.5, pos2.y + z_offset), Vector3(half_w * 2.0, TUNNEL_ARCH_HEIGHT, 0.2), tunnel_mat)

func _make_box(center: Vector3, size: Vector3, mat: SpatialMaterial, parent: Spatial = null) -> void:
	if parent == null:
		parent = self
	var body := StaticBody.new()
	var box := BoxShape.new()
	box.extents = size * 0.5
	var shape := CollisionShape.new()
	shape.shape = box
	body.add_child(shape)
	var cube := CubeMesh.new()
	cube.size = size
	var mesh_instance := MeshInstance.new()
	mesh_instance.mesh = cube
	mesh_instance.material_override = mat
	body.add_child(mesh_instance)
	body.transform.origin = center
	parent.add_child(body)

# Builds one continuous path visiting every station's platform in turn
# via the hub - the train's own ping-pong then keeps retracing the whole
# tour, so it eventually passes through every branch both ways.
func _build_train_tour(train_legs: Array) -> void:
	if train_legs.empty():
		return
	var path2d := []
	for i in range(train_legs.size()):
		var entry = train_legs[i]
		var leg: Array = entry["leg"]
		var station: Vector2 = entry["station"]
		var station_exit: Vector2 = leg[leg.size() - 1]
		var platform_point := station_exit + (station_exit - station).normalized() * 5.0

		for p in leg:
			path2d.append(p)
		path2d.append(platform_point)
		if i < train_legs.size() - 1:
			for j in range(leg.size() - 1, -1, -1):
				path2d.append(leg[j])

	var path3d := []
	for p in path2d:
		path3d.append(Vector3(p.x, TUNNEL_Y + 1.6, p.y))
	_build_train(path3d)

const CAR_WIDTH := 7.8
const CAR_HEIGHT := 6.6
const CAR_LENGTH := 5.0
const CAR_SPACING := 5.4

func _build_train(path3d: Array) -> void:
	if path3d.size() < 2:
		return
	var train := Spatial.new()
	train.set_script(TRAIN_SCRIPT)
	add_child(train)

	for i in range(2):
		var body := MeshInstance.new()
		var cube := CubeMesh.new()
		cube.size = Vector3(CAR_WIDTH, CAR_HEIGHT, CAR_LENGTH)
		body.mesh = cube
		body.material_override = rust_mat
		body.transform.origin = Vector3(0, CAR_HEIGHT * 0.5 + 0.05, CAR_LENGTH * 0.5 + i * CAR_SPACING)
		train.add_child(body)

	var headlight := SpotLight.new()
	headlight.transform.origin = Vector3(0, CAR_HEIGHT * 0.35, -0.3)
	headlight.spot_range = 40.0
	headlight.spot_angle = 35.0
	headlight.light_color = Color(1.0, 0.95, 0.8)
	headlight.light_energy = 1.2
	train.add_child(headlight)

	train.set_path(path3d)
