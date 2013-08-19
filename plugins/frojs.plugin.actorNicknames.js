
;(function(fro, undefined) {
	
	"use strict";
	
	var NICKNAME_ZORDER = 9990; // Above everything else

	fro.plugins.actorNicknames = {
		
		initialise : function(options) {
			
			this.options = $.extend({
				family: 'Helvetica',
				color: '#000',
				height: 12
			}, options);
		
			fro.world.bind('add', function(entity) {
				
				// Spawn and attach a nickname entity for each actor spawned
				if (entity instanceof Map_Actor) {
					var properties = {};
					properties.entity = entity;

					var nickname = new Map_ActorNickname();
					nickname.initialise(entity.eid + '_nickname', properties);
					fro.world.add(nickname);
				}
			});
			
		}
	}
	
	// Define our custom entity within the plugin closure
	function Map_ActorNickname() {}
	Map_ActorNickname.prototype = new Map_RenderableEntity();

	Map_ActorNickname.prototype.initialise = function(eid, properties) {
		Map_RenderableEntity.prototype.initialise.call(this, eid, properties);

		this.zorder = NICKNAME_ZORDER;
		
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

	Map_ActorNickname.prototype.change = function(nick) {
		
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

	Map_ActorNickname.prototype._updatePosition = function() {

		var pos = this.getPosition();		
		var epos = this.trackedEntity.getPosition();
		
		var r = rect.create();
		this.trackedEntity.getBoundingBox(r);
		
		pos[0] = epos[0];
		pos[1] = epos[1] + r[3] + 5; // Above the tracked entity's head
	}

	Map_ActorNickname.prototype.render = function() {

		this.renderable.render(this.position, 0);
	}

	/**
	 * @param rect r
	 */
	Map_ActorNickname.prototype.getBoundingBox = function(r) {

		// @todo factor in rotations and scaling
		// and utilize this.renderable.getTopLeft(), getBottomRight(), etc
		
		// @todo this is incorrect. We center the (x, y)
		r[0] = this.position[0];
		r[1] = this.position[1];
		r[2] = this.width;
		r[3] = this.height;

	}

})(fro);