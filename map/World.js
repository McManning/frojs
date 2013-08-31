
"use strict";

fro.world = $.extend({

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
			sound : this.loadSound,
		};
		
		this.parseProperties(json);
		this.parseEntities(json.entities);
		
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

		// If we have a network section, this world is using the Universe server,
		// so bind events
		if ('network' in properties) {
			this._bindNetwork();
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
		
		try {
			// Call a loader based on entity type
			if (this._entityLoaders[type]) {
				this._entityLoaders[type].apply(this, [id, entity]);
			} else {
				throw 'Unknown entity type "' + type + '" for ' + id;
			}
		} catch (e) {
			
			// If this entity was required, fail the load entirely
			if (entity.required == true) {
				throw e;
			} else { // just log the error
				fro.log.error('Exception while loading entity ' + id + ': ' + e);
			}
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
		
		// Fire an event to let listeners know a new prop has been created, 
		// but can be hooked before initialising
		this.fire('new.entity', prop, id, properties);
		
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
		this.fire('new.entity', this.player, id, properties);
		
		this.player.initialise(id, properties);
		
		this.add(this.player);
		
		fro.camera.followEntity(this.player);
	},
	
	/** Add a RemotePlayer entity to the map (triggered by network events only) */
	loadRemotePlayer : function(id, properties) {
		
		var entity = new Map_RemotePlayer();
		this.fire('new.entity', entity, id, properties);
		
		entity.initialise(id, properties);
		
		// Add it to the map
		this.add(entity);
	},
	
	/** Add an audio object to the map */
	loadSound : function(id, properties) {
		
		var sound = new Map_Sound();
		this.fire('new.entity', sound, id, properties);
		
		sound.initialise(id, properties);
		
		this.add(sound);
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
			//this.player.sendAvatar();
			// @todo fix, or add avatar ID to auth.
			
		}).bind('auth', this, function(evt) {
			
			// After we've been authenticated, join the world channel
			
			// @todo rewrite this handshake!
			
			this.player.eid = evt.eid;
			//fro.world.join(fro.world.config.spawn_x, fro.world.config.spawn_y);
		
		}).bind('join, identity', this, function(evt) { // Sent to our client when a player is added to the map
			
			this.loadRemotePlayer(evt.eid, evt);
			
		}).bind('say', this, function(evt) { // Chat message { msg: 'message' }
			
			var ent = this.find(evt.eid);
			
			if (ent) {
				ent.say(evt.msg);
			} else {
				fro.log.error('[net.say] EID ' + evt.eid + ' does not exist');
			}
			
		}).bind('nick', this, function(evt) { // Update nickname { nick: 'John Doe' }
			
			var ent = this.find(evt.eid);
			
			if (ent) {
				ent.setNick(evt.nick);
			} else {
				fro.log.error('[net.nick] EID ' + evt.eid + ' does not exist');
			}
			
		}).bind('avatar', this, function(evt) { // Change avatar { url: 'http', w: 0, h: 0, delay: 0 }
			
			var ent = this.find(evt.eid);
			
			if (ent) {
				ent.setAvatar(evt.src);
			} else {
				fro.log.error('[net.avatar] EID ' + evt.eid + ' does not exist');
			}
			
		}).bind('move', this, function(evt) { // Update action buffer { buffer: 'buffercontents' }
			
			var ent = this.find(evt.eid);
			
			if (ent) {
				// @todo something generic, that can change based on controller type
				ent.actionController.write(evt.buffer);
			} else {
				fro.log.error('[net.move] EID ' + evt.eid + ' does not exist');
			}
		
		}).bind('leave', this, function(evt) { // Leave world { reason: 'Why I left' }
		
			var ent = this.find(evt.eid);
			
			if (ent) {
				ent.destroy();
			} else {
				fro.log.error('[net.leave] EID ' + evt.eid + ' does not exist');
			}
		});

	},

	add : function(entity) {
		
		if (entity.isRenderable) {
			this._renderableEntities.push(entity);
			this.resort();
		} else {
			this._otherEntities.push(entity);
		}
		
		this.fire('add.entity', entity);
	},

	/** 
	 * Removes an entity by reference from the world. In order to fully delete an entity,
	 * do NOT call this method and instead call entity.destroy() which will also perform removal
	 * 
	 * @param entity Entity to remove
	 */
	remove : function(entity) {

		for (var index in this._renderableEntities) {
			if (this._renderableEntities[index] == entity) {

				this.fire('remove.entity', entity);
				delete this._renderableEntities[index];

				// @todo array cleanup somewhere after all iterations are complete, since delete just nullfies
				// A proper delete queue and cleanup process would be useful. 
				return true;
			}
		}
		
		for (var index in this._otherEntities) {
			if (this._otherEntities[index] == entity) {

				this.fire('remove.entity', entity);
				delete this._otherEntities[index];
				
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
	
}, EventHooks);

