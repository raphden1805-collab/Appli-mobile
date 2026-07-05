extends Spatial
# Connects every abandoned metro station's platform room (see
# AbandonedMetro.tscn, which now opens on both ends instead of being a
# sealed box) into one underground network of arched tunnels, plus a
# train that runs back and forth through it - real underground traffic
# spanning the map instead of isolated rooms.
#
# Stations are chained in X order; each connection is a simple 3-segment
# "dogleg" (out along Z, across along X, back along Z) so every tunnel
# piece is a straight, axis-aligned extrusion - no need to handle curves.

const TUNNEL_Y := -40.0
const TUNNEL_HALF_WIDTH := 2.0
const TUNNEL_WALL_HEIGHT := 2.0
const TUNNEL_ARCH_HEIGHT := 3.5
const STATION_HALF_LENGTH := 10.0
const SEGMENT_LENGTH := 5.0
const RIB_EVERY := 4
const LIGHT_EVERY := 6

const CONCRETE_COLOR := preload("res://assets/textures/concrete/Color.jpg")
const CONCRETE_NORMAL := preload("res://assets/textures/concrete/NormalGL.jpg")
const CONCRETE_ROUGH := preload("res://assets/textures/concrete/Roughness.jpg")
const METAL_COLOR := preload("res://assets/textures/metal/Color.jpg")
const METAL_NORMAL := preload("res://assets/textures/metal/NormalGL.jpg")
const METAL_ROUGH := preload("res://assets/textures/metal/Roughness.jpg")
const TRAIN_SCRIPT := preload("res://scenes/world/MetroTrain.gd")

var tunnel_mat: SpatialMaterial
var rib_mat: SpatialMaterial
var rail_mat: SpatialMaterial
var rust_mat: SpatialMaterial

func build(station_positions: Array) -> void:
	_init_materials()
	if station_positions.size() == 0:
		return
	if station_positions.size() == 1:
		_cap_end(station_positions[0], true)
		_cap_end(station_positions[0], false)
		return

	var path := [station_positions[0]]
	for i in range(station_positions.size() - 1):
		var a: Vector2 = station_positions[i]
		var b: Vector2 = station_positions[i + 1]
		var exit_a := a + Vector2(0, STATION_HALF_LENGTH)
		var entry_b := b + Vector2(0, -STATION_HALF_LENGTH)
		var mid_z := (exit_a.y + entry_b.y) * 0.5
		var corner1 := Vector2(exit_a.x, mid_z)
		var corner2 := Vector2(entry_b.x, mid_z)
		_build_straight(exit_a, corner1)
		_build_corner(corner1)
		_build_straight(corner1, corner2)
		_build_corner(corner2)
		_build_straight(corner2, entry_b)
		path.append(exit_a)
		path.append(corner1)
		path.append(corner2)
		path.append(entry_b)
		path.append(b)

	_cap_end(station_positions[0], true)
	_cap_end(station_positions[station_positions.size() - 1], false)

	var path3d := []
	for p in path:
		path3d.append(Vector3(p.x, TUNNEL_Y + 1.6, p.y))
	_build_train(path3d)

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

	for i in range(segments + 1):
		var z := -i * seg_len
		if i % RIB_EVERY == 0:
			_add_rib(root, z)
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
	var body := StaticBody.new()
	var box := BoxShape.new()
	box.extents = Vector3(TUNNEL_HALF_WIDTH, 0.1, length * 0.5)
	var shape := CollisionShape.new()
	shape.shape = box
	body.add_child(shape)
	var cube := CubeMesh.new()
	cube.size = Vector3(TUNNEL_HALF_WIDTH * 2.0, 0.2, length)
	var mesh_instance := MeshInstance.new()
	mesh_instance.mesh = cube
	mesh_instance.material_override = tunnel_mat
	body.add_child(mesh_instance)
	body.transform.origin = Vector3(0, -0.1, -length * 0.5)
	root.add_child(body)

	for side in [-0.8, 0.8]:
		var rail := StaticBody.new()
		var rbox := BoxShape.new()
		rbox.extents = Vector3(0.075, 0.05, length * 0.5)
		var rshape := CollisionShape.new()
		rshape.shape = rbox
		rail.add_child(rshape)
		var rcube := CubeMesh.new()
		rcube.size = Vector3(0.15, 0.1, length)
		var rmesh := MeshInstance.new()
		rmesh.mesh = rcube
		rmesh.material_override = rail_mat
		rail.add_child(rmesh)
		rail.transform.origin = Vector3(side, 0.05, -length * 0.5)
		root.add_child(rail)

