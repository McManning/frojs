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

define([
    'EventHooks',
    'Utility'
], function(EventHooks, Util) {

    /**
     * Base model for all entities in the world
     */
    function Entity(context, properties) {
        Util.extend(this, EventHooks);

        this.id = properties.id;
        this.isRenderable = false;
        this.visible = true; // Whether or not we should draw this entity for specific frames
        this.position = vec3.create();
        this.offset = vec3.create();
        this.translation = vec3.create();
        this.context = context;
    }

    Entity.prototype.destroy = function() {

        // Fire a destroy event to any listeners 
        this.fire('destroy');
        
        // Nuke the entity itself
        this.context.world.remove(this);
    };

    Entity.prototype.getPosition = function() {
        return this.position;
    };

    /**
     * Set the entity's position. Accepts either an (x,y) pair
     * or an (x,y,z) to also specify the z-order.
     *
     * @param {vec2|vec3} position
     */
    Entity.prototype.setPosition = function(position) {

        this.position[0] = Math.floor(position[0]);
        this.position[1] = Math.floor(position[1]);

        if (position.length > 2) {
            this.position[2] = Math.floor(position[2]);
        }

        this.updateTranslation();
    };

    Entity.prototype.getOffset = function() {
        return this.offset;
    };

    /**
     * Set the offset coordinates that our image renders from 
     * our base position. 
     *
     * @param {vec2} offset
     */
    Entity.prototype.setOffset = function(offset) {
        this.offset[0] = Math.floor(offset[0]);
        this.offset[1] = Math.floor(offset[1]);

        this.updateTranslation();
    };

    /**
     * @param {rect} r
     */
    Entity.prototype.getBoundingBox = function(r) {
        r[0] = 0;
        r[1] = 0;
        r[2] = 0;
        r[3] = 0;
    };

    Entity.prototype.getRenderable = function() {
        return this.isRenderable;
    };

    Entity.prototype.setRenderable = function(b) {
        this.isRenderable = b;
    };

    Entity.prototype.updateTranslation = function() {
        
        // update render translation appropriately
        this.translation[0] = this.position[0] + this.offset[0];
        this.translation[1] = this.position[1] + this.position[2] + this.offset[1]; // y + z for offsetting according to z-height
    };

    /**
     * @return bool 
     */
    Entity.prototype.collides = function(r) {
        return false && r; // Tiny hack for jshint.
    };

    return Entity;
});
