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
    function Image(context, properties) {
        Util.extend(this, EventHooks);

        /*
            Expected JSON parameters:
                id - resource identifier
                url - image url
                width - texture dimensions
                height - texture dimensions
                shader - shader resource ID applied while rendering
                fitToTexture - whether the width/height should change based on the loaded texture dimensions
        */

        this.id = properties.id;
        this.type = properties.type;
        
        //this.vbuf = 
        //this.tbuf = 
        //this.texture = 
        this.context = context;

        this.width = properties.width;
        this.height = properties.height;
        this.shader = context.renderer.getShader(properties.shader); // TODO: handle default shader (if missing parameter)
        this.fitToTexture = properties.fitToTexture;
        
        // If this image resource uses an external url, load it as a texture
        if ('url' in properties) {
            this.url = properties.url;
            
            this.image = new window.Image();
            this.image.crossOrigin = ''; // Enable CORS support (Sybolt#59)
            this.image.src = properties.url;
            
            var self = this;
            this.image.onload = function() {
                
                /* TODO: We assume all images loaded will be used as
                    textures, so here we would perform the conversion
                    and test for any errors that may occur
                */
                self.setupTexture();
                
                self.fire('onload', self);
            };
            
            // hook an error handler
            this.image.onerror = function() { 
                self.fire('onerror', self);
            };
        }
    }
    
    /**
     * Construct this.texture from this.img Image resource
     * and resource properties
     */
    Image.prototype.setupTexture = function() {

        // Make sure our image is actually loaded
        if (!this.isLoaded()) {
            throw new Error('Cannot get texture, image not yet loaded for [' + this.id + ']');
        }

        this.texture = this.context.renderer.createTexture(this.image);
        this.buildVertexBuffer();
        this.buildTextureBuffer();
    };

    Image.prototype.isLoaded = function() {

        if (!this.image || !this.image.complete) {
            return false;
        }
        
        if (typeof this.image.naturalWidth !== 'undefined' && 
            this.image.naturalWidth === 0) {
            return false;
        }
        
        return true;
    };

    Image.prototype.getTexture = function() {

        if (!this.texture) {
            this.setupTexture();
        }
        
        return this.texture;
    };

    /**
     * @param vec3 position Translation position.
     * @param float rotation Optional. Angle (in radians) to rotate.
     * @param vec2 clip Optional. Source (x, y) to render from.
     */
    Image.prototype.render = function(position, rotation, clip) {
        var gl = this.context.renderer.getGLContext();

        // If we have no source yet, skip render.
        if (!this.isLoaded()) {
            return;
        }

        if (!this.texture) {
            throw new Error('No texture loaded for image [' + this.id + ']');
        }

        // Switch shaders to the active one for this image
        this.context.renderer.useShader(this.shader);
        
        // Begin draw, setup
        gl.mvPushMatrix();
        
        mat4.translate(gl.mvMatrix, position);
        
        if (rotation) {
            mat4.rotateZ(gl.mvMatrix, rotation);
        }

        // Set up buffers to use
        gl.bindBuffer(gl.ARRAY_BUFFER, this.vbuf);
        gl.vertexAttribPointer(this.shader.getAttrib('aVertexPosition'), 
                                this.vbuf.itemSize, gl.FLOAT, false, 0, 0);
        
        gl.bindBuffer(gl.ARRAY_BUFFER, this.tbuf);
        gl.vertexAttribPointer(this.shader.getAttrib('aTextureCoord'), 
                                this.tbuf.itemSize, gl.FLOAT, false, 0, 0);

        this.shader.bindTexture('uSampler', this.texture);
        
        // @todo does the default texture also perform clipping? 
        // I wanted it to be scaled, but rendered fully.
        if (clip) {
        
            if (!this.image) {
                throw new Error('Texture [' + this.id + '] has no image source to clip');
            }

            var h = (this.height === 0) ? 1.0 : this.height / this.getTextureHeight();
            var x = clip[0] / this.getTextureWidth();
            var y = 1.0 - h - clip[1] / this.getTextureHeight();

            gl.uniform2f(this.shader.getUniform('uClip'), x, y);
        } else {
            gl.uniform2f(this.shader.getUniform('uClip'), 0, 0);
        }
        
        gl.setMatrixUniforms();
        gl.drawArrays(gl.TRIANGLE_STRIP, 0, this.vbuf.itemCount);

        // End draw, reset
        gl.mvPopMatrix();
    };

    Image.prototype.buildVertexBuffer = function() {
        var gl = this.context.renderer.getGLContext();

        if (this.vbuf) {
            gl.deleteBuffer(this.vbuf);
        }
        
        var w = this.width * 0.5;
        var h = this.height * 0.5;

        this.vbuf = gl.createBuffer();
        gl.bindBuffer(gl.ARRAY_BUFFER, this.vbuf);

        // triangle strip form (since there's no GL_QUAD)
        gl.bufferData(gl.ARRAY_BUFFER, 
            new glMatrixArrayType([
                w, -h, // bottom right
                w, h, // top right
                -w, -h, // bottom left
                -w, h // top left
            ]), gl.STATIC_DRAW);
            
        this.vbuf.itemSize = 2;
        this.vbuf.itemCount = 4;
    };

    Image.prototype.buildTextureBuffer = function() {
        var gl = this.context.renderer.getGLContext();

        if (this.tbuf) {
            gl.deleteBuffer(this.tbuf);
        }
        
        // Create texture mapping
        this.tbuf = gl.createBuffer();
        gl.bindBuffer(gl.ARRAY_BUFFER, this.tbuf);

        var x = 0.0, y = 0.0, w = 1.0, h = 1.0;

        w = this.width / this.getTextureWidth();
        h = this.height / this.getTextureHeight();

        gl.bufferData(gl.ARRAY_BUFFER, 
                new glMatrixArrayType([
                    x+w, y,
                    x+w, y+h,
                    x, y,
                    x, y+h
                ]), gl.STATIC_DRAW);

        this.tbuf.itemSize = 2;
        this.tbuf.itemCount = 4;
    };

    Image.prototype.getTextureWidth = function() {
        return this.image.width;
    };

    Image.prototype.getTextureHeight = function() {
        return this.image.height;
    };

    return Image;
});
