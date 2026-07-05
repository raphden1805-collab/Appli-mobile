extends StaticBody
# Attached to trees/rocks/ore deposits. The player's harvesting tool calls
# take_harvest_damage() via the interact raycast; once health drops to zero
# the node grants its resource yield and despawns (a fresh one is scattered
# elsewhere by World.gd, keeping the map from running dry).

export(String) var resource_type := "wood"
export(float) var max_health := 60.0
export(int) var yield_per_hit := 8
export(int) var final_yield_bonus := 10

var health: float

func _ready() -> void:
	health = max_health
	add_to_group("resource_nodes")

func get_interact_prompt() -> String:
	return "Recolter (%s)" % resource_type

func take_harvest_damage(amount: float) -> void:
	health -= amount
	Inventory.add_item(resource_type, yield_per_hit)
	if health <= 0.0:
		Inventory.add_item(resource_type, final_yield_bonus)
		queue_free()
