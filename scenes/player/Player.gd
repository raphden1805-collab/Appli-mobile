extends KinematicBody
# First-person controller: keyboard/mouse (desktop testing) and touch
# (mobile, driven externally by HUD) both funnel into the same variables,
# so gameplay code never needs to know which input source is active.

signal health_changed(current, max_value)
signal stamina_changed(current, max_value)
signal interact_prompt_changed(prompt_text)
signal build_mode_toggled(is_building, piece_name, cost)
signal tool_changed(tool_name)

const WALK_SPEED := 4.2
const SPRINT_SPEED := 7.0
const JUMP_VELOCITY := 7.5
const GRAVITY := 18.0
const MOUSE_SENSITIVITY := 0.0025
const TOUCH_LOOK_SENSITIVITY := 0.006
const MAX_PITCH := deg2rad(85)
const HARVEST_DAMAGE := 12.0
const HARVEST_RANGE := 3.0
const BUILD_RANGE := 6.0
const GRID_SIZE := 1.0

const BUILD_PIECES := [
	{"name": "Fondation", "scene": preload("res://scenes/building/pieces/Foundation.tscn"), "cost": {"stone": 50}},
	{"name": "Mur", "scene": preload("res://scenes/building/pieces/Wall.tscn"), "cost": {"wood": 100}},
	{"name": "Porte", "scene": preload("res://scenes/building/pieces/Doorframe.tscn"), "cost": {"wood": 50}},
]

onready var head: Spatial = $Head
onready var camera: Camera = $Head/Camera
onready var interact_ray: RayCast = $Head/Camera/InteractRay

var velocity := Vector3.ZERO
var touch_move_vector := Vector2.ZERO

var max_health := 100.0
var health := 100.0
var max_stamina := 100.0
var stamina := 100.0

var build_piece_index := 0
var build_ghost: Spatial = null
var build_rotation_y := 0.0

func _ready() -> void:
	Input.set_mouse_mode(Input.MOUSE_MODE_CAPTURED)
	interact_ray.cast_to = Vector3(0, 0, -HARVEST_RANGE)
	emit_signal("health_changed", health, max_health)
	emit_signal("stamina_changed", stamina, max_stamina)

func _unhandled_input(event: InputEvent) -> void:
	if event is InputEventMouseMotion and Input.get_mouse_mode() == Input.MOUSE_MODE_CAPTURED:
		_apply_look_delta(event.relative * MOUSE_SENSITIVITY)
	if event is InputEventKey and event.pressed and event.scancode == KEY_ESCAPE:
		var captured := Input.get_mouse_mode() == Input.MOUSE_MODE_CAPTURED
		Input.set_mouse_mode(Input.MOUSE_MODE_VISIBLE if captured else Input.MOUSE_MODE_CAPTURED)
	if GameManager.is_inventory_open:
		return
	if event.is_action_pressed("primary_action"):
		harvest_or_fire()
	if event.is_action_pressed("interact"):
		interact()
	if event.is_action_pressed("build_toggle"):
		toggle_build_mode()
	if event.is_action_pressed("build_next"):
		cycle_build_piece()
	if event.is_action_pressed("build_rotate"):
		rotate_build_ghost()

# Called every frame by the touch-look area in HUD.gd with the drag delta
# in pixels, scaled the same way mouse motion is above.
func apply_touch_look(delta_px: Vector2) -> void:
	_apply_look_delta(delta_px * TOUCH_LOOK_SENSITIVITY)

func _apply_look_delta(delta: Vector2) -> void:
	rotate_y(-delta.x)
	head.rotation.x = clamp(head.rotation.x - delta.y, -MAX_PITCH, MAX_PITCH)

# Called every frame by the touch joystick in HUD.gd; x = strafe, y = forward.
func set_touch_move_vector(vector: Vector2) -> void:
	touch_move_vector = vector

func _physics_process(delta: float) -> void:
	_process_movement(delta)
	_process_stamina(delta)
	_process_interaction()
	if GameManager.is_build_mode:
		_process_build_ghost()

