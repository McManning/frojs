

"use strict";

var BUBBLE_ZORDER = 9999; // Above everything else
//var BUBBLE_UPDATE_INTERVAL = 100; // for tracking a followed entity
var CHAT_BUBBLE_MIN_TTL = 3000;

// @todo this is just temp until a plugin architecture is decided on
// Just wanted bubble stuff to gtfo of the world object
var bubbleProperties = {
	style : {
		family: 'Helvetica',
		color: '#000',
		height: 12,
		max_width: 256,
		min_width: 25,
		padding: 7,
		bg_color1: '#BBB',
		bg_color2: '#FFF',
		st_width: 1.5,
		st_color1: '#000',
		st_color2: '#000',
	},
	
	// After world initialisation, and we do plugin initialisation, we skim world
	// properties to determine if there's a style override for the bubbles plugin
	
	init : function() {
	
		// If we defined an override for bubble styles, override any properties defined
		if ('bubble_style' in fro.world.properties) {
			
			for (var key in this.style) {
				if (key in fro.world.properties.bubble_style) {
					this.style[key] = fro.world.properties.bubble_style[key];
				}
			}
		}
	}
}

function Map_Bubble() {}
Map_Bubble.prototype = new Map_Entity();

Map_Bubble.prototype.initialise = function(eid, properties) {
	Map_Entity.prototype.initialise.call(this, eid, properties);
	
	// Initially hide this bubble and only display when the entity speaks
	this.visible = false;
	this.zorder = BUBBLE_ZORDER;
	
	this.trackedEntity = properties.entity;

	// bind events to our tracked entity (talking, moving, deleting)
	this.trackedEntity.bind('say.bubble', this, function(message) {

		this.display(message);
	
	}).bind('move.bubble, avatar.bubble', this, function() {
		
		this._updatePosition();
		
	}).bind('destroy.bubble', this, function() {
		
		// Also remove this attached bubble entity
		fro.world.removeEntity(this);
	});
}

Map_Bubble.prototype.display = function(text) {
	
	/*
		this.properties:
			ttl: seconds
			text: string
			entity: object
			x: number
			y: number
			And any property that can be passed into getBubbleTexture (height, family, etc)
	*/
	
	// Generate bubble texture
	var texture = fro.resources.getBubbleTexture(text, bubbleProperties.style);
	
	if (!this.renderable) {
		this.renderable = new RenderableImage();
		this.renderable.useAlphaKey = true;
	}

	this.renderable.setTexture(texture, true);
	//this.renderable.rotation = Math.random() * 2 - 1;
	
	this.width = this.renderable.width;
	this.height = this.renderable.height;
	
	this.renderable.offset[0] = 0;
	this.renderable.offset[1] = Math.floor(this.height / 2);

	this.visible = true;

	this._updatePosition();
	
	// Determine TTL
	var ttl = CHAT_BUBBLE_MIN_TTL * Math.ceil(text.length / 50);
	
	// If we already are visible, just increase display time
	if (this.visible)
		fro.timers.removeTimeout(this.timeout);
	
	this.timeout = fro.timers.addTimeout(this, this.hide, ttl);
}


Map_Bubble.prototype.hide = function() {
	this.visible = false;
}

Map_Bubble.prototype._updatePosition = function() {

	var pos = this.getPosition();		
	var epos = this.trackedEntity.getPosition();
	
	var r = rect.create();
	this.trackedEntity.getBoundingBox(r);
	
	pos[0] = epos[0];
	pos[1] = epos[1] + r[3]; // Above the tracked entity's head
}

Map_Bubble.prototype.render = function() {
	
	this.renderable.render();
}

/**
 * Returns a reference to our renderables vector position
 * @return vec3
 */
Map_Bubble.prototype.getPosition = function() {
	
	if ('renderable' in this) {
		return this.renderable.position;
	} else {
		return vec3.create();
	}
}

/**
 * Returns a reference to our renderables vector offset position
 * @return vec3
 */
Map_Bubble.prototype.getOffset = function() {
	
	if ('renderable' in this) {
		return this.renderable.offset;
	} else {
		return vec3.create();
	}
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


