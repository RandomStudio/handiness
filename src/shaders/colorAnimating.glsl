// #version 300 es

#ifdef GL_ES
precision mediump float;
#endif

// #extension GL_OES_standard_derivatives:enable

uniform float u_time;
uniform vec2 u_resolution;
uniform vec3 u_normal_bg;
uniform float u_progress;

// cosine based palette, 4 vec3 params
vec3 palette(float t, vec3 a, vec3 b, vec3 c, vec3 d)
{
	vec3 v3Color=a + b * cos(6.28318 * (c * t + d));
	return v3Color;
}

void main()
{
	// Normalized pixel coordinates (from 0 to 1)
	vec2 uv = gl_FragCoord.xy / u_resolution.xy;
	
	float time = u_time * 0.2;
	
	// Calculate two points on screen.
	vec2 c1 = vec2(sin(time) * 0.5, cos(u_time) * 0.7);
	vec2 c2 = vec2(sin(time * 0.7) * 0.9, cos(u_time * 0.65) * 0.6);
	
	// Determine length to point 1 & calculate color0.
	float d1 = length(uv - c1);
	vec3 col1 = palette(d1, vec3(0.0, 0.0, 0.4), vec3(0.5, 0.5, 0.5), vec3(1.0, 1.0, 1.0),vec3(0.0, 0.1, 0.2));

	//Determine length to point 2 & calculate color.
	float d2 = length(uv-c2);
	vec3 col2 = palette(d2, vec3(0.4667, 0.2118, 0.2118), vec3(0.0667, 0.0471, 0.4784), vec3(1.0, 1.0, 1.0), vec3(0.1529, 0.8784, 0.1294));
	
	vec3 target_color = vec3(col1 + col2);
	
	if (u_progress <= 1.0 && u_progress > 0.0)
	{
		vec3 color = mix(u_normal_bg, target_color, u_progress);
		gl_FragColor.rgb = color;
		gl_FragColor.a = mix(1.0, 0.5, u_progress);
	}
	else if (u_progress == 1.0)
	{
		gl_FragColor.rgb = target_color;
		gl_FragColor.a = 0.5;
	}
}
