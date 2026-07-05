extends Spatial
# Entry point: spawns the player at the origin and hands the HUD a
# reference to it once both are in the tree.

const PLAYER_SCENE := preload("res://scenes/player/Player.tscn")

onready var hud = $HUD

func _ready() -> void:
	var player = PLAYER_SCENE.instance()
	add_child(player)
	player.transform.origin = Vector3(0, 1.2, 0)
	hud.set_player(player)
