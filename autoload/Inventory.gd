extends Node
# Autoload singleton: tracks resource counts and fires a signal on change
# so the HUD and building system can react without polling every frame.

signal inventory_changed(item_name, new_amount)

var items := {
	"wood": 0,
	"stone": 0,
	"metal": 0,
}

# Display metadata for the inventory screen (kept as an ordered array so
# the panel always lists items in the same order).
const ITEM_INFO := [
	{"key": "wood", "label": "Bois", "color": Color(0.55, 0.36, 0.18)},
	{"key": "stone", "label": "Pierre", "color": Color(0.55, 0.55, 0.55)},
	{"key": "metal", "label": "Metal", "color": Color(0.65, 0.67, 0.7)},
]

func add_item(item_name: String, amount: int) -> void:
	if amount <= 0:
		return
	items[item_name] = items.get(item_name, 0) + amount
	emit_signal("inventory_changed", item_name, items[item_name])

func get_amount(item_name: String) -> int:
	return items.get(item_name, 0)

func has_amount(item_name: String, amount: int) -> bool:
	return get_amount(item_name) >= amount

# Returns true and deducts the cost only if every ingredient is affordable.
func try_spend(cost: Dictionary) -> bool:
	for item_name in cost:
		if not has_amount(item_name, cost[item_name]):
			return false
	for item_name in cost:
		items[item_name] -= cost[item_name]
		emit_signal("inventory_changed", item_name, items[item_name])
	return true
