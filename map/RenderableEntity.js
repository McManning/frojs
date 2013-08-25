
"use strict";

/** Base class for all objects on a map */
function Map_RenderableEntity() {}
Map_RenderableEntity.prototype = new Map_Entity();

Map_RenderableEntity.prototype.initialise = function(eid, properties) {
	Map_Entity.prototype.initialise.call(this, eid, properties);

	this.visible = true; // Whether or not we should draw this entity this frame
	this.isRenderable = true; // Entities inherited from this type will be added to the render queue
	this.zorder = 0;
	
	this.offset = vec3.create();
}

Map_RenderableEntity.prototype.destroy = function() {
	Map_Entity.prototype.destroy.call(this);
}
