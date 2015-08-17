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
    'Utility',
    'entity/Entity'
], function(Util, Entity) {
    var rect = Util.rect;

    function Prop(context, properties) {
        Entity.call(this, context, properties);
        
        this.width = properties.w;
        this.height = properties.h;
        this.isRenderable = true; // Add this entity to the render queue
        this.collisions = [];
        this.collisionOffset = [0, 0];

        if (properties.hasOwnProperty('collisions')) {
            this.loadCollisions(properties.collisions);
        }

        if (properties.hasOwnProperty('offset')) {
            this.setOffset(properties.offset);
        }
        
        this.setPosition(properties.position);
        this.image = context.resources.load(properties.image);
        
        // If it needs to load external resources, hook for errors
        if (!this.image.isLoaded()) {
        
            // Bind and wait for the image to be loaded
            var self = this;
            this.image.bind('onerror', function() {
                // TODO: do something, revert, load default, etc.
                throw new Error('Failed to load prop image for [' + self.id + ']');
            });
        }
    }

    Prop.prototype = Object.create(Entity.prototype);
    Prop.prototype.constructor = Prop;

    /** 
     * Our loaded state depends on the loaded texture.
     *
     * @return {boolean}
     */
    Prop.prototype.isLoaded = function() {
        return this.image.isLoaded();
    };

    Prop.prototype.loadCollisions = function(collisions) {
        this.collisions = [];
        
        // Map collisions to rects
        for (var i = 0; i < collisions.length; i += 4) {
        
            var r = rect.create([
                    collisions[i],
                    collisions[i+1],
                    collisions[i+2],
                    collisions[i+3]
                ]);

            this.collisions.push(r);
        }
    };

    Prop.prototype.render = function() {
        this.image.render(this.translation, 0.0);
    };

    /**
     * @param {rect} r
     */
    Prop.prototype.getBoundingBox = function(r) {
        
        // @todo factor in rotations and scaling
        // and utilize this.renderable.getTopLeft(), getBottomRight(), etc
        
        // @todo z-axis cube?
        
        r[0] = this.translation[0];
        r[1] = this.translation[0];
        r[2] = this.width;
        r[3] = this.height;
    };

    /**
     * @param {rect} r rectangle in world space to test
     * @return {boolean}
     */
    Prop.prototype.collides = function(r) {
        
        // @todo solidity flag for the optional "collides with me but 
        // I'm not solid, so it's a trigger collide" or something... ?
        
        /*
            Collision rectangles are relative to this.collisionOffset,
            where, by default (0, 0) points to the top left corner of 
            the entity's AABB. A rectangle [0, 0, this.width, this.height]
            indicates that the entire AABB of the entity is considered solid.
            Whereas, if the entity mimics an Actor and it's offset is 
            set to [w/2, h], and collisionOffset = [w/2, h], then
            a rectangle of [-8, -8, 16, 16] wraps the entity's world space
            coordinates in a 16x16 collision box. Or, if collisioOffset is
            left unchanged, [w/2 - 8, h - 8, 16, 16] does the same work.
        */

        // @todo factor in z-axis
        
        var nr = rect.create(r);
        nr[0] = nr[0] - this.translation[0] + this.collisionOffset[0];
        nr[1] = nr[1] - this.translation[1] + this.collisionOffset[1];

        var collisions = this.collisions;
        if (collisions) {
        
            for (var index in collisions) {
                if (rect.intersects(nr, collisions[index])) {
                    return true;
                }
            }
        }
        
        return false;
    };

    return Prop;
});
