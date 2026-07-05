shader_type spatial;
render_mode cull_back, diffuse_burley, specular_schlick_ggx;

// Vertex color channels double as per-vertex biome blend weights
// (r=sand/desert, g=grass/plains, b=snow), computed once in
// World.gd from the same noise field the minimap uses. UV carries raw
// world-space XZ so the shader can tile the textures independently of
// mesh resolution.

uniform sampler2D sand_albedo : hint_albedo;
uniform sampler2D sand_normal : hint_normal;
uniform sampler2D sand_roughness : hint_white;
uniform sampler2D grass_albedo : hint_albedo;
uniform sampler2D grass_normal : hint_normal;
uniform sampler2D grass_roughness : hint_white;
uniform sampler2D snow_albedo : hint_albedo;
uniform sampler2D snow_normal : hint_normal;
uniform sampler2D snow_roughness : hint_white;
uniform float tiling = 0.12;

void fragment() {
	vec2 uv = UV * tiling;
	vec3 w = COLOR.rgb;

	vec3 albedo = texture(sand_albedo, uv).rgb * w.r
		+ texture(grass_albedo, uv).rgb * w.g
		+ texture(snow_albedo, uv).rgb * w.b;

	vec3 n = texture(sand_normal, uv).rgb * w.r
		+ texture(grass_normal, uv).rgb * w.g
		+ texture(snow_normal, uv).rgb * w.b;

	float rough = texture(sand_roughness, uv).r * w.r
		+ texture(grass_roughness, uv).r * w.g
		+ texture(snow_roughness, uv).r * w.b;

	ALBEDO = albedo;
	NORMALMAP = n;
	NORMALMAP_DEPTH = 0.6;
	ROUGHNESS = clamp(rough, 0.05, 1.0);
	METALLIC = 0.0;
	SPECULAR = 0.25;
}
