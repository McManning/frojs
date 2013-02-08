						
precision mediump float;

varying vec2 vTextureCoord;
varying vec4 vWorldCoord;

uniform sampler2D uSampler;
uniform vec4 uColor;
uniform vec2 uClip;
uniform bool uUseAlphaKey;
uniform float uTime;

uniform vec3 uCamera;

/* Hue [0, 6], Sat [0, 1], Value [0, 1] */
uniform vec3 uHSVShift;

/* HSV adapted from nokola.com/blog/post/2010/02/09/Someone-Said-it-Was-Impossible-Hue-Shift-in-Pixel-Shader-20-(Silverlight).aspx */

/* Converts the rgb value to hsv, where H's range is -1 to 5 */
vec3 rgb_to_hsv(vec3 RGB)
{
	float r = RGB.x;
	float g = RGB.y;
	float b = RGB.z;

	float minChannel = min(r, min(g, b));
	float maxChannel = max(r, max(g, b));

	float h = 0.0;
	float s = 0.0;
	float v = maxChannel;

	float delta = maxChannel - minChannel;

	if (delta != 0.0) { 
		s = delta / v;

		if (r == v) h = (g - b) / delta;
		else if (g == v) h = 2.0 + (b - r) / delta;
		else /* b == v */ h = 4.0 + (r - g) / delta;
	}

	return vec3(h, s, v);
}

vec3 hsv_to_rgb(vec3 HSV)
{
	vec3 RGB; /* = HSV.z; */

	float h = HSV.x;
	float s = HSV.y;
	float v = HSV.z;

	float i = floor(h);
	float f = h - i;

	float p = (1.0 - s);
	float q = (1.0 - s * f);
	float t = (1.0 - s * (1.0 - f));

	if (i == 0.0) { RGB = vec3(1.0, t, p); }
	else if (i == 1.0) { RGB = vec3(q, 1.0, p); }
	else if (i == 2.0) { RGB = vec3(p, 1.0, t); }
	else if (i == 3.0) { RGB = vec3(p, q, 1.0); }
	else if (i == 4.0) { RGB = vec3(t, p, 1.0); }
	else /* i == -1 */ { RGB = vec3(1.0, p, q); }

	RGB *= v;

	return RGB;
}

vec4 SwirlFX(sampler2D tex, vec2 uv, float time) {
	
	vec2 texSize = vec2(800,600);
	vec2 tc = uv * texSize;
	vec2 center = vec2(400, 300);
	float radius = 200.0;
	float angle = 0.8;
	
	tc -= center;
	float dist = length(tc);
	if (dist < radius)
	{
		float percent = (radius - dist) / radius;
		float theta = percent * percent * angle * 8.0;
		float s = sin(theta);
		float c = cos(theta);
		tc = vec2(dot(tc, vec2(c, -s)), dot(tc, vec2(s, c)));
	}
	
	tc += center;
	vec4 color = texture2D(tex, tc / texSize).rgba;
	return color; /* vec4(color, 1.0); */
}

float rand(vec2 co){
    return fract(sin(dot(co.xy ,vec2(12.9898,78.233))) * 43758.5453);
}

void main(void) {

	/* If color is defined, just replace for now. Fix logic later */
	/* if (uColor.a > 0.0) {
		gl_FragColor = uColor;
	} else { */
		gl_FragColor = texture2D(uSampler, vTextureCoord + uClip);

	if (uUseAlphaKey) {
		/* Test if we are the same as the first pixel */
		if (gl_FragColor == texture2D(uSampler, vec2(0, 0)))
			discard;
	}
	
	/* Apply Hue transformation, if we got it */
	if (uHSVShift.x != 0.0 || uHSVShift.y != 0.0 || uHSVShift.z != 0.0) {
	
		vec3 hsv = rgb_to_hsv(gl_FragColor.xyz);
		hsv += uHSVShift;

		/* Put the hue back to the -1, 5 range */
		if (hsv.x > 5.0) 
			hsv.x -= 6.0;

		gl_FragColor = vec4(hsv_to_rgb(hsv), gl_FragColor.a);
	}
	
	/* Do crazy twisting bullshit to screw up our uv coordinates */

	/* gl_FragColor = SwirlFX(uSampler, vTextureCoord.st, uTime); */
	/* gl_FragColor = texture2D(uSampler, vec2(0, 0)); */
	
	/*
	vec2 resolution;
	resolution.x = 1.0;
	resolution.y = 1.0;
	
	vec2 p = -1.0 + 2.0 * gl_FragCoord.xy / resolution.xy;
	vec2 uv; 
	
	float a = atan(p.y,p.x) / (2.0*3.1416);
	float r = sqrt(dot(p,p))/sqrt(2.0);
	
	uv.x = r;
	uv.y = a+r;
	
	vec3 col = texture2D(uSampler, uv).xyz;
	gl_FragColor = vec4(col, 1.0);
	*/
	  
	/* gl_FragCoord is screen position */
	
	/* float n = cnoise(gl_FragCoord.xy / vec2(50.0, 50.0)); */

	/* FINAL EQUATION 
	vec3 lightLocation = vec3(1432.0, 1405.0, 0.0) - (vWorldCoord.xyz - uCamera);
	
	float distance = length(lightLocation);
    

          gl_FragColor.rgb = gl_FragColor.rgb + (vec3(0.5, 0.5, 0.5) / (distance / 50.0));
		*/
vec3 lightLocation = vec3(1432.0, 1405.0, 0.0) - (vWorldCoord.xyz - uCamera);
float dist = length(lightLocation);

vec3 color = vec3(0.0, 0.0, 0.0);

float lightRadius = 400.0 
                        + 10.0*sin(uTime*3.0);


   lightRadius = lightRadius  + 20.0*rand(vec2(uTime/5000.0,vWorldCoord.x*20.0));


float lightIntensity = 10.0;
vec3 lightColor = vec3(0.5, 0.3, 0.5);

float factor = (lightRadius - dist) / lightRadius;
color += factor * lightIntensity * lightColor;

gl_FragColor.rgb = color * gl_FragColor.rgb;

	/*
	vec3 lightColor = normalize(vec3(1.0, 0.0, 0.0) * distance);
	
	gl_FragColor = vec4(gl_FragColor.rgb * lightColor, gl_FragColor.a); */

}

					