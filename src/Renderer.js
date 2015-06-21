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

define([], function() {
    function Renderer(context, options) {

        var canvas = options.canvas,
            usesWebGL = true,
            shaders = [],
            currentShader,
            clearStyle = 'rgb(0,0,0)',
            gl;

        try {
            
            var canvasContext = canvas.getContext('experimental-webgl');
            gl = canvasContext; //WebGLDebugUtils.makeDebugContext(canvasContext, undefined, validateNoneOfTheArgsAreUndefined);
        
            usesWebGL = true;
        } catch (e) {
            gl = undefined;
            usesWebGL = false;
        }
        
        // No WebGL support, they can't play! (at least until we get canvas fallbacks :P)
        if (!gl) {
            throw new Error('No WebGL support!');
        }

        // Configure WebGL to our canvas
        gl.viewportWidth = canvas.width;
        gl.viewportHeight = canvas.height;

        // Add some matrix manipulation helpers
        gl.mvMatrix = mat4.create();
        gl.pMatrix = mat4.create();
        gl.mvMatrixStack = [];
        
        var renderer = this;

        gl.mvPopMatrix = function() {
            if (this.mvMatrixStack.length === 0) {
                throw new Error('Invalid popMatrix!');
            }
            this.mvMatrix = this.mvMatrixStack.pop();
        };
            
        gl.mvPushMatrix = function() {
            var copy = mat4.create();
            mat4.set(this.mvMatrix, copy);
            this.mvMatrixStack.push(copy);
        };
        
        // upload matrix changes to the graphics card, since GL doesn't track local changes
        gl.setMatrixUniforms = function() {
            
            var shader = renderer.getCurrentShader();
        
            this.uniformMatrix4fv(shader.getUniform('uPMatrix'), false, this.pMatrix);
            this.uniformMatrix4fv(shader.getUniform('uMVMatrix'), false, this.mvMatrix);
        };
        
        /*
            From http://en.wikipedia.org/wiki/Alpha_compositing#Alpha_blending
            outA = srcA + dstA(1 - srcA)
            outRGB = srcRGB(srcA) + dstRGB*dstA(1 - srcA)
            
            Orgb = srgb * Srgb + drgb * Drgb
            Oa = sa * Sa + da * Da
            glBlendFuncSeparate(srgb, drgb, sa, da)
            
            TODO: eventually phase this out, since blending will work differently within the shader.
        */
        gl.enable(gl.BLEND);
        gl.blendFuncSeparate(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA, gl.ONE, gl.ONE_MINUS_SRC_ALPHA);
        gl.clearColor(0.0, 0.0, 0.0, 1.0);

        this.isWebGL = function() {
            return usesWebGL === true;
        };

        /**
         * Expose our GL context to other modules.
         */
        this.getGLContext = function() {
            return gl;
        };

        this.clear = function() {
        
            if (this.isWebGL()) {
                gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
            } else {
                // TODO: Support!
                throw new Error('Not supported');
                //gl.fillStyle = clearStyle;
                //gl.fillRect(0, 0, gl.viewportWidth, gl.viewportHeight);
            }
        };
        
        this.createTexture = function(image) {
            
            var texture;
            if (this.isWebGL()) {
                texture = gl.createTexture();

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
                throw new Error('Not supported');
            }
            
            return texture;
        };
        
        this.setClearColor = function(r, g, b) {
            
            if (this.isWebGL()) {
                gl.clearColor(r/255.0, g/255.0, b/255.0, 1.0);
            } else {
                clearStyle = 'rgb(' + r + ',' + g + ',' + b + ')';
            }
        };
        
        /** 
         * Set the current shader used by the renderer. 
         * 
         * @param ShaderResource shader
         */
        this.useShader = function(shader) {

            currentShader = shader;
            gl.useProgram(shader.getProgram());
        };

        /**
         * Add a new shader to our list of available shaders
         * 
         * @param Shader shader The shader resource to add
         */
        this.attachShader = function(shader) {
            shaders[shader.getId()] = shader;
        };
        
        this.getCurrentShader = function() {
            return currentShader;
        };
        
        this.getShader = function(id) {
            
            if (!(id in shaders)) {
                throw new Error('Shader [' + id + '] is not loaded');
            }
            
            return shaders[id];
        };
        
        // @todo the functionality of changing active shaders.
        // Need to take in account that we probably need to link a vs/fs to 
        // the same program, causing duplicates if we have duplicates in sets.
        // (ie: shared vs's)
    }

    return Renderer;
});
