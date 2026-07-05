extends StaticBody
# Shared behaviour for every building piece (foundation, wall, doorframe).
# The same scene is used both as a translucent placement "ghost" that
# follows the build raycast and, once confirmed, as the real placed piece.
# Doorframe additionally wires up door_pivot/door_collision for the
# interact-to-open behaviour; other pieces just leave those paths empty.

export(NodePath) var door_pivot_path
export(NodePath) var door_collision_path

var is_ghost := false
var is_valid := false
var is_door_open := false

var mesh_instances := []
var door_pivot: Spatial
var door_collision: CollisionShape

func _ready() -> void:
	_collect_mesh_instances(self)
	if door_pivot_path != NodePath():
		door_pivot = get_node(door_pivot_path)
	if door_collision_path != NodePath():
		door_collision = get_node(door_collision_path)

func _collect_mesh_instances(node: Node) -> void:
	for child in node.get_children():
		if child is MeshInstance:
			mesh_instances.append(child)
		if child.get_child_count() > 0:
			_collect_mesh_instances(child)

func get_interact_prompt() -> String:
	if door_pivot:
		return "Fermer la porte" if is_door_open else "Ouvrir la porte"
	return ""

func interact() -> void:
	if not door_pivot:
		return
	is_door_open = not is_door_open
	var target_deg := -100.0 if is_door_open else 0.0
	var tween := get_node_or_null("DoorTween")
	if not tween:
		tween = Tween.new()
		tween.name = "DoorTween"
		add_child(tween)
	tween.interpolate_property(door_pivot, "rotation:y", door_pivot.rotation.y,
		deg2rad(target_deg), 0.35, Tween.TRANS_SINE, Tween.EASE_OUT)
	tween.start()
	if door_collision:
		door_collision.disabled = is_door_open

func set_as_ghost() -> void:
	is_ghost = true
	collision_layer = 0
	collision_mask = 0
	for m in mesh_instances:
		m.material_override = _ghost_material(false)

func set_valid(valid: bool) -> void:
	is_valid = valid
	for m in mesh_instances:
		m.material_override = _ghost_material(valid)

func set_as_placed() -> void:
	is_ghost = false
	collision_layer = 4
	collision_mask = 1
	add_to_group("base_pieces")
	for m in mesh_instances:
		m.material_override = null

func _ghost_material(valid: bool) -> SpatialMaterial:
	var mat := SpatialMaterial.new()
	mat.flags_transparent = true
	mat.albedo_color = Color(0.2, 1.0, 0.3, 0.4) if valid else Color(1.0, 0.2, 0.2, 0.4)
	return mat
