

"use strict";

var NICKNAME_ZORDER = 9998; // Above everything else

function Map_Nickname() {}
Map_Nickname.prototype = new Map_RenderableEntity();

Map_Nickname.prototype.initialise = function(eid, properties) {
	Map_RenderableEntity.prototype.initialise.call(this, eid, properties);

	this.zorder = NICKNAME_ZORDER;
	this.position = vec3.create();
	this.offset = vec3.create();
	
	this.trackedEntity = properties.entity;
	
	// bind events to our tracked entity (talking, moving, deleting)
	this.trackedEntity.bind('nick.nickname', this, function(nick) {
		
		this.change(nick);
	
	}).bind('move.nickname, avatar.nickname', this, function() {
		
		this._updatePosition();
		
	}).bind('destroy.nickname', this, function() {
		
		this.destroy();
	});
	
	// Render their current nick
	this.change(this.trackedEntity.nick);
	
}

Map_Nickname.prototype.change = function(nick) {
	
	// Regenerate our name texture 
	var texture = fro.resources.getFontTexture(nick, {
			height: 14,
			family: '"Helvetica Neue", Helvetica, Arial, sans-serif',
			color: '#00FFFF',
		});
	
	if (!this.renderable) {
		this.renderable = new RenderableImage();
	}

	this.renderable.setTexture(texture, true);
	
	this.width = this.renderable.width;
	this.height = this.renderable.height;
	
	this._updatePosition();
}

Map_Nickname.prototype._updatePosition = function() {

	var pos = this.getPosition();		
	var epos = this.trackedEntity.getPosition();
	
	var r = rect.create();
	this.trackedEntity.getBoundingBox(r);
	
	pos[0] = epos[0];
	pos[1] = epos[1] + r[3] + 5; // Above the tracked entity's head
}

Map_Nickname.prototype.render = function() {

	this.renderable.render(this.position, 0);
}

/**
 * Returns a reference to our renderables vector position
 * @return vec3
 */
Map_Nickname.prototype.getPosition = function() {
	return this.position;
}

/**
 * @param rect r
 */
Map_Nickname.prototype.getBoundingBox = function(r) {

	// @todo factor in rotations and scaling
	// and utilize this.renderable.getTopLeft(), getBottomRight(), etc
	
	r[0] = this.position[0];
	r[1] = this.position[1];
	r[2] = this.width;
	r[3] = this.height;

}
