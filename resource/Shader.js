
"use strict";

function ShaderResource() {}
ShaderResource.prototype = new Resource();

ShaderResource.prototype.load = function(json) {
	Resource.prototype.load.call(this, json);
	
	/*
		Expected JSON parameters:
		vertex - vertex shader source url
		fragment - fragment shader source url
		uniforms = [
			uniform names
		],
		attributes = [
			attribute names
		]
	*/
	
	var id;
	
	this.uniforms = new Array();
	this.attributes = new Array();
	
	// Will be loaded in from URL sources
	this.fragmentShaderSource = false;
	this.vertexShaderSource = false;
	
	// Add some values expected of all shaders
	//this.attributes['aVertexPosition'] = false;
	//this.attribute['aTextureCoord'] = false;
	this.uniforms['uPMatrix'] = false;
	this.uniforms['uMVMatrix'] = false;
	
	for (id in json.uniforms) {
		this.uniforms[id] = false;
	}
	
	for (id in json.attributes) {
		this.attributes[id] = false;
	}
	
	// for now, only support strings in shader sources
	if (typeof json.fragment == 'object') {
		this.fragmentShaderSource = '';
		
		for (var line in json.fragment) {
			this.fragmentShaderSource += json.fragment[line] + "\n";
		}
	} else {
		throw new Error('Only supporting strings for fragment shaders for now');
	}
	
	if (typeof json.vertex == 'object') {
		this.vertexShaderSource = '';
		
		for (var line in json.vertex) {
			this.vertexShaderSource += trim(json.vertex[line]) + "\n";
		}
	} else {
		throw new Error('Only supporting strings for vertex shaders for now');
	}
	
	this.compileProgram();
}

/**
 * Loads uniforms and attribute locations from the shader program
 */
ShaderResource.prototype.bindParameters = function() {
	var id;
	
	// @todo error testing for non-existing uniforms/attributes?
	
	for (id in this.uniforms) {
		this.uniforms[id] = gl.getUniformLocation(this.program, id);
	}
	
	for (id in this.attributes) {
		this.attributes[id] = gl.getAttribLocation(this.program, id);
		gl.enableVertexAttribArray(this.attributes[id]);
	}
}

ShaderResource.prototype.compileProgram = function() {
	
	if (!this.vertexShaderSource || !this.fragmentShaderSource) {
		throw new Error('Program ' + this.id + ' missing shader sources');
	}
	
	if (this.program) {
		gl.deleteProgram(this.program);
	}
	
	var program = gl.createProgram();
	
	// Compile Vertex Shader
	var vs = gl.createShader(gl.VERTEX_SHADER);
	gl.shaderSource(vs, this.vertexShaderSource);
	gl.compileShader(vs);
	
	if (!gl.getShaderParameter(vs, gl.COMPILE_STATUS)) {
		throw new Error('Program ' + this.id + ' Vertex Shader Error: ' + gl.getShaderInfoLog(vs));
	} else {
		gl.attachShader(program, vs);
	}
	
	// Compile Fragment Shader
	var fs = gl.createShader(gl.FRAGMENT_SHADER);
	gl.shaderSource(fs, this.fragmentShaderSource);
	gl.compileShader(fs);
	
	if (!gl.getShaderParameter(fs, gl.COMPILE_STATUS)) {
		throw new Error('Program ' + this.id + ' Fragment Shader Error: ' + gl.getShaderInfoLog(fs));
	} else {
		gl.attachShader(program, fs);
	}
	
	// Link and use
	gl.linkProgram(program);

	if (!gl.getProgramParameter(sp, gl.LINK_STATUS)) {
		throw new Error('Could not initialize shaders');
	}

	this.program = program;
}

ShaderResource.prototype.isLoaded = function() {
	return true;
}

ShaderResource.prototype.getAttrib = function(name) {
	if (!(name in this.attributes)) {
		throw new Error('Attribute ' + name + ' does not exist in program ' + this.id);
	}
	
	return this.attributes[name];
}

ShaderResource.prototype.getUniform = function(name) {
	if (!(name in this.uniforms)) {
		throw new Error('Uniform ' + name + ' does not exist in program ' + this.id);
	}
	
	return this.uniforms[name];
}

ShaderResource.prototype.getProgram = function() {
	return this.program;
}

ShaderResource.prototype.bindTexture = function(uniform, texture) {
	
	// @todo the ability to bind multiple textures at once, and assign each
	// to a different texture index based on the uniform selected
	
	gl.activeTexture(gl.TEXTURE0);
	gl.bindTexture(gl.TEXTURE_2D, texture);
	gl.uniform1i(this.getUniform(uniform), 0);
}
