
"use strict";

/** Base class for all objects on a map */
function Map_Entity() {}

Map_Entity.prototype.initialise = function(eid, properties) {
	
	this.eid = eid;
	this.isRenderable = false;
	this.properties = properties;
	
	$.extend(this, EventHooks);
}

Map_Entity.prototype.destroy = function() {

	// Fire a destroy event to any listeners 
	this.fire('destroy');
	
	// Nuke the entity itself
	fro.world.remove(this);
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
