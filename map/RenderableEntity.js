
"use strict";

/** Base class for all objects on a map */
function Map_RenderableEntity() {}
Map_RenderableEntity.prototype = new Map_Entity();

Map_RenderableEntity.prototype.initialise = function(eid, properties) {
	Map_Entity.prototype.initialise.call(this, eid, properties);

	this.visible = true; // Whether or not we should draw this entity this frame
	this.isRenderable = true; // Entities inherited from this type will be added to the render queue
	this.zorder = 0;
	
	this.position = vec3.create();
	this.offset = vec3.create();
	
	$.extend(this, EventHooks);
}

Map_RenderableEntity.prototype.destroy = function() {

	// Fire a destroy event to any listeners 
	this.fire('destroy');
}

Map_RenderableEntity.prototype.getPosition = function() {
	return this.position;
}

/**
 * @return bool 
 */
Map_RenderableEntity.prototype.collides = function(r) {
	return false;
}

/**
 * @param rect r
 */
Map_RenderableEntity.prototype.getBoundingBox = function(r) {
	
}
