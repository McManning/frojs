
"use strict";
	
var Direction = {
	NONE : 0,
	NORTH : 1,
	SOUTH : 2,
	EAST : 4,
	WEST: 8,
	
	NORTHEAST : 5,
	NORTHWEST : 9,
	SOUTHEAST : 6,
	SOUTHWEST : 10
}

var Speed = {
	WALK : 4,
	RUN : 8
}

var Action = {
	IDLE : 0,
	SIT : 1,
	JUMP : 2
}

var MOVEMENT_DISTANCE = 16;

/** Base class for actors on the map */
function Map_Actor() {}
Map_Actor.prototype = new Map_RenderableEntity();

Map_Actor.prototype.initialise = function(eid, properties) {
	Map_RenderableEntity.prototype.initialise.call(this, eid, properties);

	this.step = 0;
	this.action = properties.action;
	this.speed = Speed.WALK;
	this.direction = properties.direction;

	// @todo Are these two required/used?
	this.width = 0;
	this.height = 0;
	
	this.destination = vec3.create();
	this.directionNormal = vec3.create();
	
	this.setPosition(properties.x, properties.y, properties.z);
	
	this.setAvatar('default');
	
	if (properties.avatar) {
		this.setAvatar(properties.avatar);
	}
	
	if (!properties.nick) {
		properties.nick = '';
	}
	
	this.setNick(properties.nick);
}

Map_Actor.prototype.destroy = function() {
	Map_RenderableEntity.prototype.destroy.call(this);
}

Map_Actor.prototype.setNick = function(nick) {
	
	this.nick = nick;
	this.fire('nick', nick);
}

/**
 * Sets this.avatar to the new Avatar object, and reconfigures
 * the actor's properties as appropriate (resize, animation reset, etc)
 */
Map_Actor.prototype.applyAvatar = function(avatar) {
	this.avatar = avatar;
	
	this.width = avatar.getWidth();
	this.height = avatar.getHeight();
	
	this.offset[1] = this.height * 0.5;
	
	this.recalculateAvatarRow();
}

Map_Actor.prototype.setAvatar = function(id) {

	// Delegate to plugins
	this.fire('avatar.set', id);
}

Map_Actor.prototype.render = function() {

	if (this.avatar) {
		this.avatar.render(this._translation, this.offset);
	}
}

Map_Actor.prototype.think = function() {
	
	// do stuff
}

/**
 * @param dir Direction constant to test 
 * @return boolean
 */
Map_Actor.prototype.canMove = function(dir) {

	// @todo test the points between current location and target (x, y)
	// For now, it assumes the distance is close enough to be negligible

	var x = this.position[0];
	var y = this.position[1];
	
	if (dir & Direction.NORTH)
		y += MOVEMENT_DISTANCE;
	else if (dir & Direction.SOUTH)
		y -= MOVEMENT_DISTANCE;
		
	if (dir & Direction.EAST)
		x += MOVEMENT_DISTANCE;
	else if (dir & Direction.WEST)
		x -= MOVEMENT_DISTANCE;
	
	// Collision rectangle is a 16x16 (@todo generate into this.collisions?)
	// @todo optimize rect creation
	var r = rect.create([
				x - 8,
				y,
				16, 16
			]);
	
	return !(fro.world.isRectBlocked(r, this));
}


/** 
 * Returns true if our current position does not match up with 
 *  our current destination
 *  
 * @return boolean
 */
Map_Actor.prototype.isMoving = function() {

	var pos = this.getPosition();

	return (pos[0] != this.destination[0] 
			|| pos[1] != this.destination[1]);
}

/**
 * @param rect r
 */
Map_Actor.prototype.getBoundingBox = function(r) {

	// @todo factor in rotations and scaling
	// and utilize this.renderable.getTopLeft(), getBottomRight(), etc
	
	var pos = this.getPosition();

	r[0] = pos[0];
	r[1] = pos[1] + this.height * 0.5;
	
	if (this.avatar) {
		r[2] = this.avatar.getWidth();
		r[3] = this.avatar.getHeight();
	} else {
		r[2] = 0;
		r[3] = 0;
	}
}

/** 
 * Wrapper to set the position of this actor on the map. Will prevent 
 *   automatic walking to a destination 
 */
Map_Actor.prototype.setPosition = function(x, y, z) {
	Map_RenderableEntity.prototype.setPosition.call(this, x, y, z);

	vec3.set(this.getPosition(), this.destination);

	this.fire('move', this.getPosition());
}

/** Sets our current action (idle, sit, etc) and updates the avatar */
Map_Actor.prototype.setAction = function(action) {
	
	this.action = action;
	this.recalculateAvatarRow();
}

