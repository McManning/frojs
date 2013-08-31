
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
	
}
