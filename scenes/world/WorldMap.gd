extends Reference
# Single source of truth for world layout: the island's coastline is an
# irregular blob (bays/peninsulas via angular noise), ringed by a sandy
# beach and then open ocean. World.gd (ground/water/scattering) and
# Minimap.gd both call create_noise()/create_coast_noise() with the same
# world seed and get back identical noise fields, so the drawn map
# always matches the actual 3D world without needing to share object
# references.

# Average island size and how wildly the coastline wobbles around it -
# combined with COAST_VARIATION this produces real bays and peninsulas
# instead of a perfect circle.
const COAST_BASE_RADIUS := 270.0
const COAST_VARIATION := 100.0
const COAST_SAMPLE_RADIUS := 180.0
const COAST_DETAIL_FREQ := 2.6

# Sandy ring between the island and open water.
const BEACH_WIDTH := 22.0
# The detailed ground mesh extends a little past the widest possible
# coastline so its edge is always hidden underwater regardless of angle.
const GROUND_MESH_RADIUS := COAST_BASE_RADIUS + COAST_VARIATION + BEACH_WIDTH + 6.0
# Big open-water plane so the horizon is never visible from the island
# (fog hides everything past ~280 units anyway).
const WATER_SIZE := 1600.0
const WATER_LEVEL := -0.2
# Slightly bigger than the ground mesh so the minimap shows a strip of
# open water framing the island.
const MINIMAP_VIEW_RADIUS := GROUND_MESH_RADIUS * 1.15

# Player always spawns near the origin - force that area to stay plains
# regardless of the noise value so the start of a run is never a random
# desert/snow pocket.
const SPAWN_SAFE_RADIUS := 20.0

const NOISE_PERIOD := 162.0
const NOISE_OCTAVES := 3
const NOISE_PERSISTENCE := 0.5

# Biome thresholds on the noise value (roughly -1..1). Desert is the
# lowest band, snow the highest, plains fills the (wider) middle.
const DESERT_THRESHOLD := -0.15
const SNOW_THRESHOLD := 0.22
const BLEND_EDGE := 0.06

const BIOME_DESERT := "desert"
const BIOME_PLAINS := "plaine"
const BIOME_SNOW := "neige"
const BIOME_BEACH := "plage"

const BIOME_COLORS := {
	"desert": Color(0.76, 0.68, 0.42),
	"plaine": Color(0.3, 0.45, 0.22),
	"neige": Color(0.85, 0.88, 0.92),
	"plage": Color(0.82, 0.74, 0.55),
}
const OCEAN_COLOR := Color(0.1, 0.28, 0.4)

static func create_noise(world_seed: int) -> OpenSimplexNoise:
	var noise := OpenSimplexNoise.new()
	noise.seed = world_seed
	noise.period = NOISE_PERIOD
	noise.octaves = NOISE_OCTAVES
	noise.persistence = NOISE_PERSISTENCE
	return noise

# Separate, decorrelated noise field just for the coastline shape (own
# seed offset so it doesn't line up with the biome pattern).
static func create_coast_noise(world_seed: int) -> OpenSimplexNoise:
	var noise := OpenSimplexNoise.new()
	noise.seed = world_seed + 91771
	noise.period = 110.0
	noise.octaves = 2
	noise.persistence = 0.5
	return noise

# How far the coastline is from the origin at a given angle. Combines a
# broad wobble with a finer one (sampled along a fixed circle and keyed
# by angle) so the island gets both large bays and smaller detail.
static func get_coast_radius(coast_noise: OpenSimplexNoise, angle: float) -> float:
	var nx := cos(angle) * COAST_SAMPLE_RADIUS
	var nz := sin(angle) * COAST_SAMPLE_RADIUS
	var broad := coast_noise.get_noise_2d(nx, nz)
	var detail := coast_noise.get_noise_2d(nx * COAST_DETAIL_FREQ + 500.0, nz * COAST_DETAIL_FREQ + 500.0)
	var wobble := broad * 0.75 + detail * 0.25
	return COAST_BASE_RADIUS + wobble * COAST_VARIATION

static func _dist_and_coast(coast_noise: OpenSimplexNoise, x: float, z: float) -> Array:
	var dist := Vector2(x, z).length()
	var coast_r := get_coast_radius(coast_noise, atan2(z, x))
	return [dist, coast_r]

# Categorical biome for gameplay logic (scattering, POI placement). Only
# meaningful on land - callers are expected to only sample within the
# actual coastline (see World.gd's irregular-aware _random_position).
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

# Terrain color including the beach/ocean rings - used for the ground's
# safety-net vertex colors and the minimap texture (not for gameplay).
static func get_terrain_color(noise: OpenSimplexNoise, coast_noise: OpenSimplexNoise, x: float, z: float) -> Color:
	var dc := _dist_and_coast(coast_noise, x, z)
	var dist: float = dc[0]
	var coast_r: float = dc[1]
	if dist > coast_r + BEACH_WIDTH:
		return OCEAN_COLOR
	if dist > coast_r:
		return BIOME_COLORS[BIOME_BEACH]
	return get_biome_color(noise, x, z)

# Smooth (desert, plains, snow) texture-blend weights for the ground
# shader - unlike get_biome() these blend continuously across the noise
# thresholds so biome borders don't show a hard seam in the terrain
# texture. Beach/ocean are treated as "desert" (sand) since they share
# the same sand texture.
static func get_biome_weights(noise: OpenSimplexNoise, coast_noise: OpenSimplexNoise, x: float, z: float) -> Vector3:
	var dc := _dist_and_coast(coast_noise, x, z)
	var dist: float = dc[0]
	var coast_r: float = dc[1]
	if dist > coast_r:
		return Vector3(1, 0, 0)
	if dist < SPAWN_SAFE_RADIUS:
		return Vector3(0, 1, 0)
	var v := noise.get_noise_2d(x, z)
	var desert_w := 1.0 - _smooth_step(DESERT_THRESHOLD - BLEND_EDGE, DESERT_THRESHOLD + BLEND_EDGE, v)
	var snow_w := _smooth_step(SNOW_THRESHOLD - BLEND_EDGE, SNOW_THRESHOLD + BLEND_EDGE, v)
	var plains_w := clamp(1.0 - desert_w - snow_w, 0.0, 1.0)
	var total := desert_w + plains_w + snow_w
	if total < 0.0001:
		return Vector3(0, 1, 0)
	return Vector3(desert_w, plains_w, snow_w) / total

static func _smooth_step(edge0: float, edge1: float, x: float) -> float:
	var t := clamp((x - edge0) / (edge1 - edge0), 0.0, 1.0)
	return t * t * (3.0 - 2.0 * t)
