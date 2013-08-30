
"use strict";

var PLAYER_THINK_INTERVAL = 50; // @todo Movement speed is too dependent on this value

function Map_Player() {}
Map_Player.prototype = new Map_Actor();

Map_Player.prototype.initialise = function(eid, properties) {
	Map_Actor.prototype.initialise.call(this, eid, properties);
	
	this.thinkInterval = fro.timers.addInterval(
		this, this.think, 
		PLAYER_THINK_INTERVAL
	);

	// Register an action controller with us
	this.actionController = new BufferedActionController(this, true);
}

Map_Player.prototype.destroy = function() {
	
	fro.timers.removeInterval(this.thinkInterval);
	
	Map_Actor.prototype.destroy.call(this);
}

Map_Player.prototype.think = function() {

	// Check input state, do stuff, etc.

	// If we're not currently processing movement, see if the user wants to move
	if (!this.isMoving())
		this.handlePlayerInput();
	
	if (!this.isMoving())
		this.actionController.processActions();

	if (this.isMoving()) {
	
		this.processMovement();
	
	} else {
		if (this.avatar) {
			var time = new Date().getTime();
			// Idle animate our avatar
			if (this.avatar.nextChange < time) {
			
				this.avatar.nextFrame(false);
				this.avatar.nextChange = time + this.avatar.currentDelay;
			}
		}
	}
}

/** Overrides Map_Actor.setPosition */
Map_Player.prototype.setPosition = function(x, y) {

	// @todo net send? Map sort? Following-entities correction?

	Map_Actor.prototype.setPosition.call(this, x, y);
}

/**
 * @return boolean True if our input caused our actor to start/continue moving
 */
Map_Player.prototype.handlePlayerInput = function() {

	var input = fro.input;
	var cam = fro.camera;
	
	if (!input.hasFocus())
		return;

	// Handle zoom (@todo move, this is just for testing)
	if (input.isKeyDown(33)) { // pgup: zoom in
	
		if (cam.zoom > 0.2)
			cam.zoom -= 0.1;
			
	} else if (input.isKeyDown(34)) { // pgdown: zoom out
	
		if (cam.zoom < 2.0)
			cam.zoom += 0.1;
			
	} else if (input.isKeyDown(36)) { // home: reset zoom
	
		cam.zoom = 1.0;
	}
	
	var dir = Direction.NONE;
	
	// Pull desired direction of movement
	if (input.isKeyDown(87)) { // w: north
	
		dir |= Direction.NORTH;
		
	} else if (input.isKeyDown(83)) { // s: south
	
		dir |= Direction.SOUTH;
	}
	
	if (input.isKeyDown(65)) { // a: west
		
		dir |= Direction.WEST;
		
	} else if (input.isKeyDown(68)) { // d: east
		
		dir |= Direction.EAST;	
	}
	
	// Pull desired speed
	var speed = Speed.WALK;

	if (input.isKeyDown(KeyEvent.DOM_VK_SHIFT)) {
		speed = Speed.RUN;
	}
	
	// Pull desired action
	var action = Action.IDLE;
	
	if (input.isKeyDown(KeyEvent.DOM_VK_C)) {
	
		action = Action.SIT;

	} /*else if (input.isKeyDown(KeyEvent.DOM_VK_J)) {
	
		action = Action.JUMP;
	}*/
	
	// Send desired state changes to our translation module
	this.actionController.processInput(dir, speed, action);
}

/**
 * Send a packet to the server with our current avatar metadata
 */
Map_Player.prototype.setAvatar = function(id) {
	Map_Actor.prototype.setAvatar.call(this, id);
	
	// Also tell the server we're attempting a change
	var packet = {
		id: 'avatar',
		src: id,
	};
	
	fro.network.send(packet);
}

Map_Player.prototype.sendNewNick = function(nick) {

	var packet = {
		id: 'nick',
		nick: nick
	};
	
	fro.network.send(packet);
}

Map_Player.prototype.sendSay = function(message) {

	var packet = {
		id: 'say',
		msg: message
	};
	
	fro.network.send(packet);
}

