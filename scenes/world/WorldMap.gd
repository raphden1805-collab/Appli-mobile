extends Reference
# Single source of truth for world layout: size, procedural biome noise
# and colors. World.gd (ground/scattering) and Minimap.gd (the top-right
# map) both call create_noise() with the same world seed and get back
# an identical noise field, so the drawn map always matches the actual
# 3D world without needing to share object references.

const WORLD_HALF_SIZE := 180.0

# Player always spawns near the origin - force that area to stay plains
# regardless of the noise value so the start of a run is never a random
# desert/snow pocket.
const SPAWN_SAFE_RADIUS := 20.0

const NOISE_PERIOD := 90.0
const NOISE_OCTAVES := 3
const NOISE_PERSISTENCE := 0.5

# Biome thresholds on the noise value (roughly -1..1). Desert is the
# lowest band, snow the highest, plains fills the (wider) middle.
const DESERT_THRESHOLD := -0.15
const SNOW_THRESHOLD := 0.22

const BIOME_DESERT := "desert"
const BIOME_PLAINS := "plaine"
const BIOME_SNOW := "neige"

const BIOME_COLORS := {
	"desert": Color(0.76, 0.68, 0.42),
	"plaine": Color(0.3, 0.45, 0.22),
	"neige": Color(0.85, 0.88, 0.92),
}

static func create_noise(world_seed: int) -> OpenSimplexNoise:
	var noise := OpenSimplexNoise.new()
	noise.seed = world_seed
	noise.period = NOISE_PERIOD
	noise.octaves = NOISE_OCTAVES
	noise.persistence = NOISE_PERSISTENCE
	return noise

static func get_biome(noise: OpenSimplexNoise, x: float, z: float) -> String:
	if Vector2(x, z).length() < SPAWN_SAFE_RADIUS:
		return BIOME_PLAINS
	var v := noise.get_noise_2d(x, z)
	if v < DESERT_THRESHOLD:
		return BIOME_DESERT
	if v > SNOW_THRESHOLD:
		return BIOME_SNOW
	return BIOME_PLAINS

static func get_biome_color(noise: OpenSimplexNoise, x: float, z: float) -> Color:
	return BIOME_COLORS[get_biome(noise, x, z)]
