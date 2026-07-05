extends Spatial
# Abandoned metro station: a surface kiosk with real, walkable stairs
# descending into a sealed concrete pit, and a matching platform room
# placed far below the map (see the Underground node's transform) with
# its own stairs back up - the two halves are connected by MetroTrigger
# teleports rather than continuous collision (see MetroTrigger.gd).
#
# Both staircases are generated here instead of hand-placed in the .tscn
# since they're purely repetitive geometry (same pattern as how World.gd
# generates the ground/grass in code rather than authoring every vertex).

const STAIR_STEPS := 6
const STEP_HEIGHT := 0.35
const STEP_DEPTH := 0.9
const STEP_WIDTH := 3.0
const STEP_START_Z := -2.0

const CONCRETE_COLOR := preload("res://assets/textures/concrete/Color.jpg")
const CONCRETE_NORMAL := preload("res://assets/textures/concrete/NormalGL.jpg")
const CONCRETE_ROUGH := preload("res://assets/textures/concrete/Roughness.jpg")

onready var down_stairs_root: Spatial = $DownStairs
onready var up_stairs_root: Spatial = $Underground/UpStairs

func _ready() -> void:
	_build_stairs(down_stairs_root, -1)
	_build_stairs(up_stairs_root, 1)

# direction -1 = each step lower than the last (surface entrance
# descending into the pit), +1 = each step higher (underground side
# climbing back towards the sealed exit).
func _build_stairs(root: Spatial, direction: int) -> void:
	var mat := SpatialMaterial.new()
	mat.albedo_color = Color(0.68, 0.66, 0.63)
	mat.albedo_texture = CONCRETE_COLOR
	mat.roughness_texture = CONCRETE_ROUGH
	mat.normal_enabled = true
	mat.normal_texture = CONCRETE_NORMAL
	mat.uv1_scale = Vector3(1.5, 1, 1)
	for i in range(STAIR_STEPS):
		var top_y := direction * STEP_HEIGHT * (i + 1)
		var z := STEP_START_Z + i * STEP_DEPTH
		var body := StaticBody.new()
		body.transform.origin = Vector3(0, top_y - STEP_HEIGHT * 0.5, z)
		var box := BoxShape.new()
		box.extents = Vector3(STEP_WIDTH * 0.5, STEP_HEIGHT * 0.5, STEP_DEPTH * 0.5)
		var shape := CollisionShape.new()
		shape.shape = box
		body.add_child(shape)
		var cube := CubeMesh.new()
		cube.size = Vector3(STEP_WIDTH, STEP_HEIGHT, STEP_DEPTH)
		var mesh_instance := MeshInstance.new()
		mesh_instance.mesh = cube
		mesh_instance.material_override = mat
		body.add_child(mesh_instance)
		root.add_child(body)
