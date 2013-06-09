
"use strict";

/*
	Line primitive
	
	Usage example:
	
	line = new RenderableLine();
	line.setStyle('img/line.png');
	line.setWidth(33);
	line.setPoints(0, 0, 100, 100);
		or
	line.setStart(0, 0);
	line.setEnd(100, 100);
	
	line.render();
*/

function RenderableLine() {

	this.color = [0.0, 0.0, 0.0, 0.0];
	this.HSVShift = vec3.create();
	this.useSrcAlpha = true;
	
	// @todo something with these, actually USE position, or something.
	// (can offset end from position)
	this.position = vec3.create();
	this.width = 33;

	this.end = vec3.create();
	
	this.updateVertexBuffer = true;

	this.buildTextureBuffer();
}

RenderableLine.prototype = new Renderable();

RenderableLine.prototype.setStyle = function(url) {
	
	var resource = fro.resources.load(url);
	
	if (resource.isLoaded()) {
	
		// If it's already cached, load immediately
		this.setTexture(resource.getTexture());
	
	} else {
	
		// Bind and wait for the image to be loaded
		var self = this;
		resource.bind('onload', function() {

			self.setTexture(this.getTexture());
		})
		.bind('onerror', function() {
		
			// @todo do something, revert, load default, etc.
			fro.log.error('Line Image Load Error');
			fro.log.error(this);
		});
	}
}

RenderableLine.prototype.setWidth = function(width) {
	this.width = width;
	this.updateVertexBuffer = true;
}

/**
 * Creates a line from (x, y) to (dx, dy)
 */
RenderableLine.prototype.setPoints = function(x, y, dx, dy) {
	this.position[0] = x;
	this.position[1] = y;
	this.end[0] = dx;
	this.end[1] = dy;

	this.updateVertexBuffer = true;
}

RenderableLine.prototype.setStart = function(x, y) {
	this.position[0] = x;
	this.position[1] = y;
	
	this.updateVertexBuffer = true;
}

RenderableLine.prototype.setEnd = function(x, y) {
	this.end[0] = x;
	this.end[1] = y;

	this.updateVertexBuffer = true;
}

RenderableLine.prototype.render = function() {

	this.beginDraw();

	// if we're flagged for an update, do it
	// @todo is it an acceptable idea to update the buffer DURING rendering cycle?
	// I.. wouldn't think so... Refactor?
	if (this.updateVertexBuffer) {
		this.updateVertexBuffer = false;
		this.buildVertexBuffer();
	}
	
	// Set up buffers to use
	gl.bindBuffer(gl.ARRAY_BUFFER, this.vbuf);
	gl.vertexAttribPointer(fro.shaderProgram.vertexPositionAttribute, 
							this.vbuf.itemSize, gl.FLOAT, false, 0, 0);
	
	gl.bindBuffer(gl.ARRAY_BUFFER, this.tbuf);
	gl.vertexAttribPointer(fro.shaderProgram.textureCoordAttribute, 
							this.tbuf.itemSize, gl.FLOAT, false, 0, 0);
	
	// @todo relocate!
	gl.uniform2f(fro.shaderProgram.clipUniform, 0, 0);
	
	if (this.texture) {
		gl.activeTexture(gl.TEXTURE0);
		gl.bindTexture(gl.TEXTURE_2D, this.texture);
		gl.uniform1i(fro.shaderProgram.samplerUniform, 0);
	}
	
	gl.setMatrixUniforms();
	gl.drawArrays(gl.TRIANGLE_STRIP, 0, this.vbuf.itemCount);
	
	this.endDraw();
}

RenderableLine.prototype.setTexture = function(texture) {
	
	this.texture = texture;
}

RenderableLine.prototype.buildVertexBuffer = function() {
	
	if (this.vbuf)
		gl.deleteBuffer(this.vbuf);

	this.vbuf = gl.createBuffer();
	gl.bindBuffer(gl.ARRAY_BUFFER, this.vbuf);

	var bx = this.end[0] - this.position[0];
	var by = this.end[1] - this.position[1];

	var t = Math.atan2(-by, -bx) -  Math.PI / 2;
	var wc = this.width * 0.5 * Math.cos(t);
	var ws = this.width * 0.5 * Math.sin(t);

	gl.bufferData(gl.ARRAY_BUFFER, 
		new glMatrixArrayType([
			bx - wc, by - ws, 0.0, // bottom right
			-wc, -ws, 0.0, // top right
			bx + wc, by + ws, 0.0, // bottom left
			wc, ws, 0.0 // top left
		]), gl.STATIC_DRAW);
		
	this.vbuf.itemSize = 3;
	this.vbuf.itemCount = 4;

}

RenderableLine.prototype.buildTextureBuffer = function() {

	if (this.tbuf)
		gl.deleteBuffer(this.tbuf);
		
	// Create texture mapping
	this.tbuf = gl.createBuffer();
	gl.bindBuffer(gl.ARRAY_BUFFER, this.tbuf);

	gl.bufferData(gl.ARRAY_BUFFER, 
			new glMatrixArrayType([
				1.0, 0.0,
				1.0, 1.0,
				0.0, 0.0,
				0.0, 1.0
			]), gl.STATIC_DRAW);
		
	this.tbuf.itemSize = 2;
	this.tbuf.itemCount = 4;

}
