
"use strict";

function RenderableLineList() {

	this.width = 33;
	this.lines = new Array();
}

RenderableLineList.prototype.setStyle = function(url) {

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
			fro.log.error('LineList Image Load Error');
			fro.log.error(this);
		});
	}
}

RenderableLineList.prototype.setWidth = function(width) {
	
	this.width = width;
	for (var i in this.lines) {
		this.lines[i].setWidth(width);
	}
}

/**
 * @param array list A one dimensional array of x, y points for the start of each line
 *   If closed == false, the last pair of points will be the end of the last line
 * @param boolean closed If true, a line will be generated between the first and last points
 */
RenderableLineList.prototype.setLines = function(list, closed) {
	
	if (list.length < 4)
		throw 'Invalid number of points';

	// start point
	var x = list[0];
	var y = list[1];

	for (var i = 2; i < list.length - 1; i += 2)
	{
		var line = new RenderableLine();
		line.setWidth(this.width);
		line.loadTexture(this.texture);

		line.setStart(x, y);
		
		x = list[i];
		y = list[i+1];

		line.setEnd(x, y);
		
		this.lines.push(line);
	}

	if (closed) {
		
		// Add a line between the first and last coordinates
		line = new RenderableLine();
		line.setWidth(this.width);
		line.loadTexture(this.texture);
		
		line.setStart( list[list.length-2], list[list.length-1] );
		line.setEnd( list[0], list[1] );
		
		this.lines.push(line);
	}
}

RenderableLineList.prototype.render = function() {

	for (var i in this.lines) {
		this.lines[i].render();
	}
}

RenderableLineList.prototype.setTexture = function(texture) {
	
	this.texture = texture;
	
	for (var i in this.lines) {
		this.lines[i].setTexture(texture);
	}
}