
"use strict";
	
function RenderableImage(width, height) {
	
	this.width = width;
	this.height = height;
	this.useAlphaKey = false;
	
	this.textureStretching = true;
	this.texture = fro.resources.getDefaultTexture();

	this.buildVertexBuffer();
	this.buildTextureBuffer();
}

RenderableImage.prototype.render = function(position, rotation, clip, HSVShift) {

	// Begin draw, setup
	gl.mvPushMatrix();

	mat4.translate(gl.mvMatrix, position);
	
	if (rotation) {
		mat4.rotateZ(gl.mvMatrix, rotation);
	}
	
	gl.uniform1i(fro.shaderProgram.alphaKeyUniform, this.useAlphaKey);
	
	// Unused
	gl.uniform4f(fro.shaderProgram.colorUniform, 0,0,0,0);
	
	if (HSVShift) {
		gl.uniform3f(fro.shaderProgram.HSVShiftUniform, 
					HSVShift[0], HSVShift[1], 
					HSVShift[2]);
	} else {
		gl.uniform3f(fro.shaderProgram.HSVShiftUniform, 0, 0, 0);
	}
	
	// Draw

	// Set up buffers to use
	gl.bindBuffer(gl.ARRAY_BUFFER, this.vbuf);
	gl.vertexAttribPointer(fro.shaderProgram.vertexPositionAttribute, 
							this.vbuf.itemSize, gl.FLOAT, false, 0, 0);
	
	gl.bindBuffer(gl.ARRAY_BUFFER, this.tbuf);
	gl.vertexAttribPointer(fro.shaderProgram.textureCoordAttribute, 
							this.tbuf.itemSize, gl.FLOAT, false, 0, 0);
	var texture;
	if (this.texture) {
		texture = this.texture;
	} else {
		texture = fro.resources.defaultTexture;
	}
	
	gl.activeTexture(gl.TEXTURE0);
	gl.bindTexture(gl.TEXTURE_2D, texture);
	gl.uniform1i(fro.shaderProgram.samplerUniform, 0);
	
	if (clip) {

		var h = (this.height == 0) ? 1.0 : this.height / this.texture.image.height;
		var x = clip[0] / this.texture.image.width;
		var y = 1.0 - h - clip[1] / this.texture.image.height;

		gl.uniform2f(fro.shaderProgram.clipUniform, x, y);
	} else {
		gl.uniform2f(fro.shaderProgram.clipUniform, 0, 0);
	}
	
	gl.setMatrixUniforms();
	gl.drawArrays(gl.TRIANGLE_STRIP, 0, this.vbuf.itemCount);
	

	// End draw, reset
	gl.mvPopMatrix();
}

/** 
 * Called after a texture image has finished downloading, or we load a custom
 * texture from a non-image url source
 *
 * @param bool fitToTexture if true, this image will resize itself to the texture's size 
 */
RenderableImage.prototype.setTexture = function(texture, fitToTexture) {
	
	this.texture = texture;
	
	// Define dimensions if not defined already
	if (fitToTexture) {
		this.width = texture.image.width;
		this.height = texture.image.height;
		
		// @todo proper "should I rebuild vertex buffer?" calculations
		this.buildVertexBuffer();
	}
	
	this.buildTextureBuffer();
}

RenderableImage.prototype.getTextureWidth = function() {
	return this.texture.image.width;
}

RenderableImage.prototype.getTextureHeight = function() {
	return this.texture.image.height;
}

RenderableImage.prototype.resize = function(w, h) {
	
	this.width = w;
	this.height = h;

	this.buildVertexBuffer();
}

RenderableImage.prototype.buildVertexBuffer = function() {
	
	if (this.vbuf)
		gl.deleteBuffer(this.vbuf);
		
	var w = this.width * 0.5;
	var h = this.height * 0.5;

	this.vbuf = gl.createBuffer();
	gl.bindBuffer(gl.ARRAY_BUFFER, this.vbuf);

	// triangle strip form (since there's no GL_QUAD)
	gl.bufferData(gl.ARRAY_BUFFER, 
		new glMatrixArrayType([
			w, -h, 0.0, // bottom right
			w, h, 0.0, // top right
			-w, -h, 0.0, // bottom left
			-w, h, 0.0 // top left
		]), gl.STATIC_DRAW);
		
		
	this.vbuf.itemSize = 3;
	this.vbuf.itemCount = 4;
}

RenderableImage.prototype.buildTextureBuffer = function() {

	if (this.tbuf)
		gl.deleteBuffer(this.tbuf);
		
	// Create texture mapping
	this.tbuf = gl.createBuffer();
	gl.bindBuffer(gl.ARRAY_BUFFER, this.tbuf);

	var x = 0.0, y = 0.0, w = 1.0, h = 1.0;
	if (this.texture && !this.textureStretching)
	{
		w = this.width / this.texture.image.width;
		h = this.height / this.texture.image.height;
	}

	gl.bufferData(gl.ARRAY_BUFFER, 
			new glMatrixArrayType([
				x+w, y,
				x+w, y+h,
				x, y,
				x, y+h
				
			]), gl.STATIC_DRAW);

	this.tbuf.itemSize = 2;
	this.tbuf.itemCount = 4;
}
