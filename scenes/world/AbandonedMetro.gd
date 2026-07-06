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

const STAIR_STEPS := 6
const STEP_HEIGHT := 0.35
const STEP_DEPTH := 0.9
const STEP_WIDTH := 3.0
const STEP_START_Z := -2.0

const TRACK_HALF_WIDTH := 6.0
const PLATFORM_WIDTH := 4.2
const ROOM_HALF_WIDTH := TRACK_HALF_WIDTH + PLATFORM_WIDTH
const ROOM_HALF_LENGTH := 10.0
const ROOM_HEIGHT := 10.2
const PLATFORM_HEIGHT := 1.0

const CONCRETE_COLOR := preload("res://assets/textures/concrete/Color.jpg")
const CONCRETE_NORMAL := preload("res://assets/textures/concrete/NormalGL.jpg")
const CONCRETE_ROUGH := preload("res://assets/textures/concrete/Roughness.jpg")
const METAL_COLOR := preload("res://assets/textures/metal/Color.jpg")
const METAL_NORMAL := preload("res://assets/textures/metal/NormalGL.jpg")
const METAL_ROUGH := preload("res://assets/textures/metal/Roughness.jpg")

onready var down_stairs_root: Spatial = $DownStairs
onready var up_stairs_root: Spatial = $Underground/UpStairs
onready var underground_root: Spatial = $Underground

var _concrete_mat: SpatialMaterial
var _platform_mat: SpatialMaterial
var _rail_mat: SpatialMaterial

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
		_make_box(underground_root, Vector3(2.4 * side, 0.05, 0), Vector3(0.15, 0.1, ROOM_HALF_LENGTH * 2.0), _rail_mat)
		for z_end in [-ROOM_HALF_LENGTH, ROOM_HALF_LENGTH]:
			_make_box(underground_root, Vector3(side * (TRACK_HALF_WIDTH + PLATFORM_WIDTH * 0.5), ROOM_HEIGHT * 0.5, z_end), Vector3(PLATFORM_WIDTH, ROOM_HEIGHT, 0.2), _concrete_mat)

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
