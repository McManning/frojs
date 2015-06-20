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

var gl = null;

fro.renderer = {
    
    initialise : function(options) {
        
        var canvas = options.canvas;
        
        this.usesWebGL = options.webGL;
        this.currentShader = null;
        this.shaders = new Array();
        
        try {
            
            var ctx = canvas.getContext('experimental-webgl');
            gl = ctx; //WebGLDebugUtils.makeDebugContext(ctx, undefined, validateNoneOfTheArgsAreUndefined);
        
            this.usesWebGL = true;
        } catch (e) {
            gl = false;
        }
        
        // No WebGL or canvas support, they can't play!
        if (!gl) {
            throw new Error('No WebGL support!');
        }
    
        gl.viewportWidth = canvas.width;
        gl.viewportHeight = canvas.height;

        // Add some matrix manipulation helpers
        gl.mvMatrix = mat4.create();
        gl.pMatrix = mat4.create();
    
        gl.mvMatrixStack = new Array();
        
        gl.mvPopMatrix = function() {
            if (gl.mvMatrixStack.length == 0) {
                throw new Error('Invalid popMatrix!');
            }
            gl.mvMatrix = gl.mvMatrixStack.pop();
        }
            
        gl.mvPushMatrix = function() {
            var copy = mat4.create();
            mat4.set(gl.mvMatrix, copy);
            gl.mvMatrixStack.push(copy);
        }
        
        // upload matrix changes to the graphics card, since GL doesn't track local changes
        gl.setMatrixUniforms = function() {
            
            var shader = fro.renderer.getCurrentShader();
        
            gl.uniformMatrix4fv(shader.getUniform('uPMatrix'), false, gl.pMatrix);
            gl.uniformMatrix4fv(shader.getUniform('uMVMatrix'), false, gl.mvMatrix);
        }
        
        /*
            From http://en.wikipedia.org/wiki/Alpha_compositing#Alpha_blending
            outA = srcA + dstA(1 - srcA)
            outRGB = srcRGB(srcA) + dstRGB*dstA(1 - srcA)
            
            Orgb = srgb * Srgb + drgb * Drgb
            Oa = sa * Sa + da * Da
            glBlendFuncSeparate(srgb, drgb, sa, da)
            
            @todo eventually phase this out, since blending will work differently within the shader.
        */
        gl.enable(gl.BLEND);
        gl.blendFuncSeparate(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA, gl.ONE, gl.ONE_MINUS_SRC_ALPHA);
    
        this.setClearColor(38, 38, 38);
    },
    
    isWebGL : function() {
        return this.usesWebGL;
    },
    
    clear : function() {
    
        if (this.isWebGL()) {
            gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
        } else {
            gl.fillStyle = this.clearStyle;
            gl.fillRect(0, 0, gl.viewportWidth, gl.viewportHeight);
        }
    },
    
    createTexture : function(image) {
        
        if (this.isWebGL()) {
            var texture = gl.createTexture();

            gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, true);
            gl.bindTexture(gl.TEXTURE_2D, texture);
            gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, image);
            //gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
            //gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);

            gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
            //gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR_MIPMAP_NEAREST);  

            // Supporting non power of two textures
            // See: http://www.khronos.org/webgl/wiki/WebGL_and_OpenGL_Differences#Non-Power_of_Two_Texture_Support
            gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
            gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
            gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);

            // Can't mipmap if want non-power-of-two via wrapping
            //gl.generateMipmap(gl.TEXTURE_2D); 

            gl.bindTexture(gl.TEXTURE_2D, null);
            
        } else {
            throw new Error('Canvas API is not supported (nor will be...)');
        }
        
        return texture;
    },
    
    setClearColor : function(r, g, b) {
        
        if (this.isWebGL()) {
            gl.clearColor(r/255.0, g/255.0, b/255.0, 1.0);
        } else {
            this.clearStyle = 'rgb(' + r + ',' + g + ',' + b + ')';
        }
    },
    
    /** 
     * Set the current shader used by the renderer. 
     * 
     * @param ShaderResource shader
     */
    useShader : function(shader) {

        this.currentShader = shader;
        
        gl.useProgram(shader.getProgram());
    },

    /**
     * Add a new shader to our list of available shaders
     * 
     * @param ShaderResource shader The shader to add
     */
    attachShader : function(shader) {
        this.shaders[shader.id] = shader;
    },
    
    getCurrentShader : function() {
        return this.currentShader;
    },
    
    getShader : function(id) {
        
        if (!(id in this.shaders)) {
            throw new Error('Shader ' + id + ' is not loaded');
        }
        
        return this.shaders[id];
    }
    
    // @todo the functionality of changing active shaders.
    // Need to take in account that we probably need to link a vs/fs to 
    // the same program, causing duplicates if we have duplicates in sets.
    // (ie: shared vs's)
}
