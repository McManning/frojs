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
    var vec3 = Util.vec3,
        rect = Util.rect,
        mat4 = Util.mat4;

    // TODO: Make the camera an entity child, so follow is done just by parenting.
    // As well, if the child entity is destroyed, don't destroy the camera and instead
    // delink and re-associate with the world's root entity (when applicable)

    function Camera(context, options) {
        Util.extend(this, EventHooks); // Allow events to be fired from the camera
        // jshint unused:false
        // temp hint for options until I move init code over here.
        this.trackedEntity = null;
        this.position = options.position || vec3.create();
        this.zoom = 1.0; // Factor to this.zoom the viewport. TODO: disable (or implement?!) for canvas mode
        this.lastTrackedPosition = vec3.create();
        this.translation = vec3.create();
        this.bounds = rect.create();
        this.context = context;

        if (options.hasOwnProperty('trackedEntity')) {
            var entity = this.context.find(options.trackedEntity);
            this.trackedEntity = entity;
        }
        
        if (options.hasOwnProperty('bounds')) {
            this.setBounds(options.bounds);
        }

        this.updateTranslation();
    }

    Camera.prototype.setupViewport = function() {
        var gl = this.context.renderer.getGLContext();

        this.update();
    
        // If the canvas has changed size, resize our viewport
        if (gl.canvas.width !== gl.canvas.clientWidth ||
            gl.canvas.height !== gl.canvas.clientHeight) {

            // Update canvas size to match client size
            gl.canvas.width = gl.canvas.clientWidth;
            gl.canvas.height = gl.canvas.clientHeight;

            // Keep the viewport at a nice even number so pixels remain as expected
            gl.viewportWidth = 2 * Math.round(gl.canvas.width * 0.5);
            gl.viewportHeight = 2 * Math.round(gl.canvas.height * 0.5);

            // Re-orient our translation to match the new viewport
            this.applyBounds();
            this.updateTranslation();
        }
        
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
    Camera.prototype.trackEntity = function(entity) {
        
        if (typeof entity.getPosition !== 'function') {
            throw 'Followed entity must have a getPosition() method.';
        }

        this.trackedEntity = entity;
        this.fire('follow', entity);
    };

    /** 
     * @return object|null
     */
    Camera.prototype.getTrackedEntity = function() {

        return this.trackedEntity;
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
     * and unsets getTrackedEntity()
     *
     * @param {vec3} position (z-axis is ignored)
     */
    Camera.prototype.setCenter = function(position) {
        
        this.trackedEntity = null;

        this.position[0] = position[0];
        this.position[1] = position[1];
        
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
        if (this.trackedEntity) {
        
            var epos = this.trackedEntity.getPosition();
            
            // If the entity moved since last we checked, move the camera
            if (!vec3.equals(this.lastTrackedPosition, epos)) {
                
                vec3.set(epos, this.lastTrackedPosition);
        
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
    
    Camera.prototype.canvasVec3ToWorld = function(position) {
        var gl = this.context.renderer.getGLContext();

        // TODO: reduce these equations
        // TODO: Equations are screwed. Resolve. 
        position[0] = Math.floor((position[0] - gl.viewportWidth * 0.5) * this.zoom + this.position[0]);
        position[1] = Math.floor((position[1] - gl.viewportHeight * 0.5) * this.zoom + this.position[1]);
        //position[1] = Math.floor((gl.viewportHeight - position[1] - gl.viewportHeight * 0.5 ) * this.zoom + this.position[1]);
    
        // off by 400 300 when zoom = 0.5
        // off by 200 150 REAL pixels when zoom = 2  (0.5x zoom)
        // width * this.zoom 
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
