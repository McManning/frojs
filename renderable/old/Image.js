
"use strict";

function RenderableImage(width, height) {
	this.width = width;
	this.height = height;
	this.flipped = false;
	this.color = [0.0, 0.0, 0.0, 0.0];
	this.clip = rect.create();
	this.offset = vec3.create(); // Offset of render from origin (center)
	this.textureStretching = true;
	
	this.HSVShift = vec3.create();
	this.position = vec3.create();

	this.texture = fro.resources.getDefaultTexture();

	this.buildVertexBuffer();
	this.buildTextureBuffer();

	// @todo create normal mapping
}

RenderableImage.prototype = new Renderable();

RenderableImage.prototype.render = function() {

	this.beginDraw();

	mat4.translate(gl.mvMatrix, this.offset);
	
	// Set up buffers to use
	gl.bindBuffer(gl.ARRAY_BUFFER, this.vbuf);
	gl.vertexAttribPointer(fro.shaderProgram.vertexPositionAttribute, 
							this.vbuf.itemSize, gl.FLOAT, false, 0, 0);
	
	gl.bindBuffer(gl.ARRAY_BUFFER, this.tbuf);
	gl.vertexAttribPointer(fro.shaderProgram.textureCoordAttribute, 
							this.tbuf.itemSize, gl.FLOAT, false, 0, 0);
	var texture;
	if (this.texture)
		texture = this.texture;
	else
		texture = fro.resources.defaultTexture;

	gl.activeTexture(gl.TEXTURE0);
	gl.bindTexture(gl.TEXTURE_2D, texture);
	gl.uniform1i(fro.shaderProgram.samplerUniform, 0);
	
	gl.uniform2f(fro.shaderProgram.clipUniform, this.clip[0], this.clip[1]);

	gl.setMatrixUniforms();
	gl.drawArrays(gl.TRIANGLE_STRIP, 0, this.vbuf.itemCount);
	
	this.endDraw();
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

RenderableImage.prototype.setScale = function(val) {
	this.scale = val;
	// @todo put in shader
	
	this.buildVertexBuffer();
}

RenderableImage.prototype.resize = function(w, h) {
	
	this.width = w;
	this.height = h;

	this.buildVertexBuffer();
}

RenderableImage.prototype.buildVertexBuffer = function() {
	
	if (this.vbuf)
		gl.deleteBuffer(this.vbuf);
		
	var w = this.width * this.scale * 0.5;
	var h = this.height * this.scale * 0.5;

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
	
	if (this.flipped) {
		throw new Error('@todo implement in the shader');
		
	} else {

		gl.bufferData(gl.ARRAY_BUFFER, 
				new glMatrixArrayType([
					x+w, y,
					x+w, y+h,
					x, y,
					x, y+h
					
				]), gl.STATIC_DRAW);
	}
		
	this.tbuf.itemSize = 2;
	this.tbuf.itemCount = 4;

}

RenderableImage.prototype.flipHorizontal = function() {
	this.flipped = !this.flipped;
}

/** Set a specific rectangle of the texture to be used for rendering,
	rather than the entire texture
	
@param x position to start the clip (from the left), in pixels
@param y position to start the clip (from the bottom), in pixels

*/
RenderableImage.prototype.setClip = function(x, y) {

	if (!this.texture)
	{
		fro.log.warning('Trying to set clip without texture');
		this.clip[0] = 0;
		this.clip[1] = 0;
		this.clip[2] = 1;
		this.clip[3] = 1;
	}
	else
	{
		var w = this.width;
		var h = this.height;
	
		// convert and apply
		this.clip[2] = (w == 0) ? 1.0 : w / this.texture.image.width;
		this.clip[3] = (h == 0) ? 1.0 : h / this.texture.image.height;
		this.clip[0] = x / this.texture.image.width;
		this.clip[1] = 1.0 - this.clip[3] - y / this.texture.image.height;
	}
}


