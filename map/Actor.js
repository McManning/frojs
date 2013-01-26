
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

var DEFAULT_ACTOR_ZORDER = 1;

var DEFAULT_AVATAR_URL = 'img/default_avatar.png';
var DEFAULT_AVATAR_W = 32;
var DEFAULT_AVATAR_H = 64;
var DEFAULT_AVATAR_DELAY = 1000;

var CHAT_BUBBLE_MIN_TTL = 3000;

var MOVEMENT_DISTANCE = 16;

var WALK_STEP_DISTANCE = 4;
var RUN_STEP_DISTANCE = 8;

var DISTANCE_THRESHOLD = 6;

/** Base class for actors on the map */
function Map_Actor(eid, properties) {

	/*this.eid = eid;
	
	this.avatar = new Avatar(
						properties.avatar.url,
						properties.avatar.w,
						properties.avatar.h,
						properties.avatar.delay
					);

	this.position = vec3.create();
	this.position[0] = properties.x;ddddddd
	this.position[1] = properties.y;
	this.position[2] = 0;
	
	this.width = properties.avatar.w;
	this.height = properties.avatar.h;
	this.zorder = properties.z;
	
	// Use this props position attribute as a reference for the renderable
	// @todo better management of this
	this.avatar.renderable.position = this.position;
	*/
	
	//console.log('Map_Actor constructor');
	
	//this.width = 0;
	//this.height = 0;
	//this.directionNormal = vec3.create();
	
	//console.log('Width' + this.width);
}

Map_Actor.prototype = new Map_Entity();

Map_Actor.prototype.setNick = function(nick) {
	
	this.nick = nick;
	
	// Regenerate our name texture 
	var texture = fro.resources.getFontTexture(nick, {
			height: 12,
			family: '"Helvetica Neue", Helvetica, Arial, sans-serif',
			color: '#FFFFFF',
		});
	
	if (!this.nameImage) {
		this.nameImage = new RenderableImage();
	}

	this.nameImage.setTexture(texture, true);
	
	// Reposition the image
	this.updateNameImage();
}

Map_Actor.prototype.setAvatar = function(data) {

	if (!this.avatar) { // @todo move me to an initializer
		this.avatar = new Avatar();
		
		// Hook a load event to the avatar
		this.avatar.bind('ready', this, function(evt) {
			this.recalculateAvatarRow();
		});
	}
	
	//try {
		this.avatar.load(
					data.url,
					data.w,
					data.h,
					data.delay
				);
				
		this.width = data.w;
		this.height = data.h;
		
	/*}  catch (e) {
		// Error occured while loading avatar, load a default
		this.avatar.load( 	DEFAULT_AVATAR_URL,
							DEFAULT_AVATAR_W,
							DEFAULT_AVATAR_H,
							DEFAULT_AVATAR_DELAY
						);
		this.width = DEFAULT_AVATAR_W;
		this.height = DEFAULT_AVATAR_H;
	}*/
	
	// Link position
	this.avatar.renderable.position = this.position;
}