func _process_movement(delta: float) -> void:
	var input_vector := Vector2.ZERO
	if not GameManager.is_inventory_open:
		input_vector.x = Input.get_action_strength("move_right") - Input.get_action_strength("move_left")
		input_vector.y = Input.get_action_strength("move_back") - Input.get_action_strength("move_forward")
		input_vector += touch_move_vector
	if input_vector.length() > 1.0:
		input_vector = input_vector.normalized()

	var sprinting := not GameManager.is_inventory_open and Input.is_action_pressed("sprint") and stamina > 0.0
	var speed := SPRINT_SPEED if sprinting else WALK_SPEED

	var direction := (transform.basis.x * input_vector.x + transform.basis.z * input_vector.y)
	velocity.x = direction.x * speed
	velocity.z = direction.z * speed

	if is_on_floor():
		if Input.is_action_just_pressed("jump"):
			velocity.y = JUMP_VELOCITY
		else:
			velocity.y = -0.1
	else:
		velocity.y -= GRAVITY * delta

	velocity = move_and_slide(velocity, Vector3.UP, false, 4, deg2rad(45), false)

func _process_stamina(delta: float) -> void:
	var sprinting := Input.is_action_pressed("sprint") and velocity.length() > 0.1
	if sprinting:
		stamina = max(0.0, stamina - 18.0 * delta)
	else:
		stamina = min(max_stamina, stamina + 10.0 * delta)
	emit_signal("stamina_changed", stamina, max_stamina)

func _process_interaction() -> void:
	if GameManager.is_build_mode:
		return
	if not interact_ray.is_colliding():
		emit_signal("interact_prompt_changed", "")
		return
	var target := interact_ray.get_collider()
	if target and target.has_method("get_interact_prompt"):
		emit_signal("interact_prompt_changed", target.get_interact_prompt())
	else:
		emit_signal("interact_prompt_changed", "")

func harvest_or_fire() -> void:
	if GameManager.is_build_mode:
		_try_place_building()
		return
	if not interact_ray.is_colliding():
		return
	var target := interact_ray.get_collider()
	if target and target.has_method("take_harvest_damage"):
		target.take_harvest_damage(HARVEST_DAMAGE)

func interact() -> void:
	if not interact_ray.is_colliding():
		return
	var target := interact_ray.get_collider()
	if target and target.has_method("interact"):
		target.interact()

func take_damage(amount: float) -> void:
	health = max(0.0, health - amount)
	emit_signal("health_changed", health, max_health)

# --- Building -------------------------------------------------------------

func toggle_build_mode() -> void:
	GameManager.set_build_mode(not GameManager.is_build_mode)
	if GameManager.is_build_mode:
		_spawn_build_ghost()
	else:
		_despawn_build_ghost()
	_emit_build_state()

func cycle_build_piece() -> void:
	build_piece_index = (build_piece_index + 1) % BUILD_PIECES.size()
	_despawn_build_ghost()
	_spawn_build_ghost()
	_emit_build_state()

func rotate_build_ghost() -> void:
	build_rotation_y += PI / 2.0

func _emit_build_state() -> void:
	var piece = BUILD_PIECES[build_piece_index]
	emit_signal("build_mode_toggled", GameManager.is_build_mode, piece["name"], piece["cost"])

func _spawn_build_ghost() -> void:
	var piece = BUILD_PIECES[build_piece_index]
	build_ghost = piece["scene"].instance()
	build_ghost.set_as_ghost()
	get_tree().current_scene.add_child(build_ghost)

func _despawn_build_ghost() -> void:
	if build_ghost:
		build_ghost.queue_free()
		build_ghost = null

func _process_build_ghost() -> void:
	if not build_ghost:
		return
	var from := camera.global_transform.origin
	var to := from + (-camera.global_transform.basis.z) * BUILD_RANGE
	var space_state := get_world().direct_space_state
	var result := space_state.intersect_ray(from, to, [self])
	var target_point: Vector3
	if result:
		target_point = result["position"]
	else:
		target_point = to
	var snapped := Vector3(
		round(target_point.x / GRID_SIZE) * GRID_SIZE,
		round(target_point.y / GRID_SIZE) * GRID_SIZE,
		round(target_point.z / GRID_SIZE) * GRID_SIZE
	)
	build_ghost.global_transform.origin = snapped
	build_ghost.rotation.y = build_rotation_y
	var piece = BUILD_PIECES[build_piece_index]
	var can_afford := true
	for item_name in piece["cost"]:
		if not Inventory.has_amount(item_name, piece["cost"][item_name]):
			can_afford = false
			break
	build_ghost.set_valid(can_afford and result != null)

func _try_place_building() -> void:
	if not build_ghost or not build_ghost.is_valid:
		return
	var piece = BUILD_PIECES[build_piece_index]
	if not Inventory.try_spend(piece["cost"]):
		return
	var placed = piece["scene"].instance()
	get_tree().current_scene.add_child(placed)
	placed.global_transform.origin = build_ghost.global_transform.origin
	placed.rotation.y = build_ghost.rotation.y
	placed.set_as_placed()
