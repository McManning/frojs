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
function Map_Entity() {
    $.extend(this, EventHooks);
}

Map_Entity.prototype.initialise = function(eid, properties) {
    
    this.eid = eid;
    this.isRenderable = false;
    this.properties = properties;
    
    this.position = vec3.create();
    this.offset = vec3.create();
    this._translation = vec3.create();
}

Map_Entity.prototype.destroy = function() {

    // Fire a destroy event to any listeners 
    this.fire('destroy');
    
    // Nuke the entity itself
    fro.world.remove(this);
}

Map_Entity.prototype.getPosition = function() {
    return this.position;
}

Map_Entity.prototype.setPosition = function(x, y, z) {

    var pos = this.getPosition();
    
    // if it's in the form of setPosition(vec3) 
    if (y == undefined) {
        
        pos[0] = Math.floor(x[0]);
        pos[1] = Math.floor(x[1]);
        pos[2] = Math.floor(x[2]);
        
    } else {
    
        // Form setPosition(x, y)
        pos[0] = Math.floor(x);
        pos[1] = Math.floor(y);
        
        // If it's in the form setPosition(x, y, z)
        if (z != undefined) {
            pos[2] = Math.floor(z);
        }
    }
    
    this._updateTranslation();
}

Map_Entity.prototype._updateTranslation = function() {
    
    // update render translation appropriately
    this._translation[0] = this.position[0] + this.offset[0];
    this._translation[1] = this.position[1] + this.position[2] + this.offset[1]; // y + z for offsetting according to z-height
}

/**
 * @return bool 
 */
Map_Entity.prototype.collides = function(r) {
    return false;
}

/**
 * @param rect r
 */
Map_Entity.prototype.getBoundingBox = function(r) {
    return rect.create(0,0,0,0);
}
