
"use strict";

/** 
 * A visible object placed on the map, with its own image/animation 
 * and collision data 
 */
function Map_Prop(id, properties) {

	this.id = id;
	this.required = properties.required;
	
	this.renderable = new RenderableImage(properties.w, properties.h);
	this.renderable.useSrcAlpha = true;
	this.renderable.textureStretching = false;
	this.renderable.useAlphaKey = (properties.alphakey == 1);

	var pos = this.getPosition();
	pos[0] = properties.x;
	pos[1] = properties.y;
	pos[2] = 0;
	
	this.width = properties.w;
	this.height = properties.h;
	this.zorder = properties.z;

	if (properties.collisions) {
		this.loadCollisions(properties.collisions);
		fro.log.debug('Collisions for ' + id + ': ' + this.collisions.length);
	}

	if (properties.offset_x != undefined)
		this.renderable.offset[0] = properties.offset_x;
	
	if (properties.offset_y != undefined)
		this.renderable.offset[1] = properties.offset_y;
	
	/* 	If there's a delay key, this prop is animated.
		Our dimensions will define a clip of the image, rather than the whole thing
	*/
	if (properties.delay != undefined && properties.delay > 0) {
		this.delay = properties.delay;
		this.frame = 0;
		
		this.renderable.setClip(0, 0, this.width, this.height);
		
		// @todo fix timer to account for deleted entities
		fro.timers.addInterval(this, this.animate, this.delay);
		
	} else {
		this.delay = 0;
	}
		
	// @todo not even have position info for a renderable

	var resource = fro.resources.load(properties.texture);
	
	if (resource.isLoaded()) { 
	
		// If it's already cached, load immediately
		this.renderable.setTexture(resource.getTexture());
	
	} else {
	
		// Bind and wait for the image to be loaded
		var self = this;
		resource.bind('onload', function() {

			self.renderable.setTexture(this.getTexture());
		})
		.bind('onerror', function() {
		
			// @todo do something, revert, load default, etc.
			fro.log.error('Prop Image Load Error');
			fro.log.error(this);
		});
	}

	fro.log.debug('New prop "' + id + '" at ' + vec3.str(pos));
}

Map_Prop.prototype = new Map_Entity();

/** 
 * Our loaded state depends on the loaded texture 
 * @return boolean
 */
Map_Prop.prototype.isLoaded = function() {
	return (this.renderable.texture != undefined);
}

Map_Prop.prototype.loadCollisions = function(collisions) {
	
	this.collisions = new Array();
	
	// Map collisions to rects
	for (var i = 0; i < collisions.length; i += 4) {
	
		var r = rect.create([
				collisions[i],
				collisions[i+1],
				collisions[i+2],
				collisions[i+3]
			]);

		this.collisions.push(r);
	}
}

Map_Prop.prototype.animate = function() {
	
	if (this.delay > 0 && this.renderable.texture) {
	
		this.frame = this.frame + 1;

		// Determine if the next calculated frame is actually within the source image
		if (this.renderable.getTextureWidth() >= (this.width * (this.frame + 1))) {
		
			this.renderable.setClip(this.frame * this.width, 0);
			
		} else { // loop to the start
		
			this.frame = 0;
			this.renderable.setClip(0, 0);
		}
	}
}

/** 
 * Returns true if this prop failed to properly load it's resources 
 * @return boolean
 */
Map_Prop.prototype.failedToLoad = function() {
	return this.error;
}

Map_Prop.prototype.render = function() {

	this.renderable.render();

}

Map_Prop.prototype.think = function() {
	
	// do stuff
}

/**
 * Returns a reference to our renderables vector position
 * @return vec3
 */
Map_Prop.prototype.getPosition = function() {
	return this.renderable.position;
}

/**
 * Returns a reference to our renderables vector offset position
 * @return vec3
 */
Map_Prop.prototype.getOffset = function() {
	return this.renderable.offset;
}

/**
 * @param rect r
 */
Map_Prop.prototype.getBoundingBox = function(r) {
	
	// @todo factor in rotations and scaling
	// and utilize this.renderable.getTopLeft(), getBottomRight(), etc
	
	r[0] = this.renderable.position[0] + this.renderable.offset[0];
	r[1] = this.renderable.position[1] + this.renderable.offset[1];
	r[2] = this.width;
	r[3] = this.height;
}

/**
 * @param rect r
 * @return boolean
 */
Map_Prop.prototype.collides = function(r) {
	
	// @todo solidity flag for the optional "collides with me but 
	// I'm not solid, so it's a trigger collide" or something... ?
	
	// offset r based on our map position, since each collision rectangle
	// is relative to this entity instance's location
	
	var nr = rect.create(r);
	var pos = this.getPosition();
	nr[0] -= pos[0];
	nr[1] -= pos[1];

	var collisions = this.collisions;
	if (collisions) {
	
		for (var index in collisions) {
			if (rect.intersects(nr, collisions[index]))
				return true;
		}
	}
	
	return false;
}

