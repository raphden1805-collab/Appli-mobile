extends StaticBody
# Lootable crate scattered at points of interest. Opened with the
# "interact" action (E key / touch button), grants a random pull from
# the loot table, then disappears - one-time pickup per crate.

const LOOT_TABLE := [
	{"item": "wood", "min": 20, "max": 60},
	{"item": "stone", "min": 15, "max": 45},
	{"item": "metal", "min": 5, "max": 20},
]
const ROLLS := 2

var is_looted := false

func get_interact_prompt() -> String:
	if is_looted:
		return ""
	return "Ouvrir la caisse"

func interact() -> void:
	if is_looted:
		return
	is_looted = true
	var rng := RandomNumberGenerator.new()
	rng.randomize()
	for i in range(ROLLS):
		var entry = LOOT_TABLE[rng.randi_range(0, LOOT_TABLE.size() - 1)]
		var amount = rng.randi_range(entry["min"], entry["max"])
		Inventory.add_item(entry["item"], amount)
	queue_free()
