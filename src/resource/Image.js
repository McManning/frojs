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

function ImageResource() {}
ImageResource.prototype = new Resource();

ImageResource.prototype.load = function(json) {
    Resource.prototype.load.call(this, json);
    
    /*
        Expected JSON parameters:
        id - resource identifier
        url - image url
        width - texture dimensions
        height - texture dimensions
        shader - shader resource ID applied while rendering
        fitToTexture - whether the width/height should change based on the loaded texture dimensions
        
    */

    this.id = json.id;
    
    this.width = json.width;
    this.height = json.height;
    this.shader = json.shader;
    this.fitToTexture = json.fitToTexture;
    
    // If this image resource uses an external url, load it as a texture
    if ('url' in json) {
        this.url = json.url;
        
        this.img = new Image(); 
        this.img.crossOrigin = ''; // Enable CORS support (Sybolt#59)
        this.img.src = json.url;
        
        var self = this;
        this.img.onload = function() {
            
            /* @todo We assume all images loaded will be used as
                textures, so here we would perform the conversion
                and test for any errors that may occur
            */
            self.setupTexture();
            
            self.fire('onload', self);
        }
        
        // hook an error handler
        this.img.onerror = function() { 
            self.fire('onerror', self);
        }
    }
}

/**
 * Construct this.texture from this.img Image resource
 * and resource properties
 */
ImageResource.prototype.setupTexture = function() {

    // Make sure our image is actually loaded
    if (!this.isLoaded()) {
        throw new Error('Cannot get texture, image not yet loaded for ' + this.id);
    }

    this.texture = fro.renderer.createTexture(this.img);
    this.buildVertexBuffer();
    this.buildTextureBuffer();
}

ImageResource.prototype.isLoaded = function() {

    if (!('img' in this) || !this.img.complete) {
        return false;
    }
    
    if (typeof this.img.naturalWidth != 'undefined' 
        && this.img.naturalWidth == 0) {
        return false;
    }
    
    return true;
}

ImageResource.prototype.getTexture = function() {

    if (!('texture' in this)) {
        this.setupTexture();
    }
    
    return this.texture;
}

ImageResource.prototype.render = function(position, rotation, clip) {

    var shader = fro.renderer.getShader(this.shader);
    fro.renderer.useShader(shader);
    
    // Begin draw, setup
    gl.mvPushMatrix();
    
    mat4.translate(gl.mvMatrix, position);
    
    if (rotation) {
        mat4.rotateZ(gl.mvMatrix, rotation);
    }

    // Set up buffers to use
    gl.bindBuffer(gl.ARRAY_BUFFER, this.vbuf);
    gl.vertexAttribPointer(shader.getAttrib('aVertexPosition'), 
                            this.vbuf.itemSize, gl.FLOAT, false, 0, 0);
    
    gl.bindBuffer(gl.ARRAY_BUFFER, this.tbuf);
    gl.vertexAttribPointer(shader.getAttrib('aTextureCoord'), 
                            this.tbuf.itemSize, gl.FLOAT, false, 0, 0);
    var texture;
    if (this.texture) {
        texture = this.texture;
    } else {
        texture = fro.resources.defaultTexture;
    }
    
    shader.bindTexture('uSampler', texture);
    
    // @todo does the default texture also perform clipping? 
    // I wanted it to be scaled, but rendered fully.
    if (clip) {
    
        if (!this.img) {
            throw new Error('Texture ' + this.id + ' has no image source to clip');
        }

        var h = (this.height == 0) ? 1.0 : this.height / this.getTextureHeight();
        var x = clip[0] / this.getTextureWidth();
        var y = 1.0 - h - clip[1] / this.getTextureHeight();

        gl.uniform2f(shader.getUniform('uClip'), x, y);
    } else {
        gl.uniform2f(shader.getUniform('uClip'), 0, 0);
    }
    
    gl.setMatrixUniforms();
    gl.drawArrays(gl.TRIANGLE_STRIP, 0, this.vbuf.itemCount);

    // End draw, reset
    gl.mvPopMatrix();
}

ImageResource.prototype.buildVertexBuffer = function() {

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
            w, -h, 0.0, // bottom right
            w, h, 0.0, // top right
            -w, -h, 0.0, // bottom left
            -w, h, 0.0 // top left
        ]), gl.STATIC_DRAW);
        
    this.vbuf.itemSize = 3;
    this.vbuf.itemCount = 4;
}

ImageResource.prototype.buildTextureBuffer = function() {

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
}

ImageResource.prototype.getTextureWidth = function() {
    return this.img.width;
}

ImageResource.prototype.getTextureHeight = function() {
    return this.img.height;
}
