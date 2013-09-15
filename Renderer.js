
"use strict";

var gl = null;

var DEFAULT_VS = 'attribute vec3 aVertexPosition;attribute vec2 aTextureCoord;uniform mat4 uMVMatrix;uniform mat4 uPMatrix;uniform vec4 uColor;varying vec2 vTextureCoord;varying vec4 vWorldCoord;void main(void){vWorldCoord=uMVMatrix*vec4(aVertexPosition,1.0);vTextureCoord=aTextureCoord;gl_Position=uPMatrix*vWorldCoord;}';
var DEFAULT_FS = 'precision mediump float;varying vec2 vTextureCoord;varying vec4 vWorldCoord;uniform sampler2D uSampler;uniform vec4 uColor;uniform vec2 uClip;uniform bool uUseAlphaKey;uniform float uTime;uniform vec3 uCamera;uniform vec3 uHSVShift;vec3 rgb_to_hsv(vec3 RGB){float r=RGB.x;float g=RGB.y;float b=RGB.z;float minChannel=min(r,min(g,b));float maxChannel=max(r,max(g,b));float h=0.0;float s=0.0;float v=maxChannel;float delta=maxChannel-minChannel;if(delta!=0.0){s=delta/v;if(r==v)h=(g-b)/delta;else if(g==v)h=2.0+(b-r)/delta;else h=4.0+(r-g)/delta;}return vec3(h,s,v);}vec3 hsv_to_rgb(vec3 HSV){vec3 RGB;float h=HSV.x;float s=HSV.y;float v=HSV.z;float i=floor(h);float f=h-i;float p=(1.0-s);float q=(1.0-s*f);float t=(1.0-s*(1.0-f));if(i==0.0){RGB=vec3(1.0,t,p);}else if(i==1.0){RGB=vec3(q,1.0,p);}else if(i==2.0){RGB=vec3(p,1.0,t);}else if(i==3.0){RGB=vec3(p,q,1.0);}else if(i==4.0){RGB=vec3(t,p,1.0);}else{RGB=vec3(1.0,p,q);}RGB*=v;return RGB;}void main(void){gl_FragColor=texture2D(uSampler,vTextureCoord+uClip);if(uUseAlphaKey){if(gl_FragColor==texture2D(uSampler,vec2(0,0))) discard;}if(uHSVShift.x!=0.0||uHSVShift.y!=0.0||uHSVShift.z!=0.0){vec3 hsv=rgb_to_hsv(gl_FragColor.xyz);hsv+=uHSVShift;if(hsv.x>5.0) hsv.x-=6.0;gl_FragColor=vec4(hsv_to_rgb(hsv),gl_FragColor.a);}}';

fro.renderer = {
	
	initialise : function(options) {
		
		var canvas = options.canvas;
		
		this.usesWebGL = options.webGL;
		this.currentShader = null;
		this.shaders = new Array();
		
		try {
			
			var ctx = canvas.getContext('experimental-webgl');
			gl = ctx; //WebGLDebugUtils.makeDebugContext(ctx, undefined, validateNoneOfTheArgsAreUndefined);
		
			this.usesWebGL = true;
		} catch (e) {
			gl = false;
		}
		
		// No WebGL or canvas support, they can't play!
		if (!gl) {
			throw new Error('No WebGL support!');
		}
	
		gl.viewportWidth = canvas.width;
		gl.viewportHeight = canvas.height;

		// Add some matrix manipulation helpers
		gl.mvMatrix = mat4.create();
		gl.pMatrix = mat4.create();
	
		gl.mvMatrixStack = new Array();
		
		gl.mvPopMatrix = function() {
			if (gl.mvMatrixStack.length == 0) {
				throw new Error('Invalid popMatrix!');
			}
			gl.mvMatrix = gl.mvMatrixStack.pop();
		}
			
		gl.mvPushMatrix = function() {
			var copy = mat4.create();
			mat4.set(gl.mvMatrix, copy);
			gl.mvMatrixStack.push(copy);
		}
		
		// upload matrix changes to the graphics card, since GL doesn't track local changes
		gl.setMatrixUniforms = function() {
			
			var shader = fro.renderer.getCurrentShader();
		
			gl.uniformMatrix4fv(shader.getUniform('uPMatrix'), false, gl.pMatrix);
			gl.uniformMatrix4fv(shader.getUniform('uMVMatrix'), false, gl.mvMatrix);
		}
		
		/*
			From http://en.wikipedia.org/wiki/Alpha_compositing#Alpha_blending
			outA = srcA + dstA(1 - srcA)
			outRGB = srcRGB(srcA) + dstRGB*dstA(1 - srcA)
			
			Orgb = srgb * Srgb + drgb * Drgb
			Oa = sa * Sa + da * Da
			glBlendFuncSeparate(srgb, drgb, sa, da)
			
			@todo eventually phase this out, since blending will work differently within the shader.
		*/
		gl.enable(gl.BLEND);
		gl.blendFuncSeparate(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA, gl.ONE, gl.ONE_MINUS_SRC_ALPHA);
	
		this.setClearColor(38, 38, 38);
	},
	
	isWebGL : function() {
		return this.usesWebGL;
	},
	
	clear : function() {
	
		if (this.isWebGL()) {
			gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
		} else {
			gl.fillStyle = this.clearStyle;
			gl.fillRect(0, 0, gl.viewportWidth, gl.viewportHeight);
		}
	},
	
	createTexture : function(image) {
		
		if (this.isWebGL()) {
			var texture = gl.createTexture();

			gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, true);
			gl.bindTexture(gl.TEXTURE_2D, texture);
			gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, image);
			//gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
			//gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);

			gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
			//gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR_MIPMAP_NEAREST);  

			// Supporting non power of two textures
			// See: http://www.khronos.org/webgl/wiki/WebGL_and_OpenGL_Differences#Non-Power_of_Two_Texture_Support
			gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
			gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
			gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);

			// Can't mipmap if want non-power-of-two via wrapping
			//gl.generateMipmap(gl.TEXTURE_2D); 

			gl.bindTexture(gl.TEXTURE_2D, null);
			
		} else {
			throw new Error('Canvas API is not supported (nor will be...)');
		}
		
		return texture;
	},
	
	setClearColor : function(r, g, b) {
		
		if (this.isWebGL()) {
			gl.clearColor(r/255.0, g/255.0, b/255.0, 1.0);
		} else {
			this.clearStyle = 'rgb(' + r + ',' + g + ',' + b + ')';
		}
	},
	
	/** 
	 * Set the current shader used by the renderer. 
	 * 
	 * @param string id Resource ID of the shader to use
	 */
	useShader : function(id) {

		if (!(id in this.shaders)) {
			throw new Error('Shader ' + id + ' is not loaded');
		}
		
		var shader = this.shaders[id];
		this.currentShader = shader;
		
		gl.useProgram(shader.getProgram());
	},

	/**
	 * Add a new shader to our list of available shaders
	 * 
	 * @param ShaderResource shader The shader to add
	 */
	attachShader : function(shader) {
		this.shaders[shader.id] = shader;
	},
	
	getCurrentShader : function() {
		return this.currentShader;
	}
	
	// @todo the functionality of changing active shaders.
	// Need to take in account that we probably need to link a vs/fs to 
	// the same program, causing duplicates if we have duplicates in sets.
	// (ie: shared vs's)
}
