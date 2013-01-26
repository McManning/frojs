

"use strict";

var BUBBLE_ZORDER = 9999; // Above everything else
var BUBBLE_UPDATE_INTERVAL = 100; // for tracking a followed entity

function Map_Bubble(id, properties) {
	/*
		Properties:
			ttl: seconds
			text: string
			entity: object
			x: number
			y: number
			And any property that can be passed into getBubbleTexture (height, family, etc)
	*/
	
	this.id = id;

	// Generate bubble texture
	var texture = fro.resources.getBubbleTexture(properties.text, properties);
	
	this.renderable = new RenderableImage();
	this.renderable.setTexture(texture, true);
	this.renderable.useAlphaKey = true;
	//this.renderable.rotation = Math.random() * 2 - 1;
	
	this.width = this.renderable.width;
	this.height = this.renderable.height;
	this.zorder = BUBBLE_ZORDER;
	
	this.renderable.offset[0] = 0;
	this.renderable.offset[1] = Math.floor(this.height / 2);
	
	var pos = this.getPosition();
	pos[0] = properties.x;
	pos[1] = properties.y;

}

Map_Bubble.prototype = new Map_Entity();

Map_Bubble.prototype.render = function() {
	
	this.renderable.render();
}

/**
 * Returns a reference to our renderables vector position
 * @return vec3
 */
Map_Bubble.prototype.getPosition = function() {
	return this.renderable.position;
}

/**
 * Returns a reference to our renderables vector offset position
 * @return vec3
 */
Map_Bubble.prototype.getOffset = function() {
	return this.renderable.offset;
}

/**
 * @param rect r
 */
Map_Bubble.prototype.getBoundingBox = function(r) {

	// @todo factor in rotations and scaling
	// and utilize this.renderable.getTopLeft(), getBottomRight(), etc
	
	r[0] = this.renderable.position[0] + this.renderable.offset[0];
	r[1] = this.renderable.position[1] + this.renderable.offset[1];
	r[2] = this.width;
	r[3] = this.height;
}



