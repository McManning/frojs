
"use strict";

var REMOTE_PLAYER_THINK_INTERVAL = 50; // @todo Movement speed is too dependent on this value

function Map_RemotePlayer(eid, properties) {

	// Replicated from Map_Actor until I can find out how to pass arguments to
	// use its constructor
	this.eid = eid;

	this.step = 0;
	
	this.action = properties.action;
	this.speed = Speed.WALK;
	this.direction = properties.direction;
	this.zorder = DEFAULT_ACTOR_ZORDER;
	this.width = 0;
	this.height = 0;
	this.destination = vec3.create();
	this.position = vec3.create();
	this.directionNormal = vec3.create();
	this.setPosition(properties.x, properties.y);
	
	this.loadAvatarFromMetadata(DEFAULT_AVATAR);
	
	this.setAvatar(properties.avatar);
	
	this.setNick(properties.nick);

	this.thinkInterval = 
		fro.timers.addInterval(this, this.think, REMOTE_PLAYER_THINK_INTERVAL);

	// Register an action controller with us
	// Currently using legacy version
	this.actionController = new BufferedActionController(this, false);
}

Map_RemotePlayer.prototype = new Map_Actor();

Map_RemotePlayer.prototype.think = function() {

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

