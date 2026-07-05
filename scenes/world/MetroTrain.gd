extends Spatial
# Moves a train back and forth along a fixed list of waypoints (built by
# MetroNetwork.gd from the station/tunnel layout) at constant speed,
# reversing direction at each end - purely decorative "traffic", not
# collidable, so it never needs to interact with the player physically.

const SPEED := 5.0

var path: Array = []
var cumulative: Array = []
var total_length := 0.0
var traveled := 0.0
var direction := 1

func set_path(p: Array) -> void:
	path = p
	cumulative = [0.0]
	for i in range(1, path.size()):
		cumulative.append(cumulative[i - 1] + path[i - 1].distance_to(path[i]))
	total_length = cumulative[cumulative.size() - 1]
	traveled = 0.0
	direction = 1
	_update_transform()

func _process(delta: float) -> void:
	if path.size() < 2:
		return
	traveled += SPEED * delta * direction
	if traveled >= total_length:
		traveled = total_length
		direction = -1
	elif traveled <= 0.0:
		traveled = 0.0
		direction = 1
	_update_transform()

func _update_transform() -> void:
	var idx := 0
	for i in range(cumulative.size() - 1):
		if traveled >= cumulative[i] and traveled <= cumulative[i + 1]:
			idx = i
			break
	var seg_start: float = cumulative[idx]
	var seg_end: float = cumulative[idx + 1]
	var seg_len: float = max(seg_end - seg_start, 0.001)
	var t := (traveled - seg_start) / seg_len
	var pos: Vector3 = path[idx].linear_interpolate(path[idx + 1], t)
	transform.origin = pos
	var look_target: Vector3 = path[idx + 1] if direction > 0 else path[idx]
	if look_target != pos:
		look_at(look_target, Vector3.UP)
