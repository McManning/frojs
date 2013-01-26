
"use strict";

function World() {
		
	// List of visible entities on the map
	this.renderableEntities = new Array();

	// List of loaders for different entity types
	this.entityLoaders = {
		prop : this.loadProp,
		actor : this.loadActor,
		light : this.loadLight,
		event : this.loadEvent,
	};
	
	// @todo overridable by json
	this.chatBubbleDefaults = {
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
	};
}

World.prototype.load = function(json) {
	
	var mapData = $.parseJSON(json);

	this.parseProperties(mapData);
	this.parseEntities(mapData.entities);
}

/**
 * Send a join event to the network, to begin populating 
 * our world with remote entities
 */
World.prototype.join = function(x, y) {
	
	var packet = {
		id: 'join',
		world: this.id,
		x: x,
		y: y
	};

	// Push a join request to the world, followed by our avatar data
	fro.network.send(packet);
	fro.player.sendAvatar(); // @todo add to the initial auth?
	
	fro.player.setPosition(x, y);
}

World.prototype.parseProperties = function(properties) {

	// Properties parsing and nonsense (bounds, camera style, etc)
	
	this.id = properties.id;
	this.templates = properties.templates;
	
	// If we defined an override for bubble styles, override any properties defined
	if ('bubble_style' in properties) {
		
		for (var key in this.chatBubbleDefaults) {
			if (key in properties.bubble_style) {
				this.chatBubbleDefaults[key] = properties.bubble_style[key];
			}
		}
	}

	this.spawn = {
		x: properties.spawn_x,
		y: properties.spawn_y
	};

	if ('bounds_x1' in properties) {
		var bounds = rect.create();
		
		bounds[0] = properties.bounds_x1;
		bounds[1] = properties.bounds_y1;
		bounds[2] = properties.bounds_x2;
		bounds[3] = properties.bounds_y2;
		
		fro.camera.setBounds(bounds);
	}

}


World.prototype.parseEntity = function(id, entity) {

	// If this entity has an associated template, merge
	// properties from the template into this entity instance
	var template = entity.template;
	
	if (template && this.templates[template]) {
		for (var p in this.templates[template]) {
		
			// Overwrite only if the entity doesn't have the property
			if (!entity[p]) {
				entity[p] = this.templates[template][p];
			}
		}
	}

	var type = entity.type;
	
	// Call a loader based on entity type
	if (this.entityLoaders[type]) {
		this.entityLoaders[type].apply(this, [id, entity]);
	} else {
		throw 'Unhandled entity type: ' + type;
	}
}

World.prototype.parseEntities = function(entities) {

	for (var id in entities) {
		this.parseEntity(id, entities[id]);
	}
}

/** Returns true if any entities on the map are still loading, and 
	demand for the map to wait for them to finish
	
@return boolean
*/
World.prototype.isLoading = function() {

	// Check for loading props
	var index;
	// @todo isLoading
}

/**
 * @return Entity object or undefined
 */
World.prototype.getEntity = function(eid) {
	
	var ents = this.renderableEntities;
	for (var index in ents) {
		if (ents[index].eid == eid)
			return ents[index];
	}
	
	return undefined;
}

/** Loader callback for entities with type = 'prop' */
World.prototype.loadProp = function(id, properties) {

	var prop = new Map_Prop(id, properties);
	
	// Add it to the map
	this.addRenderableEntity(prop);
}

World.prototype.loadActor = function(id, properties) {
	
	//var actor = new Map_Actor(id, properties);
	
	//this.addRenderableEntity(actor);
}

/** Loader callback for entities with type = 'light' */
World.prototype.loadLight = function(id, properties) {
	// @todo
}

/** Loader callback for entities with type = 'event' */
World.prototype.loadEvent = function(id, properties) {
	// @todo
}

World.prototype.addRenderableEntity = function(obj) {
	
	this.renderableEntities.push(obj);
	this.resort();
}

/** 
 * Removes an entity by reference from the world 
 * 
 * @param entity Entity to remove
 */
World.prototype.removeEntity = function(entity) {
	
	for (var index in this.renderableEntities) {
		if (this.renderableEntities[index] == entity) {
		
			delete this.renderableEntities[index];
			
			// @todo somehow flag the delete event for that renderable, so that
			// it can kill related timers/listeners/etc
			
			// @todo array cleanup somewhere after all iterations are complete, since delete just nullfies
		}
	}
}

/** Flag a resort of the renderable entities. Called whenever an entity moves */
World.prototype.resort = function() {
	this.needsResort = true;
}

/** Reorganizes props on the map based on their Z order and position */
World.prototype.sortRenderables = function() {
	
	/*
		Return less than zero if left should be lower indexed than right
		0 if left is the same as right
		greater than zero if left should be higher indexed than right
	*/
	this.renderableEntities.sort(function(left, right) {

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
}

World.prototype.render = function() {
	
	var index;
	
	// @todo move?
	
	// If we need to resort our renderables, do so
	if (this.needsResort) {
		this.needsResort = false;
		this.sortRenderables();
	}
	
	// Doodle some props
	for (index in this.renderableEntities) {
		this.renderableEntities[index].render();
	}

}

/** 
 * Runs think() for all entities on the map that want to think
 */
World.prototype.think = function() {
	
	/* @todo a register system
	var index;
	
	for (index in this.brainyEntities) {
		this.brainyEntities[index].think();
	}*/
}

/** 
 * Returns true if there's a solid entity between start and end vectors
 *
 * @param vec3 start
 * @param vec3 end
 * @return boolean
 */
World.prototype.pathBlocked = function(start, end) {
	return false; // @todo
}

/**
 * Returns true if an entity collides with the specified rect
 *
 * @param rect r
 * @param entity excluding If supplied, this entity will be ignored
 * @return boolean
 */
World.prototype.isBlocked = function(r, excluding) {

	var entities = this.renderableEntities;
	
	for (var index in entities) {
		if (entities[index] != excluding && entities[index].collides(r)) {
			return true;
		}
	}
	
	return false;
}