Map_Actor.prototype.render = function() {

	if (this.avatar)
		this.avatar.render();
		
	if (this.nameImage)
		this.nameImage.render();
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
	
	return !(fro.world.isBlocked(r, this));
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
 * Returns a reference to our renderables vector position
 * 
 * @return vec3
 */
Map_Actor.prototype.getPosition = function() {
	return this.position;
}

/**
 * Returns a reference to our renderables vector offset position
 * @return vec3
 */
Map_Actor.prototype.getOffset = function() {

	if (this.avatar)
		return this.avatar.renderable.offset;
	else
		throw 'Cannot getOffset() without an avatar';
}

/**
 * @param rect r
 */
Map_Actor.prototype.getBoundingBox = function(r) {

	// @todo factor in rotations and scaling
	// and utilize this.renderable.getTopLeft(), getBottomRight(), etc
	
	var pos = this.getPosition();
	var offset = this.getOffset();
	
	r[0] = pos[0] + offset[0];
	r[1] = pos[1] + offset[1];
	r[2] = this.width;
	r[3] = this.height;
}

/** 
 * Wrapper to set the position of this actor on the map. Will prevent 
 *   automatic walking to a destination 
 */
Map_Actor.prototype.setPosition = function(x, y) {
	
	var pos = this.getPosition();

	pos[0] = Math.floor(x);
	pos[1] = Math.floor(y);
	vec3.set(pos, this.destination);
	
	// If a chat bubble is displayed, update it to track our position
	if (this.bubble)
		this.updateBubble();
		
	if (this.nameImage)
		this.updateNameImage();
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
	
		direction[0] = Math.floor(direction[0]);
		direction[1] = Math.floor(direction[1]);
	
		vec3.add(position, direction);
	} else { // close enough, just set
		vec3.set(this.destination, position);
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
	
	// If a chat bubble is displayed, update it to track our position
	if (this.bubble)
		this.updateBubble();
		
	if (this.nameImage)
		this.updateNameImage();
}

/** 
 * Determines what row to render based on a translation of our 
 *   direction and current action
 */
Map_Actor.prototype.recalculateAvatarRow = function() {
	
	var row;
	
	if (this.direction & Direction.NORTH) // N/NE/NW
		row = 1;
	else if (this.direction & Direction.SOUTH) // S/SE/SW
		row = 0;
	else if (this.direction == Direction.WEST)
		row = 2;
	else if (this.direction == Direction.EAST) 
		row = 3;
	else // default to south again, just in case
		row = 0;

	// @todo check if the sit exists in the avatar before activating?
	if (this.action == Action.SIT)
		row += 4;

	this.avatar.setRow(row);
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

	// @todo add to chatbox, filter it for the bubble, and add to bubble
	// Also involves crazy filtering stuff (for links, styling, etc)

	// Increase TTL loosely based on message length and reading time
	var ttl = CHAT_BUBBLE_MIN_TTL * Math.ceil(message.length / 50);
	
	if (this.bubble) {
	
		// Remove bubble entity from the map
		fro.world.removeEntity(this.bubble);
		
		// Stop the timeout from firing for the previous bubble
		fro.timers.removeTimeout(this.popBubbleTimeout);
	}

	// Reference world defaults
	var properties = fro.world.chatBubbleDefaults;
	
	// override certain properties for rendering
	properties.text = message;
	properties.x = 0;
	properties.y = 0;
	
	this.bubble = new Map_Bubble(this.id + '_bubble', properties);
			
	fro.world.addRenderableEntity(this.bubble);
	this.updateBubble();
	
	// Destroy the bubble after some time has passed
	this.popBubbleTimeout = fro.timers.addTimeout(this, this.popBubble, ttl);
}

/** Destroy our text bubble. Called as a timeout callback */
Map_Actor.prototype.popBubble = function() {
	
	if (this.bubble) {
		fro.world.removeEntity(this.bubble);
		delete this.bubble;
	}
}

/** Repositions bubble based on our own position */
Map_Actor.prototype.updateBubble = function() {
	
	var pos = this.getPosition();
	var r = rect.create();
	this.getBoundingBox(r);

	var p = this.bubble.getPosition();
	
	p[0] = pos[0];
	p[1] = pos[1] + r[3]; // above our head
}

/** Repositions name image based on our position */
Map_Actor.prototype.updateNameImage = function() {
	
	/* @todo this and the bubble are obviously using the same logic in the
		same places. There should be a generic way to update things that are
		attached to our actor 
	*/
	
	var pos = this.getPosition();
	
	
	var r = rect.create();
	this.getBoundingBox(r);
	
	this.nameImage.position[0] = pos[0];
	this.nameImage.position[1] = pos[1] + r[3] + 5; // above our head
}