/** Sets our current movement speed (walk/run) */
Map_Actor.prototype.setSpeed = function(speed) {

	this.speed = speed;
}

/** 
 * Moves our actor in order to match up our current position with our destination
 */
Map_Actor.prototype.processMovement = function() {

	var position = this.getPosition();
	var direction = this.directionNormal;

	// Get the distance between our position and destination
	vec3.subtract(this.destination, position, direction);
	var distance = vec3.length(direction);
	
	// Create a normal vector from position to destination
	vec3.normalize(direction);
	
	// console.log('Distance: ' + distance);
	
	// If we have less distance to cover, just move the difference
	if (distance < this.speed) {
		vec3.scale(direction, distance);
		distance = 0;
	} else {
		vec3.scale(direction, this.speed);
		distance -= this.speed;
	}
	
	//console.log('Adjusted Distance: ' + distance);
	//console.log(direction);
	
	if (distance > 0) { // Move toward destination
	
		direction[0] = Math.ceil(direction[0]);
		direction[1] = Math.ceil(direction[1]);
	
		vec3.add(position, direction);
		Map_RenderableEntity.prototype.setPosition.call(this, position);
		
	} else { // close enough, just set
		
		vec3.set(this.destination, position);
		Map_RenderableEntity.prototype.setPosition.call(this, position);
	}
	
	// Animate the step
	// @todo better logic here to delay step animations to every-other distance
	if (this.step < 2) {
		this.step += 1;
	} else {
		this.step = 0;
		this.avatar.nextFrame(true);
		
		// Get the map to queue a resort of objects
		fro.world.resort();
	}
	
	// If our relative direction changed, make sure we reflect that
	var d = this.directionFromVector(direction);
	
	if (d != this.direction) {
		this.setDirection(d);
	}

	this.fire('move', this.position);
}

/** 
 * Determines what row to render based on a translation of our 
 *   direction and current action
 */
Map_Actor.prototype.recalculateAvatarRow = function() {
	
	var row;
	
	if (this.direction & Direction.NORTH) // N/NE/NW
		row = 8;
	else if (this.direction & Direction.SOUTH) // S/SE/SW
		row = 2;
	else if (this.direction == Direction.WEST)
		row = 4;
	else if (this.direction == Direction.EAST) 
		row = 6;
	else // default to south again, just in case
		row = 2;

	var frame = 'move_';
		
	// If we're not moving, use the stop animation (if we have it)
	/* @todo isMoving isn't returning what we want, yet. 
	if (!this.isMoving()) {
		frame = 'stop_';
		if (!this.avatar.hasKeyframe(frame + row)) {
			frame = 'move_';
		}
	}
	*/
		
	// @todo check if the sit exists in the avatar before activating?
	if (this.action == Action.SIT) {
		frame = 'act_';
		if (!this.avatar.hasKeyframe(frame + row)) {
			frame = 'move_';
		}
	}
	
	// Still doesn't exist, default to move_2
	if (!this.avatar.hasKeyframe(frame + row)) {
		frame = 'move_';
		row = '2';
	}

	this.avatar.setKeyframe(frame + row);
}

Map_Actor.prototype.stepInDirection = function(dir) {
	
	vec3.set(this.getPosition(), this.destination);
	
	// Offset our destination based on desired direction from our current position
	
	if (dir & Direction.NORTH)
		this.destination[1] += MOVEMENT_DISTANCE;
	else if (dir & Direction.SOUTH)
		this.destination[1] -= MOVEMENT_DISTANCE;
		
	if (dir & Direction.EAST)
		this.destination[0] += MOVEMENT_DISTANCE;
	else if (dir & Direction.WEST)
		this.destination[0] -= MOVEMENT_DISTANCE;
}

/**
 * Sets our actors "close enough" direction, and updates the avatar
 * 
 * @param dir a Direction constant (ex: Direction.NORTH)
 */
Map_Actor.prototype.setDirection = function(dir) {
	
	this.direction = dir;
	this.recalculateAvatarRow();
}

// @todo move to utils!
Map_Actor.prototype.directionFromVector = function(vec) {
	
	var dir = Direction.NONE;
	
	if (vec[1] > 0)
		dir |= Direction.NORTH;
	else if (vec[1] < 0)
		dir |= Direction.SOUTH;
	
	if (vec[0] > 0)
		dir |= Direction.EAST;
	else if (vec[0] < 0)
		dir |= Direction.WEST;
		
	return dir;
}

Map_Actor.prototype.say = function(message) {

	this.fire('say', message);
}

