
"use strict";

var gl = null;

fro.renderer = {
	
	initialize : function(canvas) {
		
		try {
			
			var ctx = canvas.getContext('experimental-webgl');
			gl = ctx; //WebGLDebugUtils.makeDebugContext(ctx, undefined, validateNoneOfTheArgsAreUndefined);
			
			gl.viewportWidth = canvas.width;
			gl.viewportHeight = canvas.height;

			// Add some matrix manipulation helpers
			gl.mvMatrix = mat4.create();
			gl.pMatrix = mat4.create();
			
			gl.clearColor(0.56, 0.25, 0.98, 1.0);	

			gl.mvMatrixStack = new Array();
			
			gl.mvPopMatrix = function() {
				if (gl.mvMatrixStack.length == 0) {
					throw 'Invalid popMatrix!';
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
				gl.uniformMatrix4fv(fro.shaderProgram.pMatrixUniform, false, gl.pMatrix);
				gl.uniformMatrix4fv(fro.shaderProgram.mvMatrixUniform, false, gl.mvMatrix);
			}
			
		} catch (e) {
			fro.log.error(e.message);
		}
		
		if (!gl) {
			throw 'No WebGL Support. Sux2bu';
		}
	},
	
	loadShaders : function(vs_resource, fs_resource) {
		
		// @todo, eventually context switching
		if (fro.shaderProgram != null) {
			gl.deleteProgram(fro.shaderProgram);
			fro.shaderProgram = null;
		}
	
		var sp = gl.createProgram();
		
		// Compile Vertex Shader
		var vs = gl.createShader(gl.VERTEX_SHADER);
		gl.shaderSource(vs, vs_resource.data);
		gl.compileShader(vs);
		
		this.vs = vs;
		
		if (!gl.getShaderParameter(vs, gl.COMPILE_STATUS)) {
			throw 'Vertex Shader Error: ' + gl.getShaderInfoLog(vs);
		} else {
			gl.attachShader(sp, vs);
		}
			
		// Compile Fragment Shader
		var fs = gl.createShader(gl.FRAGMENT_SHADER);
		gl.shaderSource(fs, fs_resource.data);
		gl.compileShader(fs);
		
		this.fs = fs;
		
		if (!gl.getShaderParameter(fs, gl.COMPILE_STATUS)) {
			throw 'Fragment Shader Error: ' + gl.getShaderInfoLog(fs);
		} else {
			gl.attachShader(sp, fs);
		}
		
		// Link and use
		gl.linkProgram(sp);
		
		if (!gl.getProgramParameter(sp, gl.LINK_STATUS)) {
			throw 'Could not initialize shaders';
		}

		gl.useProgram(sp);

		// Hook variables
		// @todo dynamic logic
		sp.vertexPositionAttribute = gl.getAttribLocation(sp, 'aVertexPosition');
		gl.enableVertexAttribArray(sp.vertexPositionAttribute);
		
		sp.textureCoordAttribute = gl.getAttribLocation(sp, 'aTextureCoord');
		gl.enableVertexAttribArray(sp.textureCoordAttribute);

		sp.colorUniform = gl.getUniformLocation(sp, 'uColor');
		sp.clipUniform = gl.getUniformLocation(sp, 'uClip');
		sp.pMatrixUniform = gl.getUniformLocation(sp, 'uPMatrix');
		sp.mvMatrixUniform = gl.getUniformLocation(sp, 'uMVMatrix');
		sp.samplerUniform = gl.getUniformLocation(sp, 'uSampler');
		sp.HSVShiftUniform = gl.getUniformLocation(sp, 'uHSVShift');
		sp.alphaKeyUniform = gl.getUniformLocation(sp, 'uUseAlphaKey');
		sp.timeUniform = gl.getUniformLocation(sp, 'uTime');
		sp.cameraPositionUniform = gl.getUniformLocation(sp, 'uCamera');
		
		fro.shaderProgram = sp;
	},
	
	// @todo the functionality of changing active shaders.
	// Need to take in account that we probably need to link a vs/fs to 
	// the same program, causing duplicates if we have duplicates in sets.
	// (ie: shared vs's)
}
