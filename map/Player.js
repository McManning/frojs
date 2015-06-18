/*!
 *  frojs is a Javascript based visual chatroom client.
 *  Copyright (C) 2015 Chase McManning <cmcmanning@gmail.com>
 *
 *  This program is free software; you can redistribute it and/or modify
 *  it under the terms of the GNU General Public License as published by
 *  the Free Software Foundation; either version 2 of the License, or
 *  (at your option) any later version.
 *
 *  This program is distributed in the hope that it will be useful,
 *  but WITHOUT ANY WARRANTY; without even the implied warranty of
 *  MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 *  GNU General Public License for more details.
 *
 *  You should have received a copy of the GNU General Public License along
 *  with this program; if not, write to the Free Software Foundation, Inc.,
 *  51 Franklin Street, Fifth Floor, Boston, MA 02110-1301 USA.
 */

"use strict";

var PLAYER_THINK_INTERVAL = 50; // @todo Movement speed is too dependent on this value

function Map_Player() {}
Map_Player.prototype = new Map_Actor();

Map_Player.prototype.initialise = function(eid, properties) {
	Map_Actor.prototype.initialise.call(this, eid, properties);
	
	// Is our identity authentic with the service
	this.authenticated = false;
	
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
		
	// Check for new actions on the buffer
	if (!this.isMoving()) {
		this.actionController.processActions();
	}
	
	if (this.isMoving()) {
	
		this.processMovement();
	
	} else {
	
		// Go into an idle stance if not already
		if (this.action == Action.MOVE) {
			this.setAction(Action.IDLE);
		}
	
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
Map_Player.prototype.setPosition = function(x, y, z) {

	// @todo net send? Map sort? Following-entities correction?

	Map_Actor.prototype.setPosition.call(this, x, y, z);
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
	if (input.isKeyDown(KeyEvent.DOM_VK_PAGE_UP)) { // pgup: zoom in
	
		if (cam.zoom > 0.2)
			cam.zoom -= 0.1;
			
		cam.updateTranslation();
			
	} else if (input.isKeyDown(KeyEvent.DOM_VK_PAGE_DOWN)) { // pgdown: zoom out
	
		if (cam.zoom < 2.0)
			cam.zoom += 0.1;
		
		cam.updateTranslation();
			
	} else if (input.isKeyDown(KeyEvent.DOM_VK_HOME)) { // home: reset zoom
	
		cam.zoom = 1.0;
		cam.updateTranslation();
	}
	
	var dir = Direction.NONE;
	
	// Pull desired direction of movement
	if (input.isKeyDown(KeyEvent.DOM_VK_W) || input.isKeyDown(KeyEvent.DOM_VK_UP)) { // w: north
	
		dir |= Direction.NORTH;
		
	} else if (input.isKeyDown(KeyEvent.DOM_VK_S) || input.isKeyDown(KeyEvent.DOM_VK_DOWN)) { // s: south
	
		dir |= Direction.SOUTH;
	}
	
	if (input.isKeyDown(KeyEvent.DOM_VK_A) || input.isKeyDown(KeyEvent.DOM_VK_LEFT)) { // a: west
		
		dir |= Direction.WEST;
		
	} else if (input.isKeyDown(KeyEvent.DOM_VK_D) || input.isKeyDown(KeyEvent.DOM_VK_RIGHT)) { // d: east
		
		dir |= Direction.EAST;	
	}
	
	// Pull desired speed
	var speed = Speed.WALK;

	if (input.isKeyDown(KeyEvent.DOM_VK_SHIFT)) {
		speed = Speed.RUN;
	}
	
	// Pull desired action
	var action = Action.IDLE;
	
	if (dir != Direction.NONE) {
		action = Action.MOVE;
	}
	
	if (input.isKeyDown(KeyEvent.DOM_VK_C) || input.isKeyDown(KeyEvent.DOM_VK_CONTROL)) {
	
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

