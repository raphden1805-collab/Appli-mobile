extends Spatial
# Abandoned metro station: a surface kiosk with real, walkable stairs
# descending into a sealed concrete pit, and a matching platform room
# placed far below the map (see the Underground node's transform) with
# its own stairs back up - the two halves are connected by MetroTrigger
# teleports rather than continuous collision (see MetroTrigger.gd).
#
# The underground room's floor/ceiling/walls/platform/rails are also
# built here in code rather than hand-placed in the .tscn, since it's
# repetitive geometry (same pattern as how World.gd generates the
# ground/grass procedurally). TRACK_HALF_WIDTH must match
# MetroNetwork.TUNNEL_HALF_WIDTH so the room's track bed lines up with
# the tunnels MetroNetwork attaches to its open ends.
#
# UndergroundEntryMarker (in the .tscn) sits on the platform, not the
# recessed track - the platform is a solid raised block with a sheer
# face and no ramp, so teleporting onto the track left the player unable
# to reach the platform without clipping through it. Its Y is
# PLATFORM_HEIGHT - 0.5, not PLATFORM_HEIGHT: verified empirically that
# this KinematicBody always settles exactly 0.5 below a surface's true
# top after a scripted teleport (regardless of clearance above it),
# so placing it "on" the surface at its literal height leaves the
# player embedded up to the waist once physics settles.

const STAIR_STEPS := 6
const STEP_HEIGHT := 0.35
const STEP_DEPTH := 0.9
const STEP_WIDTH := 3.0
const STEP_START_Z := -2.0

const TRACK_HALF_WIDTH := 6.0
const PLATFORM_WIDTH := 4.2
const ROOM_HALF_WIDTH := TRACK_HALF_WIDTH + PLATFORM_WIDTH
# Longer than before (was 10.0) for a grander, multi-level hall rather
# than a compact platform - must match MetroNetwork.STATION_HALF_LENGTH,
# since that's where the tunnel/cap attaches to this room's open end.
const ROOM_HALF_LENGTH := 14.0
const ROOM_HEIGHT := 10.2
const PLATFORM_HEIGHT := 1.0

# A raised mezzanine (catwalk overlooking the tracks, reached by stairs)
# along the +X platform, echoing the multi-level industrial-complex feel
# of the reference photos rather than a single flat platform.
const MEZZ_Y := 4.0
const MEZZ_THICKNESS := 0.3
const MEZZ_X_INNER := TRACK_HALF_WIDTH + 1.0
const MEZZ_X_OUTER := ROOM_HALF_WIDTH - 0.5
const MEZZ_Z_HALF := 7.0
const MEZZ_RAIL_HEIGHT := 0.9

const CONCRETE_COLOR := preload("res://assets/textures/concrete/Color.jpg")
const CONCRETE_NORMAL := preload("res://assets/textures/concrete/NormalGL.jpg")
const CONCRETE_ROUGH := preload("res://assets/textures/concrete/Roughness.jpg")
const METAL_COLOR := preload("res://assets/textures/metal/Color.jpg")
const METAL_NORMAL := preload("res://assets/textures/metal/NormalGL.jpg")
const METAL_ROUGH := preload("res://assets/textures/metal/Roughness.jpg")
const WOOD_COLOR := preload("res://assets/textures/wood/Color.jpg")
const WOOD_NORMAL := preload("res://assets/textures/wood/NormalGL.jpg")
const WOOD_ROUGH := preload("res://assets/textures/wood/Roughness.jpg")

const TIE_EVERY := 1.4

onready var down_stairs_root: Spatial = $DownStairs
onready var up_stairs_root: Spatial = $Underground/UpStairs
onready var underground_root: Spatial = $Underground

var _concrete_mat: SpatialMaterial
var _platform_mat: SpatialMaterial
var _rail_mat: SpatialMaterial
var _tie_mat: SpatialMaterial
var _rust_mat: SpatialMaterial
var _pipe_mat: SpatialMaterial
var _tarp_mat: SpatialMaterial
var _rail_guard_mat: SpatialMaterial
var _machine_mat: SpatialMaterial

func _ready() -> void:
	_init_materials()
	_build_stairs(down_stairs_root, -1)
	_build_stairs(up_stairs_root, 1)
	_build_room()

