


precision mediump float;

varying vec2 vTextureCoord;
uniform sampler2D uSampler;
uniform vec4 uColor;
uniform vec2 uClip;
uniform bool uUseAlphaKey;
uniform float uTime;

/* Hue [0, 6], Sat [0, 1], Value [0, 1] */
uniform vec3 uHSVShift;

void main(void) {

    if (uColor.a > 0.0) {
        gl_FragColor = uColor;
    } else {
        gl_FragColor = texture2D(uSampler, vTextureCoord + uClip);
    }

    if (uUseAlphaKey) {
        /* Test if we are the same as the first pixel */
        if (gl_FragColor == texture2D(uSampler, vec2(0, 0)))
            discard;
    }
    
    /* Crazy warp bs */
    
    vec2 resolution = vec2(800, 600);

    vec2 halfres = resolution.xy/2.0;
    vec2 cPos = gl_FragCoord.xy;

    /* Motion center movement */
    /*cPos.x -= 0.5*halfres.x*sin(uTime/2.0)+0.3*halfres.x*cos(uTime)+halfres.x;
    cPos.y -= 0.4*halfres.y*sin(uTime/5.0)+0.3*halfres.y*cos(uTime)+halfres.y;
    */
    float cLength = length(cPos);

    /* /25 reduces sine wave strength */
    vec2 uv = gl_FragCoord.xy/resolution.xy+(cPos/cLength)*sin(cLength/30.0-uTime*10.0) /80.0; 
    
    vec3 col = texture2D(uSampler,uv).xyz; /* * 50.0/cLength; */
                                        /*     ^ glow effect while moving, and darkening all away from effect   */
                                        
    gl_FragColor = vec4(col,texture2D(uSampler, uv).a);

}



