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
     * Built-in image resource type.
     */
    function Image(context) {
        Util.extend(this, EventHooks);

        var id,
            url,
            width,
            height,
            shader,
            fitToTexture,
            image,
            texture,
            vbuf, // vertex buffer for our loaded image
            tbuf, // texture buffer for our loaded image
            gl = context.renderer.getGLContext();


        this.load = function(properties) {
            /*
                Expected JSON parameters:
                    id - resource identifier
                    url - image url
                    width - texture dimensions
                    height - texture dimensions
                    shader - shader resource ID applied while rendering
                    fitToTexture - whether the width/height should change based on the loaded texture dimensions
            */

            id = properties.id;
            
            width = properties.width;
            height = properties.height;
            shader = context.renderer.getShader(properties.shader); // TODO: handle default shader (if missing parameter)
            fitToTexture = properties.fitToTexture;
            
            // If this image resource uses an external url, load it as a texture
            if ('url' in properties) {
                url = properties.url;
                
                image = new window.Image();
                image.crossOrigin = ''; // Enable CORS support (Sybolt#59)
                image.src = properties.url;
                
                var self = this;
                image.onload = function() {
                    
                    /* TODO: We assume all images loaded will be used as
                        textures, so here we would perform the conversion
                        and test for any errors that may occur
                    */
                    self.setupTexture();
                    
                    self.fire('onload', self);
                };
                
                // hook an error handler
                image.onerror = function() { 
                    self.fire('onerror', self);
                };
            }
        };

        this.getId = function() {
            return id;
        };

        /**
         * Construct this.texture from this.img Image resource
         * and resource properties
         */
        this.setupTexture = function() {

            // Make sure our image is actually loaded
            if (!this.isLoaded()) {
                throw new Error('Cannot get texture, image not yet loaded for [' + id + ']');
            }

            texture = context.renderer.createTexture(image);
            this.buildVertexBuffer();
            this.buildTextureBuffer();
        };

        this.isLoaded = function() {

            if (!image || !image.complete) {
                return false;
            }
            
            if (typeof image.naturalWidth !== 'undefined' && 
                image.naturalWidth === 0) {
                return false;
            }
            
            return true;
        };

        this.getTexture = function() {

            if (!texture) {
                this.setupTexture();
            }
            
            return texture;
        };

        /**
         * @param vec3 position Translation position.
         * @param float rotation Optional. Angle (in radians) to rotate.
         * @param vec2 clip Optional. Source (x, y) to render from.
         */
        this.render = function(position, rotation, clip) {

            // Switch shaders to the active one for this image
            context.renderer.useShader(shader);
            
            // Begin draw, setup
            gl.mvPushMatrix();
            
            mat4.translate(gl.mvMatrix, position);
            
            if (rotation) {
                mat4.rotateZ(gl.mvMatrix, rotation);
            }

            // Set up buffers to use
            gl.bindBuffer(gl.ARRAY_BUFFER, vbuf);
            gl.vertexAttribPointer(shader.getAttrib('aVertexPosition'), 
                                    vbuf.itemSize, gl.FLOAT, false, 0, 0);
            
            gl.bindBuffer(gl.ARRAY_BUFFER, tbuf);
            gl.vertexAttribPointer(shader.getAttrib('aTextureCoord'), 
                                    tbuf.itemSize, gl.FLOAT, false, 0, 0);

            if (!texture) {
                throw new Error('No texture loaded for image [' + id + ']');
            }

            shader.bindTexture('uSampler', texture);
            
            // @todo does the default texture also perform clipping? 
            // I wanted it to be scaled, but rendered fully.
            if (clip) {
            
                if (!image) {
                    throw new Error('Texture [' + id + '] has no image source to clip');
                }

                var h = (height === 0) ? 1.0 : height / this.getTextureHeight();
                var x = clip[0] / this.getTextureWidth();
                var y = 1.0 - h - clip[1] / this.getTextureHeight();

                gl.uniform2f(shader.getUniform('uClip'), x, y);
            } else {
                gl.uniform2f(shader.getUniform('uClip'), 0, 0);
            }
            
            gl.setMatrixUniforms();
            gl.drawArrays(gl.TRIANGLE_STRIP, 0, vbuf.itemCount);

            // End draw, reset
            gl.mvPopMatrix();
        };

        this.buildVertexBuffer = function() {

            if (vbuf) {
                gl.deleteBuffer(vbuf);
            }
            
            var w = width * 0.5;
            var h = height * 0.5;

            vbuf = gl.createBuffer();
            gl.bindBuffer(gl.ARRAY_BUFFER, vbuf);

            // triangle strip form (since there's no GL_QUAD)
            gl.bufferData(gl.ARRAY_BUFFER, 
                new glMatrixArrayType([
                    w, -h, // bottom right
                    w, h, // top right
                    -w, -h, // bottom left
                    -w, h // top left
                ]), gl.STATIC_DRAW);
                
            vbuf.itemSize = 2;
            vbuf.itemCount = 4;
        };

        this.buildTextureBuffer = function() {

            if (tbuf) {
                gl.deleteBuffer(tbuf);
            }
            
            // Create texture mapping
            tbuf = gl.createBuffer();
            gl.bindBuffer(gl.ARRAY_BUFFER, tbuf);

            var x = 0.0, y = 0.0, w = 1.0, h = 1.0;

            w = width / this.getTextureWidth();
            h = height / this.getTextureHeight();

            gl.bufferData(gl.ARRAY_BUFFER, 
                    new glMatrixArrayType([
                        x+w, y,
                        x+w, y+h,
                        x, y,
                        x, y+h
                    ]), gl.STATIC_DRAW);

            tbuf.itemSize = 2;
            tbuf.itemCount = 4;
        };

        this.getTextureWidth = function() {
            return image.width;
        };

        this.getTextureHeight = function() {
            return image.height;
        };
    }

    return Image;
});
