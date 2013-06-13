
"use strict";

fro.world = {

	/*
		_entityLoaders - name->method loaders for entity types
		_renderableEntities - list of entities 
		player - Reference to the local player in this world
		config - 
	*/
	
	initialise : function(json) {
		
		this._renderableEntities = new Array();
		this._otherEntities = new Array();
		
		this._entityLoaders = {
			prop : this.loadProp,
			actor : this.loadActor,
			light : this.loadLight,
			event : this.loadEvent,
			player : this.loadPlayer,
		};
		
		var mapData = $.parseJSON(json);

		this.parseProperties(mapData);
		this.parseEntities(mapData.entities);
		
		// Make sure we have a player entity
		// @todo maybe this check BEFORE network initialisation? (To avoid false starts)
		if (!this.player) {
			throw('Did not load a player entity with world json');
		}
		
		// Enable event binding
		//$.extend(this, EventHooks);
	},

	parseProperties : function(properties) {

		// Properties parsing and nonsense (bounds, camera style, etc)
		
		this.properties = properties;
		
		this.id = properties.id;
		this.templates = properties.templates;

		if ('background' in properties) {
			fro.renderer.setClearColor(
				properties.background[0], properties.background[1], 
				properties.background[2], properties.background[3]
			);
		}
		
		if ('bounds_x1' in properties) {
			var bounds = rect.create();
			
			bounds[0] = properties.bounds_x1;
			bounds[1] = properties.bounds_y1;
			bounds[2] = properties.bounds_x2;
			bounds[3] = properties.bounds_y2;
			
			fro.camera.setBounds(bounds);
		}

		// If we have a network section, this world is using the Universe server
		if ('network' in properties) {
			this._bindNetwork();
			fro.network.connect(properties.network.server);
		}
	},

	parseEntity : function(id, entity) {

		// If this entity has an associated template, merge
		// properties from the template into this entity instance
		if ('template' in entity) {
			var template = entity.template;
			
			if (this.templates[template]) {
				for (var p in this.templates[template]) {
				
					// Overwrite only if the entity doesn't have the property
					if (!entity[p]) {
						entity[p] = this.templates[template][p];
					}
				}
			}
		}
		
		var type = entity.type;
		
		// Call a loader based on entity type
		if (this._entityLoaders[type]) {
			this._entityLoaders[type].apply(this, [id, entity]);
		} else {
			throw 'Unknown entity type "' + type + '" for ' + id;
		}
	},

	parseEntities : function(entities) {

		for (var id in entities) {
			this.parseEntity(id, entities[id]);
		}
	},

	/** Returns true if any entities on the map are still loading, and 
		demand for the map to wait for them to finish
		
	@return boolean
	*/
	isLoading : function() {

		// Check for loading props
		var index;
		// @todo isLoading
		return false;
	},

	/**
	 * @return Entity object or undefined
	 */
	find : function(eid) {
		
		var ents = this._renderableEntities;
		for (var index in ents) {
			if (ents[index].eid == eid)
				return ents[index];
		}
		
		ents = this._otherEntities;
		for (var index in ents) {
			if (ents[index].eid == eid)
				return ents[index];
		}
		
		return undefined;
	},

	/** Loader callback for entities with type = 'prop' */
	loadProp : function(id, properties) {

		var prop = new Map_Prop();
		prop.initialise(id, properties);
		
		// Add it to the map
		this.add(prop);
	},

	loadActor : function(id, properties) {
		
		//var actor = new Map_Actor(id, properties);
		
		//this.add(actor);
	},

	/** Loader callback for entities with type = 'light' */
	loadLight : function(id, properties) {
		// @todo
	},

	/** Loader callback for entities with type = 'event' */
	loadEvent : function(id, properties) {
		// @todo
	},

	/** Loader callback for entities with type = 'player' */
	loadPlayer : function(id, properties) {

		if ('player' in this) {
			throw 'fro.world.player has already been loaded';
		}
		
		this.player = new Map_Player();
		this.player.initialise(id, properties);
		
		this.add(this.player);
		
		fro.camera.followEntity(this.player);
	},

	/** 
	 * Binds map level events to our fro.network module. This includes things like 
	 * adding/removing entities, chat, movement, avatar changes, etc
	 */
	_bindNetwork : function() {

		var props = this.properties;

		fro.network.bind('open', this, function(evt) {
			
			var pos = fro.world.player.getPosition();
			
			// On opening the socket, send authentication
			fro.network.send({
				id: 'auth',
				token: props.network.auth, 
				user: 'Lab Rat', // @todo resolve
				nick: this.player.nick,
				world: props.network.channel,
				x: pos[0],
				y: pos[1]
			});
			
			// Send a follow up message with our avatar data
			// @todo maybe send this in auth response instead, just in case of bad auth?
			this.player.sendAvatar();
			
		}).bind('auth', this, function(evt) {
			
			// After we've been authenticated, join the world channel
			
			// @todo rewrite this handshake!
			
			this.player.eid = evt.eid;
			//fro.world.join(fro.world.config.spawn_x, fro.world.config.spawn_y);
		
		}).bind('join, identity', this, function(evt) { // Sent to our client when a player is added to the map
			
			var actor = new Map_RemotePlayer();
			actor.initialise(evt.eid, evt);
			
			this.add(actor);
		
		}).bind('say', this, function(evt) { // Chat message { msg: 'message' }
			
			var ent = this.find(evt.eid);
			ent.say(evt.msg);
			
		}).bind('nick', this, function(evt) { // Update nickname { nick: 'John Doe' }
			
			var ent = this.find(evt.eid);
			ent.setNick(evt.nick);
			
		}).bind('avatar', this, function(evt) { // Change avatar { url: 'http', w: 0, h: 0, delay: 0 }
			
			var ent = this.find(evt.eid);
			ent.setAvatar(evt.src);
			
		}).bind('move', this, function(evt) { // Update action buffer { buffer: 'buffercontents' }
			
			var ent = this.find(evt.eid);
			
			// @todo something generic, that can change based on controller type
			ent.actionController.write(evt.buffer);
		
		}).bind('leave', this, function(evt) { // Leave world { reason: 'Why I left' }
		
			var ent = this.find(evt.eid);
			this.remove(ent);
		});

	},

	add : function(obj) {
		
		if (obj.isRenderable) {
			this._renderableEntities.push(obj);
			this.resort();
		} else {
			this._otherEntities.push(obj);
		}
		
		//this.fire('add', obj);
	},

	/** 
	 * Removes an entity by reference from the world 
	 * 
	 * @param entity Entity to remove
	 */
	remove : function(entity) {
		
		for (var index in this._renderableEntities) {
			if (this._renderableEntities[index] == entity) {
			
				//this.fire('remove', this._renderableEntities[index]);
				
				// Call a cleanup for the entity
				this._renderableEntities[index].destroy();
				
				delete this._renderableEntities[index];
				
				// @todo somehow flag the delete event for that renderable, so that
				// it can kill related timers/listeners/etc
				
				// @todo array cleanup somewhere after all iterations are complete, since delete just nullfies
				// A proper delete queue and cleanup process would be useful. 
				return true;
			}
		}
		
		for (var index in this._otherEntities) {
			if (this._otherEntities[index] == entity) {
			
				//this.fire('remove', this._otherEntities[index]);
				
				// Call a cleanup for the entity
				this._otherEntities[index].destroy();
				
				delete this._otherEntities[index];
				
				// @todo somehow flag the delete event for that renderable, so that
				// it can kill related timers/listeners/etc
				
				// @todo array cleanup somewhere after all iterations are complete, since delete just nullfies
				// A proper delete queue and cleanup process would be useful. 
				return true;
			}
		}
		
		return false;
	},

	/** Flag a resort of the renderable entities. Called whenever an entity moves */
	resort : function() {
		this.needsResort = true;
	},

	/** Reorganizes props on the map based on their Z order and position */
	_sortRenderables : function() {
		
		/*
			Return less than zero if left should be lower indexed than right
			0 if left is the same as right
			greater than zero if left should be higher indexed than right
		*/
		this._renderableEntities.sort(function(left, right) {

			// left lower
			if (left.zorder < right.zorder)
				return -1;
			
			// right lower
			if (left.zorder > right.zorder)
				return 1;
				
			// Else, order depends on Y position
			var pl = left.getPosition();
			var pr = right.getPosition();
			
			// left is lower (therefore in front of right & higher indexed)
			if (pl[1] < pr[1])
				return 1;
					
			// Right is lower (therefore in front of left & higher indexed)
			if (pl[1] > pr[1])
				return -1;
				
			return 0;
		});
	},

	render : function() {
		
		var index;
		
		// @todo move?
		
		// If we need to resort our renderables, do so
		if (this.needsResort) {
			this.needsResort = false;
			this._sortRenderables();
		}
		
		// Doodle some props
		for (index in this._renderableEntities) {
			if (this._renderableEntities[index].visible) {
				this._renderableEntities[index].render();
			}
		}

	},

	/** 
	 * Returns true if there's a solid entity between start and end vectors
	 *
	 * @param vec3 start
	 * @param vec3 end
	 * @return boolean
	 */
	isPathBlocked : function(start, end) {
		return false; // @todo
	},

	/**
	 * Returns true if an entity collides with the specified rect
	 *
	 * @param rect r
	 * @param entity excluding If supplied, this entity will be ignored
	 * @return boolean
	 */
	isRectBlocked : function(r, excluding) {

		var entities = this._renderableEntities;	
		for (var index in entities) {
			if (entities[index] != excluding && entities[index].collides(r)) {
				return true;
			}
		}
		
		var entities = this._otherEntities;	
		for (var index in entities) {
			if (entities[index] != excluding && entities[index].collides(r)) {
				return true;
			}
		}
		
		return false;
	}
}

