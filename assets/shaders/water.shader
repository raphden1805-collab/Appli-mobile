shader_type spatial;
render_mode blend_mix, cull_disabled, diffuse_burley, specular_schlick_ggx;

// Stylised ocean: gentle multi-directional sine waves, a shallow-to-deep
// color blend keyed off distance from the island's coastline (accurate
// here since the island is circular - a cheap stand-in for real depth
// sampling), and a fresnel rim for grazing-angle reflectivity/glow.

uniform vec4 shallow_color : hint_color = vec4(0.3, 0.62, 0.6, 0.55);
uniform vec4 deep_color : hint_color = vec4(0.02, 0.12, 0.24, 0.95);
uniform float wave_height = 0.16;
uniform float wave_speed = 0.6;
uniform float coast_radius = 186.0;
uniform float fade_distance = 60.0;

varying float v_depth_t;

float wave(vec2 pos, float t) {
	float w = sin(pos.x * 0.16 + t * wave_speed) * 0.5;
	w += sin(pos.y * 0.22 - t * wave_speed * 1.3) * 0.3;
	w += sin((pos.x + pos.y) * 0.11 + t * wave_speed * 0.7) * 0.2;
	return w;
}

void vertex() {
	vec3 wp = (WORLD_MATRIX * vec4(VERTEX, 1.0)).xyz;
	float d = length(wp.xz);
	v_depth_t = clamp((d - coast_radius) / fade_distance, 0.0, 1.0);
	float w = wave(wp.xz, TIME);
	VERTEX.y += w * wave_height * (0.3 + 0.7 * v_depth_t);
}

void fragment() {
	float fresnel = pow(1.0 - clamp(dot(NORMAL, VIEW), 0.0, 1.0), 5.0);
	vec4 col = mix(shallow_color, deep_color, v_depth_t);
	ALBEDO = col.rgb;
	ALPHA = mix(col.a, 0.9, fresnel);
	ROUGHNESS = 0.15 + (1.0 - fresnel) * 0.25;
	METALLIC = 0.0;
	SPECULAR = 0.3;
	EMISSION = fresnel * vec3(0.5, 0.6, 0.65) * 0.06;
}
