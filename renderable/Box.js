
"use strict";

function RenderableBox() {

	this.lineWidth = 33;
	this.lines = new Array();
	this.bounds = rect.create();
}

RenderableBox.prototype.setStyle = function(url) {

	fro.resources.getTexture(url, this, 
			function(texture) {
				this.loadTexture(texture);
			},
			function(texture) {
				// @todo this
			}
		);
}

RenderableBox.prototype.setRect = function(r) {

	rect.set(r, this.bounds);

	// Generate the primitives, if we haven't already
	if (this.lines.length < 1) {
	
		for (var i = 0; i < 4; i++) {
			var line = new RenderableLine();
			
			line.setWidth(this.lineWidth);
			line.loadTexture(this.texture);
			
			this.lines.push(line);
		}
	}
	
	// Reposition lines around the rect
	var x = r[0], y = r[1], w = r[2], h = r[3];
	
	// top
	this.lines[0].setStart( x, y + h );
	this.lines[0].setEnd( x + w, y + h );
	
	// right
	this.lines[1].setStart( x + w, y + h );
	this.lines[1].setEnd( x + w, y );
	
	// bottom
	this.lines[2].setStart( x + w, y );
	this.lines[2].setEnd( x, y );
	
	// left
	this.lines[3].setStart( x, y );
	this.lines[3].setEnd( x, y + h );
}

RenderableBox.prototype.setLineWidth = function(width) {
	
	this.lineWidth = width;
	for (var i in this.lines) {
		this.lines[i].setWidth(width);
	}
}

RenderableBox.prototype.render = function() {

	for (var i in this.lines) {
		this.lines[i].render();
	}
}

RenderableBox.prototype.loadTexture = function(texture) {
	
	this.texture = texture;
	
	for (var i in this.lines) {
		this.lines[i].loadTexture(texture);
	}
}
