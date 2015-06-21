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

    function Camera(renderer) {
        Util.extend(this, EventHooks); // Allow events to be fired from the camera

        var followedEntity = false,
            position = vec3.create(), // Our position would be the same as the canvas
            zoom = 1.0, // Factor to zoom the viewport. TODO: disable (or implement?!) for canvas mode
            lastFollowedPosition = vec3.create(),
            translation = vec3.create(),
            bounds = rect.create(),
            gl = renderer.getGLContext();
        
        this.setupViewport = function() {
        
            this.update();
        
            if (renderer.isWebGL()) {
        
                gl.viewport(0, 0, gl.viewportWidth, gl.viewportHeight);
                
                // set up projection matrix
                // @todo don't I only have to do this once? Or only when zoom changes?
                mat4.ortho(0, gl.viewportWidth * zoom, 0, gl.viewportHeight * zoom, 0.0, -1000.0, gl.pMatrix);
                
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
            
            mat4.translate(gl.mvMatrix, translation);
            
            renderer.clear();
        };
            
        this.setBounds = function(r) {
            rect.set(r, bounds);
        };

        /**
         * Orders this camera to remain centered on a specific entity 
         * (Entity is defined as any object with a getPosition() method)
         */
        this.followEntity = function(entity) {
            
            if (typeof entity.getPosition !== 'function') {
                throw 'Followed entity must have a getPosition() method.';
            }

            followedEntity = entity;
            this.fire('follow', entity);
        };

        /** 
         * @return object|null
         */
        this.getFollowedEntity = function() {
            return followedEntity;
        };
    
        /** 
         * Calculates the vector we need to translate the camera for rendering.
         * 
         * @return vec3
         */
        this.updateTranslation = function() {
            
            // @see http://www.opengl.org/archives/resources/faq/technical/transformations.htm#tran0030
            // for explaination about the 0.375 correction
            translation[0] = gl.viewportWidth * zoom * 0.5 - position[0]; //- 0.375; 
            translation[1] = gl.viewportHeight * zoom * 0.5 - position[1]; // + 0.375;
        };

        /**
         * Sets the center of this camera to the point defined
         * and unsets getFollowedEntity()
         */
        this.setCenter = function(x, y) {
            
            followedEntity = null;

            position[0] = x;
            position[1] = y;
            
            this.applyBounds();
            this.updateTranslation();

            this.fire('move', position);
        };

        /**
         * @return vec3
         */
        this.getCenter = function() {
            return position;
        };
        
        /**
         * Updates the center of this camera to match the followed entity, if 
         * the followed entity has moved since our last check
         */
        this.update = function() {
            
            // If we're following an entity...
            if (followedEntity) {
            
                var epos = followedEntity.getPosition();
                
                // If the entity moved since last we checked, move the camera
                if (!vec3.equals(lastFollowedPosition, epos)) {
                    
                    vec3.set(epos, lastFollowedPosition);
            
                    // Update camera position
                    vec3.set(epos, position);
                    
                    // @todo maybe clean this up a little better?
                    position[1] += epos[2]; // Factor in entity Z-order
                    
                    //vec3.scale(this._position, this.zoom);
                    
                    this.applyBounds();
                    this.updateTranslation();

                    this.fire('move', position);
                }
            }
        };
        
        this.canvasVec3ToWorld = function(pos, result) {
            
            // TODO: reduce these equations
            result[0] = (pos[0] - gl.viewportWidth * 0.5) * zoom + position[0];
            result[1] = (gl.viewportHeight - pos[1] - gl.viewportHeight * 0.5 ) * zoom + position[1];
        };

        /**
         * Keeps camera position within the bounding box, if specified.
         */
        this.applyBounds = function() {
            
            if (bounds[0] != bounds[2] && bounds[1] != bounds[3]) {
            
                var w = gl.viewportWidth * zoom;
                var h = gl.viewportHeight * zoom;
                
                var x = position[0] - w * 0.5;
                var y = position[1] - h * 0.5;

                if (x < bounds[0])
                    x = bounds[0];
                
                if (x + w >= bounds[2])
                    x = bounds[2] - w;
                
                if (y < bounds[1])
                    y = bounds[1];
                    
                if (y + h >= bounds[3])
                    y = bounds[3] - h;
                    
                position[0] = x + w * 0.5;
                position[1] = y + h * 0.5;
            }
        };
    }

    return Camera;
});