func _init_materials() -> void:
	_concrete_mat = SpatialMaterial.new()
	_concrete_mat.albedo_color = Color(0.68, 0.66, 0.63)
	_concrete_mat.albedo_texture = CONCRETE_COLOR
	_concrete_mat.roughness_texture = CONCRETE_ROUGH
	_concrete_mat.normal_enabled = true
	_concrete_mat.normal_texture = CONCRETE_NORMAL
	_concrete_mat.uv1_scale = Vector3(1.5, 1, 1)

	_platform_mat = SpatialMaterial.new()
	_platform_mat.albedo_color = Color(0.6, 0.58, 0.55)
	_platform_mat.albedo_texture = CONCRETE_COLOR
	_platform_mat.roughness_texture = CONCRETE_ROUGH
	_platform_mat.normal_enabled = true
	_platform_mat.normal_texture = CONCRETE_NORMAL
	_platform_mat.uv1_scale = Vector3(1, 1.5, 1)

	_rail_mat = SpatialMaterial.new()
	_rail_mat.albedo_color = Color(0.5, 0.5, 0.53)
	_rail_mat.albedo_texture = METAL_COLOR
	_rail_mat.metallic = 0.6
	_rail_mat.roughness = 0.4
	_rail_mat.roughness_texture = METAL_ROUGH
	_rail_mat.normal_enabled = true
	_rail_mat.normal_texture = METAL_NORMAL

	_tie_mat = SpatialMaterial.new()
	_tie_mat.albedo_color = Color(0.22, 0.16, 0.12)
	_tie_mat.albedo_texture = WOOD_COLOR
	_tie_mat.roughness = 0.95
	_tie_mat.roughness_texture = WOOD_ROUGH
	_tie_mat.normal_enabled = true
	_tie_mat.normal_texture = WOOD_NORMAL

	_rust_mat = SpatialMaterial.new()
	_rust_mat.albedo_color = Color(0.5, 0.32, 0.22)
	_rust_mat.albedo_texture = METAL_COLOR
	_rust_mat.metallic = 0.3
	_rust_mat.roughness = 0.8
	_rust_mat.roughness_texture = METAL_ROUGH
	_rust_mat.normal_enabled = true
	_rust_mat.normal_texture = METAL_NORMAL

	_pipe_mat = SpatialMaterial.new()
	_pipe_mat.albedo_color = Color(0.35, 0.16, 0.12)
	_pipe_mat.albedo_texture = METAL_COLOR
	_pipe_mat.metallic = 0.5
	_pipe_mat.roughness = 0.6
	_pipe_mat.roughness_texture = METAL_ROUGH
	_pipe_mat.normal_enabled = true
	_pipe_mat.normal_texture = METAL_NORMAL

	_tarp_mat = SpatialMaterial.new()
	_tarp_mat.albedo_color = Color(0.14, 0.18, 0.13)
	_tarp_mat.roughness = 0.85

	# Bright safety-red guardrail, matching the reference photos' distinct
	# red mezzanine railings against the grey concrete/rust everything else.
	_rail_guard_mat = SpatialMaterial.new()
	_rail_guard_mat.albedo_color = Color(0.55, 0.08, 0.05)
	_rail_guard_mat.metallic = 0.2
	_rail_guard_mat.roughness = 0.5

	_machine_mat = SpatialMaterial.new()
	_machine_mat.albedo_color = Color(0.55, 0.42, 0.05)
	_machine_mat.albedo_texture = METAL_COLOR
	_machine_mat.metallic = 0.4
	_machine_mat.roughness = 0.6
	_machine_mat.roughness_texture = METAL_ROUGH
	_machine_mat.normal_enabled = true
	_machine_mat.normal_texture = METAL_NORMAL

# direction -1 = each step lower than the last (surface entrance
# descending into the pit), +1 = each step higher (underground side
# climbing back towards the sealed exit).
func _build_stairs(root: Spatial, direction: int) -> void:
	for i in range(STAIR_STEPS):
		var top_y := direction * STEP_HEIGHT * (i + 1)
		var z := STEP_START_Z + i * STEP_DEPTH
		_make_box(root, Vector3(0, top_y - STEP_HEIGHT * 0.5, z), Vector3(STEP_WIDTH, STEP_HEIGHT, STEP_DEPTH), _concrete_mat)

