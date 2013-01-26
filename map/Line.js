
"use strict";

/** 
 * A line rendered onto the map. Usually for debugging
 */
function Map_Line(id, properties) {

	this.id = id;

	this.renderable = new RenderableLine();
	this.renderable.setStyle('img/line.png');
	this.renderable.setWidth(13);
	
	this.renderable.setStart(properties.x, properties.y);
	this.renderable.setEnd(properties.dx, properties.dy);
	
	this.zorder = properties.z;
	this.timeToLive = properties.ttl;
		
	var line = this;
	
	fro.timers.addTimeout(this, function() {
		
		// @todo ent removal
		console.log('I would be deleted, but there is no entity removal yet');
		console.log(line);
		
	}, this.timeToLive);
}

Map_Line.prototype = new Map_Entity();

Map_Line.prototype.render = function() {

	this.renderable.render();
}

/**
 * Returns a reference to our renderables vector position
 * @return vec3
 */
Map_Line.prototype.getPosition = function() {
	return this.renderable.position;
}

/**
 * Returns a reference to our renderables vector offset position
 * @return vec3
 */
Map_Line.prototype.getOffset = function() {
	return this.renderable.offset;
}

/**
 * @param rect r
 */
Map_Line.prototype.getBoundingBox = function(r) {
	
	// @todo logic
}


