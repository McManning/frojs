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

        this.children = [];
        this.parent = null;
    }

    Entity.prototype.destroy = function() {

        // Fire a destroy event to any listeners 
        this.fire('destroy');

        // If we have a parent, detach ourselves from it
        if (this.parent) {
            this.parent.removeChild(this);
        }

        // Destroy children as well
        if (this.children) {
            for (var i = 0; i < this.children.length; i++) {
                this.children[i].setParent(null);
                this.children[i].destroy();
            }
        }
        
        // Nuke the entity itself
        this.context.world.remove(this);
    };

    /**
     * Add a new entity as a child to this. Children entities
     * have their position always relative to the parent. Whereas
     * translation is their actual world position. 
     */
    Entity.prototype.addChild = function(entity) {
        this.children.push(entity);
        entity.setParent(this);
        this.fire('add', entity);
    };

    Entity.prototype.removeChild = function(entity) {
        var index = this.children.indexOf(entity);
        if (~index) {
            this.children.splice(index, 1);
            entity.setParent(null);
            this.fire('remove', entity);
        }
    };

    Entity.prototype.setParent = function(entity) {
        this.parent = entity;
        this.fire('parent', entity);
    };

    /**
     * Returns a new vec3 representing our position in local space.
     * If this entity does not have a parent, this is equivalent to
     * our position in world space. Otherwise, it is relative to 
     * the parent's position.
     */
    Entity.prototype.getPosition = function() {

        return vec3.create(this.position);
    };

    /** 
     * Returns a new vec3 representing our position in world space.
     *
     * @return {vec3} 
     */
    Entity.prototype.getWorldPosition = function() {

        var pos = this.getPosition();
        if (this.parent) {
            vec3.add(pos, this.parent.getWorldPosition());
        }

        return pos;
    };

    /**
     * Set the entity's position in local space. 
     * Accepts either an (x,y) pair or an (x,y,z) 
     * to also specify the z-order.
     *
     * @param {vec3} position
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
     * Set the offset coordinates (in pixels) that our
     *  image renders from our position in local space. 
     *
     * @param {vec3} offset
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
        
        // update world render translation appropriately
        var pos = this.getWorldPosition();
        
        vec3.add(pos, this.offset);

        // If translation changes, update translation of children as well
        if (!vec3.equals(pos, this.translation)) {
            vec3.set(pos, this.translation);

            for (var i = 0; i < this.children.length; i++) {
                this.children[i].updateTranslation();
            }
        }
    };

    /**
     * @return {boolean} 
     */
    Entity.prototype.collides = function(r) {
        // jshint unused: false
    };

    return Entity;
});