# A real subway platform: a flat track bed (with rails) flanked by a
# raised, walkable platform on each side, enclosed by a room whose ends
# are only open across the track-width gap (MetroNetwork either
# continues a tunnel through that gap or plugs it with a matching cap) -
# the platform itself always ends in a wall, exactly like a real station.
func _build_room() -> void:
	_make_box(underground_root, Vector3(0, -0.1, 0), Vector3(ROOM_HALF_WIDTH * 2.0, 0.2, ROOM_HALF_LENGTH * 2.0), _concrete_mat)
	_make_box(underground_root, Vector3(0, ROOM_HEIGHT, 0), Vector3(ROOM_HALF_WIDTH * 2.0, 0.2, ROOM_HALF_LENGTH * 2.0), _concrete_mat)
	for side in [-1.0, 1.0]:
		_make_box(underground_root, Vector3(side * (ROOM_HALF_WIDTH + 0.3), ROOM_HEIGHT * 0.5, 0), Vector3(0.2, ROOM_HEIGHT, ROOM_HALF_LENGTH * 2.0), _concrete_mat)
		_make_box(underground_root, Vector3(side * (TRACK_HALF_WIDTH + PLATFORM_WIDTH * 0.5), PLATFORM_HEIGHT * 0.5, 0), Vector3(PLATFORM_WIDTH, PLATFORM_HEIGHT, ROOM_HALF_LENGTH * 2.0), _platform_mat)
		_make_box(underground_root, Vector3(2.4 * side, 0.12, 0), Vector3(0.15, 0.1, ROOM_HALF_LENGTH * 2.0), _rail_mat)
		for z_end in [-ROOM_HALF_LENGTH, ROOM_HALF_LENGTH]:
			_make_box(underground_root, Vector3(side * (TRACK_HALF_WIDTH + PLATFORM_WIDTH * 0.5), ROOM_HEIGHT * 0.5, z_end), Vector3(PLATFORM_WIDTH, ROOM_HEIGHT, 0.2), _concrete_mat)

	var tie_count := int(ROOM_HALF_LENGTH * 2.0 / TIE_EVERY)
	for i in range(tie_count):
		var z := -ROOM_HALF_LENGTH + i * TIE_EVERY + 0.3
		_make_box(underground_root, Vector3(0, 0.03, z), Vector3(TRACK_HALF_WIDTH * 1.4, 0.16, 0.35), _tie_mat)

	_build_trusses()
	_build_pipes()
	_build_fixture_lights()
	_build_clutter()
	_build_mezzanine()
	_build_forklift()

# Rusted steel trusses along the platform edge - the dominant structural
# motif in real industrial subway stations - instead of bare concrete.
func _build_trusses() -> void:
	var truss_height := ROOM_HEIGHT
	for z in [-6.0, 0.0, 6.0]:
		for side in [-1.0, 1.0]:
			var x = side * (ROOM_HALF_WIDTH - 0.2)
			_make_box(underground_root, Vector3(x, truss_height * 0.5, z), Vector3(0.3, truss_height, 0.3), _rust_mat)
			_make_box(underground_root, Vector3(x - side * 0.7, truss_height - 0.2, z), Vector3(1.4, 0.3, 0.3), _rust_mat)

func _build_pipes() -> void:
	for side in [-1.0, 1.0]:
		var pipe := StaticBody.new()
		var cyl := CylinderMesh.new()
		cyl.top_radius = 0.2
		cyl.bottom_radius = 0.2
		cyl.height = ROOM_HALF_LENGTH * 2.0
		var mesh_instance := MeshInstance.new()
		mesh_instance.mesh = cyl
		mesh_instance.material_override = _pipe_mat
		pipe.add_child(mesh_instance)
		pipe.transform.origin = Vector3(side * (ROOM_HALF_WIDTH - 0.5), ROOM_HEIGHT - 1.0, 0)
		pipe.rotation.x = PI / 2.0
		underground_root.add_child(pipe)

func _build_fixture_lights() -> void:
	for z in [-5.0, 4.0]:
		_make_box(underground_root, Vector3(0, ROOM_HEIGHT - 0.3, z), Vector3(1.4, 0.15, 0.4), _rust_mat)

