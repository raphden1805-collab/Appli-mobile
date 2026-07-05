extends Reference
# Single source of truth for world layout: size, biome bands and points
# of interest. World.gd (ground/scattering) and Minimap.gd (the top-right
# map) both read these constants so the drawn map always matches the
# actual 3D world.

const WORLD_HALF_SIZE := 90.0

# Biome bands along the X axis (Z is unconstrained - full depth bands).
const DESERT_MAX_X := -30.0
const SNOW_MIN_X := 30.0

const BIOME_DESERT := "desert"
const BIOME_PLAINS := "plaine"
const BIOME_SNOW := "neige"

const BIOME_COLORS := {
	"desert": Color(0.76, 0.68, 0.42),
	"plaine": Color(0.3, 0.45, 0.22),
	"neige": Color(0.85, 0.88, 0.92),
}

# Fixed points of interest, hand-placed so one sits in each biome.
const POIS := [
	{"name": "Ruines de depart", "pos": Vector2(8, 8)},
	{"name": "Immeuble abandonne", "pos": Vector2(-55, -40)},
	{"name": "Gare abandonnee", "pos": Vector2(55, 45)},
]

static func get_biome(x: float) -> String:
	if x < DESERT_MAX_X:
		return BIOME_DESERT
	if x > SNOW_MIN_X:
		return BIOME_SNOW
	return BIOME_PLAINS

static func get_biome_color(x: float) -> Color:
	return BIOME_COLORS[get_biome(x)]
