extends Control
# Toggleable inventory screen ("I" key or the touch bag button): a grid
# of slots built at runtime from Inventory.ITEM_INFO, so adding a new
# item type later only means adding one entry there.

onready var grid: GridContainer = $Panel/Margin/VBox/Grid

var slot_labels := {}

func _ready() -> void:
	visible = false
	Inventory.connect("inventory_changed", self, "_on_inventory_changed")
	_build_slots()

func _build_slots() -> void:
	for info in Inventory.ITEM_INFO:
		grid.add_child(_make_slot(info))

func _make_slot(info: Dictionary) -> Control:
	var panel := PanelContainer.new()
	panel.rect_min_size = Vector2(150, 110)

	var vbox := VBoxContainer.new()
	vbox.alignment = BoxContainer.ALIGN_CENTER
	panel.add_child(vbox)

	var icon_wrap := CenterContainer.new()
	vbox.add_child(icon_wrap)
	var icon := ColorRect.new()
	icon.rect_min_size = Vector2(40, 40)
	icon.color = info["color"]
	icon_wrap.add_child(icon)

	var name_label := Label.new()
	name_label.text = info["label"]
	name_label.align = Label.ALIGN_CENTER
	vbox.add_child(name_label)

	var count_label := Label.new()
	count_label.name = "Count"
	count_label.align = Label.ALIGN_CENTER
	count_label.text = str(Inventory.get_amount(info["key"]))
	vbox.add_child(count_label)

	slot_labels[info["key"]] = count_label
	return panel

func _on_inventory_changed(item_name, new_amount) -> void:
	if slot_labels.has(item_name):
		slot_labels[item_name].text = str(new_amount)

func _unhandled_input(event: InputEvent) -> void:
	if event.is_action_pressed("inventory_toggle"):
		toggle()

func toggle() -> void:
	set_open(not visible)

func set_open(open: bool) -> void:
	visible = open
	GameManager.set_inventory_open(open)
	Input.set_mouse_mode(Input.MOUSE_MODE_VISIBLE if open else Input.MOUSE_MODE_CAPTURED)

func _on_close_pressed() -> void:
	set_open(false)
