
"use strict";

var REMOTE_PLAYER_THINK_INTERVAL = 50; // @todo Movement speed is too dependent on this value

function Map_RemotePlayer() {}
Map_RemotePlayer.prototype = new Map_Actor();

Map_RemotePlayer.prototype.initialise = function(eid, properties) {
	Map_Actor.prototype.initialise.call(this, eid, properties);
	
	// Is our identity authentic with the service
	this.authenticated = properties.hastoken;
	
	this.thinkInterval = fro.timers.addInterval(
		this, this.think, 
		REMOTE_PLAYER_THINK_INTERVAL
	);

	// Register an action controller with us
	this.actionController = new BufferedActionController(this, false);
}

Map_RemotePlayer.prototype.destroy = function() {

	fro.timers.removeInterval(this.thinkInterval);
	
	Map_Actor.prototype.destroy.call(this);
}

Map_RemotePlayer.prototype.think = function() {

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

