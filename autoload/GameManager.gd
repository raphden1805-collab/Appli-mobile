extends Node
# Autoload singleton: small pieces of global game state that several
# unrelated scenes need to read (build mode, world seed, player stats hub).
# Kept intentionally tiny for the solo prototype milestone.

signal build_mode_changed(is_building)
signal inventory_open_changed(is_open)

var world_seed: int = 20260705
var is_build_mode := false
var is_inventory_open := false

func set_build_mode(value: bool) -> void:
	is_build_mode = value
	emit_signal("build_mode_changed", is_build_mode)

func set_inventory_open(value: bool) -> void:
	is_inventory_open = value
	emit_signal("inventory_open_changed", is_inventory_open)
