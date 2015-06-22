precision mediump float;

varying vec2 vTextureCoord;
varying vec4 vWorldCoord;

uniform sampler2D uSampler;
uniform vec2 uClip;
uniform float uTime;
uniform vec3 uCamera;

void main(void) {
    gl_FragColor = texture2D(uSampler, vTextureCoord + uClip);
}
