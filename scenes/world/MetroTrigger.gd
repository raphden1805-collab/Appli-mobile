extends StaticBody
# Point-blank interact trigger (E key / touch button) used by
# AbandonedMetro.tscn to fake walking between the surface stairwell and
# the underground platform: the world's ground collision is a single flat
# slab with no way to carve a real hole through it, so instead of
# continuous stairs the two halves are connected by teleporting the
# player to another marker in the same scene.

export(String) var prompt := ""
export(NodePath) var target_path

func get_interact_prompt() -> String:
	return prompt

func interact() -> void:
	var target := get_node(target_path)
	var player := get_tree().current_scene.get_node("Player")
	player.transform.origin = target.global_transform.origin