# A few extra scattered props (barrel, tarp-covered pile) beyond the
# existing loot crates, for the cluttered-abandoned-station look.
func _build_clutter() -> void:
	var barrel := StaticBody.new()
	var cyl := CylinderMesh.new()
	cyl.top_radius = 0.5
	cyl.bottom_radius = 0.5
	cyl.height = 1.1
	var barrel_shape := CylinderShape.new()
	barrel_shape.radius = 0.5
	barrel_shape.height = 1.1
	var shape := CollisionShape.new()
	shape.shape = barrel_shape
	barrel.add_child(shape)
	var mesh_instance := MeshInstance.new()
	mesh_instance.mesh = cyl
	mesh_instance.material_override = _rust_mat
	barrel.add_child(mesh_instance)
	barrel.transform.origin = Vector3(TRACK_HALF_WIDTH + 1.8, PLATFORM_HEIGHT + 0.6, 11.0)
	underground_root.add_child(barrel)

	_make_box(underground_root, Vector3(-(TRACK_HALF_WIDTH + 1.8), PLATFORM_HEIGHT + 0.25, 6.5), Vector3(2.2, 0.5, 1.6), _tarp_mat)

# A raised catwalk overlooking the tracks with a red guardrail, reached
# by a full-width staircase from the platform - the reference's biggest
# "grand industrial complex" cue we were missing (a single flat platform
# reads much smaller than a multi-level station).
func _build_mezzanine() -> void:
	var floor_x := (MEZZ_X_INNER + MEZZ_X_OUTER) * 0.5
	var floor_width := MEZZ_X_OUTER - MEZZ_X_INNER
	_make_box(underground_root, Vector3(floor_x, MEZZ_Y - MEZZ_THICKNESS * 0.5, 0), Vector3(floor_width, MEZZ_THICKNESS, MEZZ_Z_HALF * 2.0), _concrete_mat)

	_make_box(underground_root, Vector3(MEZZ_X_INNER, MEZZ_Y + MEZZ_RAIL_HEIGHT * 0.5, 0), Vector3(0.08, MEZZ_RAIL_HEIGHT, MEZZ_Z_HALF * 2.0), _rail_guard_mat)
	var post_count := int(MEZZ_Z_HALF * 2.0 / 2.0)
	for i in range(post_count + 1):
		var z := -MEZZ_Z_HALF + i * 2.0
		_make_box(underground_root, Vector3(MEZZ_X_INNER, MEZZ_Y + MEZZ_RAIL_HEIGHT * 0.5, z), Vector3(0.14, MEZZ_RAIL_HEIGHT, 0.14), _rail_guard_mat)

	# Full-width stair from the platform up to the mezzanine's front edge.
	var steps := 8
	var stair_z_start := -MEZZ_Z_HALF - 2.5
	var step_depth := 2.5 / steps
	var step_height := (MEZZ_Y - PLATFORM_HEIGHT) / steps
	for i in range(steps):
		var top_y := PLATFORM_HEIGHT + step_height * (i + 1)
		var z := stair_z_start + i * step_depth
		_make_box(underground_root, Vector3(floor_x, top_y - step_height * 0.5, z + step_depth * 0.5), Vector3(floor_width, step_height, step_depth), _concrete_mat)

# A simple boxy forklift (body, mast, forks) for extra industrial-clutter
# flavor - not a real model, but reads fine as a low-poly prop at a glance.
func _build_forklift() -> void:
	var x := -(TRACK_HALF_WIDTH + 2.2)
	var z := 2.0
	_make_box(underground_root, Vector3(x, PLATFORM_HEIGHT + 0.6, z), Vector3(1.3, 1.2, 2.0), _machine_mat)
	_make_box(underground_root, Vector3(x, PLATFORM_HEIGHT + 1.5, z + 0.9), Vector3(1.1, 0.6, 0.3), _machine_mat)
	_make_box(underground_root, Vector3(x, PLATFORM_HEIGHT + 1.1, z - 1.1), Vector3(0.15, 2.2, 0.15), _rust_mat)
	for side in [-0.35, 0.35]:
		_make_box(underground_root, Vector3(x + side, PLATFORM_HEIGHT + 0.15, z - 1.9), Vector3(0.2, 0.1, 1.1), _rust_mat)

func _make_box(parent: Spatial, center: Vector3, size: Vector3, mat: SpatialMaterial) -> void:
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
