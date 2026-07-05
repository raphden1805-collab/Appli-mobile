extends Control
# Left-side virtual joystick for movement. Handles raw touch events
# directly (rather than relying on mouse emulation) so it can track its
# own finger independently of the look-drag area on the other side of
# the screen, allowing simultaneous move+look on a real touchscreen.

export(float) var max_radius := 60.0

var output_vector := Vector2.ZERO

var _touch_index := -1
var _base_center := Vector2.ZERO

func _ready() -> void:
	_base_center = rect_size / 2.0
	mouse_filter = Control.MOUSE_FILTER_IGNORE

func _input(event: InputEvent) -> void:
	if event is InputEventScreenTouch:
		if event.pressed:
			if _touch_index == -1 and get_global_rect().has_point(event.position):
				_touch_index = event.index
				_update_from_position(event.position)
		elif event.index == _touch_index:
			_touch_index = -1
			output_vector = Vector2.ZERO
			update()
	elif event is InputEventScreenDrag and event.index == _touch_index:
		_update_from_position(event.position)

func _update_from_position(global_pos: Vector2) -> void:
	var local_pos := global_pos - get_global_rect().position
	var delta := local_pos - _base_center
	if delta.length() > max_radius:
		delta = delta.normalized() * max_radius
	output_vector = delta / max_radius
	update()

func _draw() -> void:
	draw_circle(_base_center, max_radius, Color(1, 1, 1, 0.12))
	draw_circle(_base_center + output_vector * max_radius, max_radius * 0.4, Color(1, 1, 1, 0.35))
