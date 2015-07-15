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
        
        r[0] = this.position[0] + this.offset[0];
        r[1] = this.position[1] + this.offset[1];
        r[2] = this.width;
        r[3] = this.height;
    };

    /**
     * @param {rect} r
     * @return {boolean}
     */
    Prop.prototype.collides = function(r) {
        
        // @todo solidity flag for the optional "collides with me but 
        // I'm not solid, so it's a trigger collide" or something... ?
        
        // offset r based on our map position, since each collision rectangle
        // is relative to this entity instance's location
        
        // @todo factor in z-axis
        
        var nr = rect.create(r);
        var pos = this.getPosition();
        nr[0] -= pos[0];
        nr[1] -= pos[1];

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
