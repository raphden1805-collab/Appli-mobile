extends Control
# Top-right overview map: draws the three biome bands, the fixed points
# of interest and a rotating player blip. Reads WorldMap so it always
# matches what World.gd actually built, and gets a Player reference from
# HUD.gd the same way the touch controls do.

const WorldMap := preload("res://scenes/world/WorldMap.gd")

var player: Spatial = null

func _process(_delta: float) -> void:
	if player:
		update()

func _draw() -> void:
	var size := rect_size
	var half := WorldMap.WORLD_HALF_SIZE

	var bands := [
		[-half, WorldMap.DESERT_MAX_X, WorldMap.BIOME_COLORS[WorldMap.BIOME_DESERT]],
		[WorldMap.DESERT_MAX_X, WorldMap.SNOW_MIN_X, WorldMap.BIOME_COLORS[WorldMap.BIOME_PLAINS]],
		[WorldMap.SNOW_MIN_X, half, WorldMap.BIOME_COLORS[WorldMap.BIOME_SNOW]],
	]
	for band in bands:
		var x0: float = _world_to_map_x(band[0], half, size.x)
		var x1: float = _world_to_map_x(band[1], half, size.x)
		draw_rect(Rect2(x0, 0, x1 - x0, size.y), band[2])

	draw_rect(Rect2(Vector2.ZERO, size), Color(0, 0, 0, 0.85), false, 3.0)

	for poi in WorldMap.POIS:
		var mp := _world_to_map(poi["pos"], half, size)
		draw_circle(mp, 6.0, Color(0, 0, 0, 0.6))
		draw_circle(mp, 5.0, Color(1.0, 0.85, 0.2, 0.95))

	if player:
		var world_pos := player.global_transform.origin
		var mp := _world_to_map(Vector2(world_pos.x, world_pos.z), half, size)
		_draw_player_arrow(mp, player.rotation.y)

func _world_to_map_x(x: float, half: float, width: float) -> float:
	return (x + half) / (half * 2.0) * width

func _world_to_map(world_xz: Vector2, half: float, size: Vector2) -> Vector2:
	var mx := (world_xz.x + half) / (half * 2.0) * size.x
	var mz := (world_xz.y + half) / (half * 2.0) * size.y
	return Vector2(mx, mz)

func _draw_player_arrow(center: Vector2, heading: float) -> void:
	var forward := Vector2(-sin(heading), -cos(heading))
	var right := Vector2(cos(heading), -sin(heading))
	var tip := center + forward * 8.0
	var back_left := center - forward * 5.0 + right * 5.0
	var back_right := center - forward * 5.0 - right * 5.0
	var points := PoolVector2Array([tip, back_left, back_right])
	draw_polygon(points, PoolColorArray([Color(1, 1, 1, 0.95)]))
