
"use strict";

/** Base class for all objects on a map */
function Map_Entity() {
	$.extend(this, EventHooks);
}

Map_Entity.prototype.initialise = function(eid, properties) {
	
	this.eid = eid;
	this.isRenderable = false;
	this.properties = properties;
	
	this.position = vec3.create();
}

Map_Entity.prototype.destroy = function() {

	// Fire a destroy event to any listeners 
	this.fire('destroy');
	
	// Nuke the entity itself
	fro.world.remove(this);
}

Map_Entity.prototype.getPosition = function() {
	return this.position;
}

Map_Entity.prototype.setPosition = function(x, y) {

	var pos = this.getPosition();
	
	// if it's in the form of setPosition(vec3) 
	if (y == undefined) {
		
		pos[0] = Math.floor(x[0]);
		pos[1] = Math.floor(x[1]);
		
	} else {
	
		pos[0] = Math.floor(x);
		pos[1] = Math.floor(y);
	}
}

/**
 * @return bool 
 */
Map_Entity.prototype.collides = function(r) {
	return false;
}

/**
 * @param rect r
 */
Map_Entity.prototype.getBoundingBox = function(r) {
	return rect.create(0,0,0,0);
}
