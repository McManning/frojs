
"use strict";

var PROCESS_BUFFER_INTERVAL = 40;
var SEND_BUFFER_INTERVAL = 2000;

/**
 * @param boolean isPlayer if true, will also notify the network of action changes
 */
function BufferedActionController(actor, isPlayer) {

	this.networkBuffer = '';
	this.buffer = '';
	this.isPlayer = isPlayer;
	this.actor = actor;
	
	// @todo add processing timer, and network buffer send timer if isPlayer
	
	if (isPlayer) {
		this.sendBufferInterval = 
			fro.timers.addInterval(this, this.sendToNetwork, SEND_BUFFER_INTERVAL);
	}
}

/**
 * Translates current input states into actions to be appended to our string buffer
 */
BufferedActionController.prototype.processInput = function(direction, speed, action) {

	var dirChar = this.directionToChar(direction);
	
	// Mark speed changes
	if (speed != this.actor.speed) {

		this.write((speed == Speed.WALK) ? 'w' : 'r');
	}
	
	if (action == Action.SIT) {
		
		// If we're changing sit direction or going into a sit, write
		if (this.actor.direction != direction || this.actor.action != Action.SIT) {
		
			if (direction == Direction.NONE) {
				dirChar = this.directionToChar(this.actor.direction);
			}
			
			this.write('s' + dirChar);
		}
		
	} else if (action == Action.JUMP) {
		
		// if they're jumping in a different direction than they're facing
		if (this.actor.direction != direction) {
			this.write('t' + dirChar);
		}
		
		this.write('j');
		
		// determine type of jump (walking/running/standing)
		if (direction != Direction.NONE) {
		
			this.write((speed == Speed.WALK) ? 'w' : 'r');
			
		} else { // standing jump
			
			this.write('s');
		}
	
	} else if (direction != Direction.NONE) {
		
		// Normal walk attempt, determine if it's allowed, then write
		if (this.actor.canMove(direction)) {
			
			this.write(dirChar);
			
		} else if (this.actor.direction != direction) { // just change direction
		
			this.write('t' + dirChar);
		}
	}
}

BufferedActionController.prototype.directionToChar = function(direction) {
	return String.fromCharCode(65 + direction);
}

/**
 * Returns Direction.NORTH,SOUTH,etc if the character can be translated to 
 * a direction constant. If it cannot, will return Direction.NONE
 *
 * @return A value from the Direction enumeration
 */
BufferedActionController.prototype.charToDirection = function(ch) {
	
	var dir = ch.charCodeAt(0) - 65;
	if (dir >= Direction.NORTH && dir <= Direction.SOUTHWEST)
		return dir;
	else
		return Direction.NONE;
}

/**
 * Adds actions to our buffer to be processed by our actor, or 
 *   sent over the network
 */
BufferedActionController.prototype.write = function(str) {

	if (this.isPlayer) {

		// if the last character in the network buffer was a speed change, and 
		// nothing else happened, just collapse into one command, since remote
		// clients wouldn't care about speed changes without movement
		
		var lchar = this.networkBuffer.charAt(this.networkBuffer.length-1);
		
		if ((lchar == 'w' || lchar == 'r') && (str == 'r' || str == 'w')) {
		
			this.networkBuffer = this.networkBuffer.substr(0,this.networkBuffer.length-1) + str;
			
		} else { // just append normally
		
			this.networkBuffer += str;
		}
	}
	
	this.buffer += str;
}

BufferedActionController.prototype.sendToNetwork = function() {

	// Prevent sending if it's just a speed change character
	if (this.networkBuffer && this.networkBuffer.length > 1) {

		var packet = {
			'id': 'move',
			'buffer': this.networkBuffer,
			'x': this.actor.destination[0],
			'y': this.actor.destination[1],
			'action': this.actor.action,
			'direction': this.actor.direction 
		};
		
		fro.network.send(packet);
		
		// Write our current speed back down into the buffer
		this.networkBuffer = (this.actor.speed == Speed.WALK) ? 'w' : 'r';
	}
}

/**
 * Walks through the buffer and sends actions to the linked actor
 */
BufferedActionController.prototype.processActions = function() {
	
	var c, recheck, eraseCount, dir;

	if (this.buffer) {
	
		do {
		
			c = this.buffer.charAt(0);
			dir = this.charToDirection(c);
			recheck = false;
			eraseCount = 1;
		
			if (dir != Direction.NONE) { // moving in direction

				this.actor.setAction(Action.IDLE);
				this.actor.stepInDirection(dir);
				
			} else if (c == 'w') { // change speed to walk

				this.actor.setSpeed(Speed.WALK);
				recheck = true;
				
			} else if (c == 'r') { // change speed to run

				this.actor.setSpeed(Speed.RUN);
				recheck = true;
				
			} else if (c == 's') { // sit + 1 char for direction
				
				if (this.buffer.length > 1) {
					dir = this.charToDirection(this.buffer.charAt(1));
					this.actor.setDirection(dir);
					eraseCount++;
				}
				this.actor.setAction(Action.SIT);
				
			} else if (c == 't') { // stand/turn + 1 char for direction
				
				if (this.buffer.length > 1) {
					dir = this.charToDirection(this.buffer.charAt(1));
					this.actor.setDirection(dir);
					eraseCount++;
				}
				this.actor.setAction(Action.IDLE);
				
			} else if (c == 'c') { // compare supplied x/y with position
			
				// format: cXXXX.YYYY.
				var xend = this.buffer.indexOf('.');
				var yend = this.buffer.indexOf('.', xend+1);
				
				if (xend > -1 && yend > -1) {
					
					var x = this.buffer.substr(1, xend - 1);
					var y = this.buffer.substr(xend + 1, yend - xend - 1);
					
					if (x != 0 || y != 0) { // ignore double zero positions 
						// @todo is the ignore hack necessary still?
						
						var pos = this.actor.getPosition();

						if (pos.x != x || pos.y != y) {
							this.actor.setPosition(x, y);
						}
					}
					
					eraseCount += yend;
					recheck = true;
					
				} else {
				
					fro.log.warning('Malformed pos correction: ' + c);
				}
			
			}
			
			this.buffer = this.buffer.substring(eraseCount);

		} while (recheck && this.buffer);
	}
	
}
