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

    function Camera(context, options) {
        Util.extend(this, EventHooks); // Allow events to be fired from the camera
        // jshint unused:false
        // temp hint for options until I move init code over here.

        this.followedEntity = false;
        this.position = vec3.create(); // Our position would be the same as the canvas
        this.zoom = 1.0; // Factor to this.zoom the viewport. TODO: disable (or implement?!) for canvas mode
        this.lastFollowedPosition = vec3.create();
        this.translation = vec3.create();
        this.bounds = rect.create();
        this.context = context;

        if (options.hasOwnProperty('bounds')) {
            this.setBounds(options.bounds);
        }
    }

    Camera.prototype.setupViewport = function() {
        var gl = this.context.renderer.getGLContext();

        this.update();
    
        if (this.context.renderer.isWebGL()) {
    
            gl.viewport(0, 0, gl.viewportWidth, gl.viewportHeight);
            
            // set up projection matrix
            // @todo don't I only have to do this once? Or only when this.zoom changes?
            mat4.ortho(0, gl.viewportWidth * this.zoom, 0, gl.viewportHeight * this.zoom, 0.0, -1000.0, gl.pMatrix);
            
            // set up model view matrix
            mat4.identity(gl.mvMatrix);
            
            // Translate origin away from our camera
            //var trans = vec3.create(this._position);
            //trans[0] *= -1;
            //trans[1] *= -1;
        
        } else {
            // @todo Canvas transformation reset and handling
            gl.setTransform(1, 0, 0, 1, 0, 0);
        }
        
        mat4.translate(gl.mvMatrix, this.translation);
        
        this.context.renderer.clear();
    };
        
    Camera.prototype.setBounds = function(r) {

        rect.set(r, this.bounds);
    };

    /**
     * Orders this camera to remain centered on a specific entity 
     * (Entity is defined as any object with a getPosition() method)
     */
    Camera.prototype.followEntity = function(entity) {
        
        if (typeof entity.getPosition !== 'function') {
            throw 'Followed entity must have a getPosition() method.';
        }

        this.followedEntity = entity;
        this.fire('follow', entity);
    };

    /** 
     * @return object|null
     */
    Camera.prototype.getFollowedEntity = function() {

        return this.followedEntity;
    };

    /** 
     * Calculates the vector we need to translate the camera for rendering.
     * 
     * @return vec3
     */
    Camera.prototype.updateTranslation = function() {
        var gl = this.context.renderer.getGLContext();

        // @see http://www.opengl.org/archives/resources/faq/technical/transformations.htm#tran0030
        // for explaination about the 0.375 correction
        this.translation[0] = gl.viewportWidth * this.zoom * 0.5 - this.position[0]; //- 0.375; 
        this.translation[1] = gl.viewportHeight * this.zoom * 0.5 - this.position[1]; // + 0.375;
    };

    /**
     * Sets the center of this camera to the point defined
     * and unsets getFollowedEntity()
     */
    Camera.prototype.setCenter = function(x, y) {
        
        this.followedEntity = null;

        this.position[0] = x;
        this.position[1] = y;
        
        this.applyBounds();
        this.updateTranslation();

        this.fire('move', this.position);
    };

    /**
     * @return vec3
     */
    Camera.prototype.getCenter = function() {

        return this.position;
    };
    
    /**
     * Updates the center of this camera to match the followed entity, if 
     * the followed entity has moved since our last check
     */
    Camera.prototype.update = function() {
        
        // If we're following an entity...
        if (this.followedEntity) {
        
            var epos = this.followedEntity.getPosition();
            
            // If the entity moved since last we checked, move the camera
            if (!vec3.equals(this.lastFollowedPosition, epos)) {
                
                vec3.set(epos, this.lastFollowedPosition);
        
                // Update camera position
                vec3.set(epos, this.position);
                
                // @todo maybe clean this up a little better?
                this.position[1] += epos[2]; // Factor in entity Z-order
                
                //vec3.scale(this._position, this.this.zoom);
                
                this.applyBounds();
                this.updateTranslation();

                this.fire('move', this.position);
            }
        }
    };
    
    Camera.prototype.canvasVec3ToWorld = function(pos, result) {
        var gl = this.context.renderer.getGLContext();

        // TODO: reduce these equations
        result[0] = (pos[0] - gl.viewportWidth * 0.5) * this.zoom + this.position[0];
        result[1] = (gl.viewportHeight - pos[1] - gl.viewportHeight * 0.5 ) * this.zoom + this.position[1];
        result[0] = Math.floor((pos[0] - gl.viewportWidth * 0.5) * this.zoom + this.position[0]);
        result[1] = Math.floor((gl.viewportHeight - pos[1] - gl.viewportHeight * 0.5 ) * this.zoom + this.position[1]);
    };

    /**
     * Keeps camera position within the bounding box, if specified.
     */
    Camera.prototype.applyBounds = function() {
        var gl = this.context.renderer.getGLContext();

        if (this.bounds[0] !== this.bounds[2] && this.bounds[1] !== this.bounds[3]) {
        
            var w = gl.viewportWidth * this.zoom;
            var h = gl.viewportHeight * this.zoom;
            
            var x = this.position[0] - w * 0.5;
            var y = this.position[1] - h * 0.5;

            if (x < this.bounds[0]) {
                x = this.bounds[0];
            }
            
            if (x + w >= this.bounds[2]) {
                x = this.bounds[2] - w;
            }
            
            if (y < this.bounds[1]) {
                y = this.bounds[1];
            }
                
            if (y + h >= this.bounds[3]) {
                y = this.bounds[3] - h;
            }
                
            this.position[0] = x + w * 0.5;
            this.position[1] = y + h * 0.5;
        }
    };

    return Camera;
});
