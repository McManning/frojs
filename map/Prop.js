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
 * A visible object placed on the map, with its own image/animation 
 * and collision data 
 */
function Map_Prop() {}
Map_Prop.prototype = new Map_RenderableEntity();

Map_Prop.prototype.initialise = function(eid, properties) {
    Map_RenderableEntity.prototype.initialise.call(this, eid, properties);
    
    this.depth = properties.d;
    
    this.width = properties.w;
    this.height = properties.h;

    this.HSVShift = vec3.create();
    this.clip = rect.create();

    if (properties.collisions) {
        this.loadCollisions(properties.collisions);
        fro.log.debug('Collisions for ' + eid + ': ' + this.collisions.length);
    }

    if (properties.offset_x != undefined)
        this.offset[0] = properties.offset_x;
    
    if (properties.offset_y != undefined)
        this.offset[1] = properties.offset_y;
    
    this.setPosition(properties.x, properties.y, properties.z);
    
    /*     If there's a delay key, this prop is animated.
        Our dimensions will define a clip of the image, rather than the whole thing
    */
    if (properties.delay != undefined && properties.delay > 0) {
        this.delay = properties.delay;
        this.frame = 0;
        
        // @todo fix timer to account for deleted entities
        fro.timers.addInterval(this, this.animate, this.delay);
        
    } else {
        this.delay = 0;
    }
    
    var renderable = fro.resources.load(properties.image);
    
    // If it needs to load external resources, hook for errors
    if (!renderable.isLoaded()) {
    
        // Bind and wait for the image to be loaded
        var self = this;
        renderable.bind('onerror', function() {
        
            // @todo do something, revert, load default, etc.
            fro.log.error('Prop Image Load Error');
            fro.log.error(self);
        });
    }
    
    this.renderable = renderable;

    fro.log.debug('New prop "' + eid + '" at ' + vec3.str(this.position));
}

Map_Prop.prototype.destroy = function() {
    Map_RenderableEntity.prototype.destroy.call(this);
}

/** 
 * Our loaded state depends on the loaded texture 
 * @return boolean
 */
Map_Prop.prototype.isLoaded = function() {
    return (this.renderable.isLoaded());
}

Map_Prop.prototype.loadCollisions = function(collisions) {
    
    this.collisions = new Array();
    
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
}

Map_Prop.prototype.animate = function() {
    
    if (this.delay > 0 && this.renderable.getTexture()) {
    
        this.frame = this.frame + 1;

        // Determine if the next calculated frame is actually within the source image
        if (this.renderable.getTextureWidth() >= (this.width * (this.frame + 1))) {

            this.clip[0] = this.frame * this.width;
            this.clip[1] = 0;
            
        } else { // loop to the start
        
            this.frame = 0;
            this.clip[0] = 0;
            this.clip[1] = 0;
        }
    }
}

/** 
 * Returns true if this prop failed to properly load it's resources 
 * @return boolean
 */
Map_Prop.prototype.failedToLoad = function() {
    return this.error;
}

Map_Prop.prototype.render = function() {

    // Get whatever shader is being used for this prop
    var shader = fro.renderer.getShader(this.renderable.shader);
    fro.renderer.useShader(shader);
    
    // @todo we get/set shader twice for each prop (one here, one in the renderable)
    
    // Bind additional shader uniforms for this specific entity

/*
    gl.uniform3f(shader.getUniform('uEntityPosition'), 
                    position[0], position[1], position[2]
                ); 
    
    gl.uniform3f(shader.getUniform('uEntityDimensions'),
                    this.width, this.height, this.depth
                );
*/
    
    this.renderable.render(this._translation, 0, this.clip);
}

Map_Prop.prototype.think = function() {
    
    // do stuff
}

/**
 * @param rect r
 */
Map_Prop.prototype.getBoundingBox = function(r) {
    
    // @todo factor in rotations and scaling
    // and utilize this.renderable.getTopLeft(), getBottomRight(), etc
    
    // @todo z-axis cube?
    
    r[0] = this.position[0] + this.offset[0];
    r[1] = this.position[1] + this.offset[1];
    r[2] = this.width;
    r[3] = this.height;
}

/**
 * @param rect r
 * @return boolean
 */
Map_Prop.prototype.collides = function(r) {
    
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
            if (rect.intersects(nr, collisions[index]))
                return true;
        }
    }
    
    return false;
}

