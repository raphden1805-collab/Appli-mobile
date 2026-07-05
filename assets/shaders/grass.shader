shader_type spatial;
render_mode cull_disabled, diffuse_burley, specular_schlick_ggx;

// Each grass blade is a single triangle (2 base verts + 1 tip vert).
// COLOR.r is baked in per-vertex as a 0 (base, doesn't move) to 1 (tip,
// swings the most) weight, driving both the wind sway and the
// base->tip color gradient from one channel.

uniform vec4 base_color : hint_color = vec4(0.14, 0.32, 0.11, 1.0);
uniform vec4 tip_color : hint_color = vec4(0.5, 0.66, 0.24, 1.0);
uniform float wind_strength = 0.18;
uniform float wind_speed = 1.5;

void vertex() {
	vec4 wp = WORLD_MATRIX * vec4(0.0, 0.0, 0.0, 1.0);
	float bend = COLOR.r;
	float phase = wp.x * 0.35 + wp.z * 0.35;
	float sway = sin(TIME * wind_speed + phase) * wind_strength * bend;
	VERTEX.x += sway;
	VERTEX.z += sway * 0.4;
}

void fragment() {
	ALBEDO = mix(base_color.rgb, tip_color.rgb, COLOR.r);
	ROUGHNESS = 0.9;
	METALLIC = 0.0;
	SPECULAR = 0.1;
}
