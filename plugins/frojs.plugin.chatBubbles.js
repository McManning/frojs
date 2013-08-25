
;(function(fro, undefined) {
	
	"use strict";
	
	var BUBBLE_ZORDER = 9999; // Above everything else
	//var BUBBLE_UPDATE_INTERVAL = 100; // for tracking a followed entity
	var CHAT_BUBBLE_MIN_TTL = 3000;
	
	fro.plugins.chatBubbles = {
		
		initialise : function(options) {
			
			this.options = $.extend({
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
				
				min_ttl: 3000,
				zorder: 9999
			}, options);
		
			fro.world.bind('add', function(entity) {
				
				// Spawn and attach a bubble entity for each actor spawned
				if (entity instanceof Map_Actor) {
					var properties = {};
					properties.entity = entity;

					var bubble = new Map_ChatBubble();
					bubble.initialise(entity.eid + '_bubble', properties);
					fro.world.add(bubble);
				}
			});
			
		}
	}
	
	// Define our custom entity within the plugin closure
	function Map_ChatBubble() {}
	Map_ChatBubble.prototype = new Map_RenderableEntity();

	Map_ChatBubble.prototype.initialise = function(eid, properties) {
		Map_RenderableEntity.prototype.initialise.call(this, eid, properties);

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
			
			this.destroy();
		});
	}

	Map_ChatBubble.prototype.display = function(text) {
	
		// Generate bubble texture
		
		// @todo texture generating in the closure
		var texture = fro.resources.getBubbleTexture(text, fro.plugins.chatBubbles.options);
		
		if (!this.renderable) {
			this.renderable = new RenderableImage();
			this.renderable.useAlphaKey = true;
		}

		this.renderable.setTexture(texture, true);
		//this.renderable.rotation = Math.random() * 2 - 1;
		
		this.width = this.renderable.width;
		this.height = this.renderable.height;
		
		//this.offset[0] = 0;
		//this.offset[1] = Math.floor(this.height / 2);

		this.visible = true;

		this._updatePosition();
		
		// Determine TTL
		var ttl = CHAT_BUBBLE_MIN_TTL * Math.ceil(text.length / 50);
		
		// If we already are visible, just increase display time
		if (this.visible)
			fro.timers.removeTimeout(this.timeout);
		
		this.timeout = fro.timers.addTimeout(this, this.hide, ttl);
	}

	Map_ChatBubble.prototype.hide = function() {
		this.visible = false;
	}

	Map_ChatBubble.prototype._updatePosition = function() {

		var pos = this.getPosition();		
		var epos = this.trackedEntity.getPosition();
		
		var r = rect.create();
		this.trackedEntity.getBoundingBox(r);
		
		pos[0] = epos[0];
		pos[1] = epos[1] + r[3] + this.height * 0.5; // Above the tracked entity's head
	}

	Map_ChatBubble.prototype.render = function() {
		
		this.renderable.render(this.position, 0);
	}

	/**
	 * @param rect r
	 */
	Map_ChatBubble.prototype.getBoundingBox = function(r) {

		// @todo factor in rotations and scaling
		// and utilize this.renderable.getTopLeft(), getBottomRight(), etc
		
		// @todo this is incorrect. We center the (x, y)
		r[0] = this.position[0];
		r[1] = this.position[1];
		r[2] = this.width;
		r[3] = this.height;
	}

})(fro);
