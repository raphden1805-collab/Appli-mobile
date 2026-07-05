extends Node
# Autoload singleton: small pieces of global game state that several
# unrelated scenes need to read (build mode, world seed, player stats hub).
# Kept intentionally tiny for the solo prototype milestone.

signal build_mode_changed(is_building)

var world_seed: int = 20260705
var is_build_mode := false

func set_build_mode(value: bool) -> void:
	is_build_mode = value
	emit_signal("build_mode_changed", is_build_mode)