func _add_rib(root: Spatial, z: float) -> void:
	for side in [-1.0, 1.0]:
		var body := StaticBody.new()
		var box := BoxShape.new()
		box.extents = Vector3(0.1, TUNNEL_WALL_HEIGHT * 0.5, 0.15)
		var shape := CollisionShape.new()
		shape.shape = box
		body.add_child(shape)
		var cube := CubeMesh.new()
		cube.size = Vector3(0.2, TUNNEL_WALL_HEIGHT, 0.3)
		var mesh_instance := MeshInstance.new()
		mesh_instance.mesh = cube
		mesh_instance.material_override = rib_mat
		body.add_child(mesh_instance)
		body.transform.origin = Vector3(side * (TUNNEL_HALF_WIDTH + 0.05), TUNNEL_WALL_HEIGHT * 0.5, z)
		root.add_child(body)

func _add_light(root: Spatial, z: float) -> void:
	var light := OmniLight.new()
	light.transform.origin = Vector3(0, TUNNEL_ARCH_HEIGHT - 0.3, z)
	light.light_color = Color(0.85, 0.75, 0.55)
	light.light_energy = 0.55
	light.omni_range = 9.0
	root.add_child(light)

func _build_corner(pos2: Vector2) -> void:
	var half := TUNNEL_HALF_WIDTH + 0.3
	var body := StaticBody.new()
	var box := BoxShape.new()
	box.extents = Vector3(half, TUNNEL_ARCH_HEIGHT * 0.5, half)
	var shape := CollisionShape.new()
	shape.shape = box
	body.add_child(shape)
	var cube := CubeMesh.new()
	cube.size = Vector3(half * 2.0, TUNNEL_ARCH_HEIGHT, half * 2.0)
	var mesh_instance := MeshInstance.new()
	mesh_instance.mesh = cube
	mesh_instance.material_override = tunnel_mat
	body.add_child(mesh_instance)
	body.transform.origin = Vector3(pos2.x, TUNNEL_Y + TUNNEL_ARCH_HEIGHT * 0.5, pos2.y)
	add_child(body)

func _cap_end(pos2: Vector2, is_front: bool) -> void:
	var z_offset := -STATION_HALF_LENGTH if is_front else STATION_HALF_LENGTH
	var half_w := TUNNEL_HALF_WIDTH + 0.1
	var body := StaticBody.new()
	var box := BoxShape.new()
	box.extents = Vector3(half_w, TUNNEL_ARCH_HEIGHT * 0.5, 0.1)
	var shape := CollisionShape.new()
	shape.shape = box
	body.add_child(shape)
	var cube := CubeMesh.new()
	cube.size = Vector3(half_w * 2.0, TUNNEL_ARCH_HEIGHT, 0.2)
	var mesh_instance := MeshInstance.new()
	mesh_instance.mesh = cube
	mesh_instance.material_override = tunnel_mat
	body.add_child(mesh_instance)
	body.transform.origin = Vector3(pos2.x, TUNNEL_Y + TUNNEL_ARCH_HEIGHT * 0.5, pos2.y + z_offset)
	add_child(body)

func _build_train(path3d: Array) -> void:
	if path3d.size() < 2:
		return
	var train := Spatial.new()
	train.set_script(TRAIN_SCRIPT)
	add_child(train)

	for i in range(2):
		var body := MeshInstance.new()
		var cube := CubeMesh.new()
		cube.size = Vector3(2.6, 2.2, 3.6)
		body.mesh = cube
		body.material_override = rust_mat
		body.transform.origin = Vector3(0, 1.1, 2.0 + i * 3.8)
		train.add_child(body)

	var headlight := SpotLight.new()
	headlight.transform.origin = Vector3(0, 1.3, -1.7)
	headlight.spot_range = 14.0
	headlight.spot_angle = 35.0
	headlight.light_color = Color(1.0, 0.95, 0.8)
	headlight.light_energy = 1.2
	train.add_child(headlight)

	train.set_path(path3d)
