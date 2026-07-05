extends Control
# Right-hand side of the screen: dragging a finger here rotates the
# camera, same idea as most mobile shooters. Accumulates drag delta each
# frame; HUD.gd drains it once per frame into the player's look rotation.

var _touch_index := -1
var _accumulated := Vector2.ZERO

func _ready() -> void:
	mouse_filter = Control.MOUSE_FILTER_IGNORE

func _input(event: InputEvent) -> void:
	if event is InputEventScreenTouch:
		if event.pressed:
			if _touch_index == -1 and get_global_rect().has_point(event.position):
				_touch_index = event.index
		elif event.index == _touch_index:
			_touch_index = -1
	elif event is InputEventScreenDrag and event.index == _touch_index:
		_accumulated += event.relative

func consume_delta() -> Vector2:
	var delta := _accumulated
	_accumulated = Vector2.ZERO
	return delta
