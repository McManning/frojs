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

/** 
 * A line rendered onto the map. Usually for debugging
 */
function Map_Line(id, properties) {

	this.id = id;

	this.renderable = new RenderableLine();
	this.renderable.setStyle('img/line.png');
	this.renderable.setWidth(13);
	
	this.renderable.setStart(properties.x, properties.y);
	this.renderable.setEnd(properties.dx, properties.dy);
	
	this.zorder = properties.z;
	this.timeToLive = properties.ttl;
		
	var line = this;
	
	fro.timers.addTimeout(this, function() {
		
		// @todo ent removal
		console.log('I would be deleted, but there is no entity removal yet');
		console.log(line);
		
	}, this.timeToLive);
}

Map_Line.prototype = new Map_Entity();

Map_Line.prototype.render = function() {

	this.renderable.render();
}

/**
 * Returns a reference to our renderables vector position
 * @return vec3
 */
Map_Line.prototype.getPosition = function() {
	return this.renderable.position;
}

/**
 * @param rect r
 */
Map_Line.prototype.getBoundingBox = function(r) {
	
	// @todo logic
}


