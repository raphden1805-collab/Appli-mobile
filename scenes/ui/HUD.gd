extends CanvasLayer
# Wires the touch controls (joystick, look-drag area, action buttons) and
# the on-screen readouts (health, stamina, inventory, interact prompt,
# build panel) to whichever Player instance Main.gd hands it.

var player = null

onready var joystick: Control = $Controls/MoveJoystick
onready var look_area: Control = $Controls/LookArea
onready var minimap = $Minimap
onready var health_bar: ProgressBar = $Vitals/HealthBar
onready var stamina_bar: ProgressBar = $Vitals/StaminaBar
onready var inventory_label: Label = $ResourceCounter/InventoryLabel
onready var interact_label: Label = $InteractPrompt
onready var build_panel: Control = $BuildPanel
onready var build_piece_label: Label = $BuildPanel/PieceLabel
onready var jump_button: Button = $Controls/JumpButton
onready var sprint_button: Button = $Controls/SprintButton
onready var harvest_button: Button = $Controls/HarvestButton
onready var interact_button: Button = $Controls/InteractButton
onready var build_toggle_button: Button = $Controls/BuildToggleButton
onready var build_next_button: Button = $BuildPanel/PieceButtons/NextButton
onready var build_rotate_button: Button = $BuildPanel/PieceButtons/RotateButton
onready var inventory_button: Button = $Controls/InventoryButton
onready var inventory_panel = $InventoryPanel

func _ready() -> void:
	jump_button.connect("button_down", self, "_on_jump_down")
	jump_button.connect("button_up", self, "_on_jump_up")
	sprint_button.connect("button_down", self, "_on_sprint_down")
	sprint_button.connect("button_up", self, "_on_sprint_up")
	harvest_button.connect("pressed", self, "_on_harvest_pressed")
	interact_button.connect("pressed", self, "_on_interact_pressed")
	build_toggle_button.connect("pressed", self, "_on_build_toggle_pressed")
	build_next_button.connect("pressed", self, "_on_build_next_pressed")
	build_rotate_button.connect("pressed", self, "_on_build_rotate_pressed")
	inventory_button.connect("pressed", self, "_on_inventory_button_pressed")
	build_panel.visible = false
	interact_label.text = ""
	Inventory.connect("inventory_changed", self, "_on_inventory_changed")
	_refresh_inventory_label()

func set_player(p) -> void:
	player = p
	minimap.player = p
	player.connect("health_changed", self, "_on_health_changed")
	player.connect("stamina_changed", self, "_on_stamina_changed")
	player.connect("interact_prompt_changed", self, "_on_interact_prompt_changed")
	player.connect("build_mode_toggled", self, "_on_build_mode_toggled")

func _process(_delta: float) -> void:
	if not player:
		return
	if GameManager.is_inventory_open:
		return
	player.set_touch_move_vector(joystick.output_vector)
	var look_delta: Vector2 = look_area.consume_delta()
	if look_delta != Vector2.ZERO:
		player.apply_touch_look(look_delta)

func _on_jump_down() -> void:
	Input.action_press("jump")

func _on_jump_up() -> void:
	Input.action_release("jump")

func _on_sprint_down() -> void:
	Input.action_press("sprint")

func _on_sprint_up() -> void:
	Input.action_release("sprint")

func _on_health_changed(current, max_value) -> void:
	health_bar.max_value = max_value
	health_bar.value = current

func _on_stamina_changed(current, max_value) -> void:
	stamina_bar.max_value = max_value
	stamina_bar.value = current

func _on_inventory_changed(_item_name, _new_amount) -> void:
	_refresh_inventory_label()

func _refresh_inventory_label() -> void:
	inventory_label.text = "Bois: %d   Pierre: %d   Metal: %d" % [
		Inventory.get_amount("wood"), Inventory.get_amount("stone"), Inventory.get_amount("metal")
	]

func _on_interact_prompt_changed(prompt_text) -> void:
	interact_label.text = prompt_text

func _on_build_mode_toggled(is_building, piece_name, cost) -> void:
	build_panel.visible = is_building
	build_toggle_button.pressed = is_building
	if is_building:
		_set_build_label(piece_name, cost)

func _set_build_label(piece_name, cost) -> void:
	var cost_parts := []
	for item_name in cost:
		cost_parts.append("%d %s" % [cost[item_name], item_name])
	build_piece_label.text = "%s (%s)" % [piece_name, ", ".join(cost_parts)]

func _on_harvest_pressed() -> void:
	player.harvest_or_fire()

func _on_interact_pressed() -> void:
	player.interact()

func _on_build_toggle_pressed() -> void:
	player.toggle_build_mode()

func _on_build_next_pressed() -> void:
	player.cycle_build_piece()
	var piece = player.BUILD_PIECES[player.build_piece_index]
	_set_build_label(piece["name"], piece["cost"])

func _on_build_rotate_pressed() -> void:
	player.rotate_build_ghost()

func _on_inventory_button_pressed() -> void:
	inventory_panel.toggle()
