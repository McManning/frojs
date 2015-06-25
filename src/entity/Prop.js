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
    'entity/Entity'
], function(Entity) {

    function Prop(context, properties) {
        Entity.call(this, context, properties);
        
        this.width = properties.w;
        this.height = properties.h;
        this.clip = rect.create();
        this.isRenderable = true; // Add this entity to the render queue
        this.collisions = [];
        this.delay = 0;

        if ('collisions' in properties) {
            this.loadCollisions(properties.collisions);
        }

        if ('offset_x' in properties) {
            this.offset[0] = properties.offset_x;
        }
        
        if ('offset_y' in properties) {
            this.offset[1] = properties.offset_y;
        }
        
        this.setPosition(properties.x, properties.y, properties.z);
        
        // If there's a delay key, this prop is animated.
        // Our dimensions will define a clip of the image, rather than the whole thing
        if ('delay' in properties && properties.delay > 0) {
            this.delay = properties.delay;
            this.frame = 0;
            
            this.animateInterval = context.timers.addInterval(
                this, this.animate, this.delay
            );
        }
        
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

    Prop.prototype.destroy = function() {
        this.context.timers.removeInterval(this.animateInterval);
        Entity.prototype.destroy.call(this);
    };

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

    Prop.prototype.animate = function() {
        
        if (this.delay > 0 && this.image.getTexture()) {
        
            this.frame = this.frame + 1;

            // Determine if the next calculated frame is actually within the source image
            if (this.image.getTextureWidth() >= (this.width * (this.frame + 1))) {

                this.clip[0] = this.frame * this.width;
                this.clip[1] = 0;
                
            } else { // loop to the start
            
                this.frame = 0;
                this.clip[0] = 0;
                this.clip[1] = 0;
            }
        }
    };

    Prop.prototype.render = function() {
        this.image.render(this.translation, 0, this.clip);
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
