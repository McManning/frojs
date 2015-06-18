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

/** Base class for all objects on a map */
function Map_RenderableEntity() {}
Map_RenderableEntity.prototype = new Map_Entity();

Map_RenderableEntity.prototype.initialise = function(eid, properties) {
	Map_Entity.prototype.initialise.call(this, eid, properties);

	this.visible = true; // Whether or not we should draw this entity this frame
	this.isRenderable = true; // Entities inherited from this type will be added to the render queue
}

Map_RenderableEntity.prototype.destroy = function() {
	Map_Entity.prototype.destroy.call(this);
}
