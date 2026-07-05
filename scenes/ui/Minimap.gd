extends Control
# Top-right overview map. The biome background is baked once into an
# ImageTexture by resampling WorldMap's noise field (same seed as
# World.gd, so it always matches the actual terrain) - far cheaper than
# redrawing hundreds of rects every frame. Only the POI markers and the
# player blip are redrawn each frame on top of that cached texture.

const WorldMap := preload("res://scenes/world/WorldMap.gd")
const TEXTURE_RESOLUTION := 128

var player: Spatial = null
var poi_list := []
var bg_texture: ImageTexture

func _ready() -> void:
	_build_background_texture()

func set_poi_list(list: Array) -> void:
	poi_list = list
	update()

func _build_background_texture() -> void:
	var noise := WorldMap.create_noise(GameManager.world_seed)
	var coast_noise := WorldMap.create_coast_noise(GameManager.world_seed)
	var half := WorldMap.MINIMAP_VIEW_RADIUS
	var img := Image.new()
	img.create(TEXTURE_RESOLUTION, TEXTURE_RESOLUTION, false, Image.FORMAT_RGB8)
	img.lock()
	for yi in range(TEXTURE_RESOLUTION):
		var wz: float = (float(yi) / TEXTURE_RESOLUTION) * half * 2.0 - half
		for xi in range(TEXTURE_RESOLUTION):
			var wx: float = (float(xi) / TEXTURE_RESOLUTION) * half * 2.0 - half
			img.set_pixel(xi, yi, WorldMap.get_terrain_color(noise, coast_noise, wx, wz))
	img.unlock()
	bg_texture = ImageTexture.new()
	bg_texture.create_from_image(img, Texture.FLAG_FILTER)

func _process(_delta: float) -> void:
	if player:
		update()

func _draw() -> void:
	var size := rect_size
	var half := WorldMap.MINIMAP_VIEW_RADIUS

	if bg_texture:
		draw_texture_rect(bg_texture, Rect2(Vector2.ZERO, size), false)

	draw_rect(Rect2(Vector2.ZERO, size), Color(0, 0, 0, 0.85), false, 3.0)
	draw_string(get_font("font"), Vector2(size.x / 2.0 - 4, 16), "N")

	for poi in poi_list:
		var mp := _world_to_map(poi["pos"], half, size)
		_draw_poi_marker(mp, poi.get("type", "ruins"))

	if player:
		var world_pos := player.global_transform.origin
		var mp := _world_to_map(Vector2(world_pos.x, world_pos.z), half, size)
		_draw_player_arrow(mp, player.rotation.y)

func _world_to_map(world_xz: Vector2, half: float, size: Vector2) -> Vector2:
	var mx := (world_xz.x + half) / (half * 2.0) * size.x
	var mz := (world_xz.y + half) / (half * 2.0) * size.y
	return Vector2(mx, mz)

func _draw_poi_marker(mp: Vector2, poi_type: String) -> void:
	match poi_type:
		"village":
			var r := Rect2(mp - Vector2(6, 6), Vector2(12, 12))
			draw_rect(r.grow(1.0), Color(0, 0, 0, 0.6))
			draw_rect(r, Color(0.9, 0.6, 0.2, 0.95))
		"building":
			draw_circle(mp, 7.0, Color(0, 0, 0, 0.6))
			draw_circle(mp, 6.0, Color(0.55, 0.65, 0.8, 0.95))
		"station":
			var pts := PoolVector2Array([mp + Vector2(0, -7), mp + Vector2(7, 0), mp + Vector2(0, 7), mp + Vector2(-7, 0)])
			draw_colored_polygon(pts, Color(0.7, 0.4, 0.85, 0.95))
		"metro":
			var pts := PoolVector2Array([mp + Vector2(-7, -5), mp + Vector2(7, -5), mp + Vector2(0, 7)])
			draw_colored_polygon(pts, Color(0.2, 0.75, 0.75, 0.95))
		_:
			draw_circle(mp, 6.0, Color(0, 0, 0, 0.6))
			draw_circle(mp, 5.0, Color(1.0, 0.85, 0.2, 0.95))

func _draw_player_arrow(center: Vector2, heading: float) -> void:
	var forward := Vector2(-sin(heading), -cos(heading))
	var right := Vector2(cos(heading), -sin(heading))
	var tip := center + forward * 8.0
	var back_left := center - forward * 5.0 + right * 5.0
	var back_right := center - forward * 5.0 - right * 5.0
	var points := PoolVector2Array([tip, back_left, back_right])
	draw_polygon(points, PoolColorArray([Color(1, 1, 1, 0.95)]))
