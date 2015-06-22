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

        this.canvas = options.canvas;
        this.usesWebGL = true; //options.useWebGL || true,
        this.shaders = [];
        this.currentShader = null;
        this.clearStyle = 'rgb(0,0,0)';
        this.gl = null;

        if (!this.canvas) {
            throw new Error('No canvas specified');
        }

        try {
            var ctx = this.canvas.getContext('webgl') || 
                      this.canvas.getContext('experimental-webgl');

            this.gl = ctx; //WebGLDebugUtils.makeDebugContext(canvasContext, undefined, validateNoneOfTheArgsAreUndefined);
            this.usesWebGL = true;
        } catch (e) {
            this.usesWebGL = false;
        }
        
        // No WebGL support, they can't play! (at least until we get canvas fallbacks :P)
        if (!this.gl) {
            throw new Error('No WebGL support');
        }

        // Configure WebGL to our canvas
        this.gl.viewportWidth = this.canvas.width;
        this.gl.viewportHeight = this.canvas.height;

        // Add some matrix manipulation helpers to our GL instance
        this.gl.mvMatrix = mat4.create();
        this.gl.pMatrix = mat4.create();
        this.gl.mvMatrixStack = [];
        
        this.gl.mvPopMatrix = function() {
            if (this.mvMatrixStack.length === 0) {
                throw new Error('Invalid popMatrix!');
            }
            this.mvMatrix = this.mvMatrixStack.pop();
        };
            
        this.gl.mvPushMatrix = function() {
            var copy = mat4.create();
            mat4.set(this.mvMatrix, copy);
            this.mvMatrixStack.push(copy);
        };
        
        // upload matrix changes to the graphics card, since GL doesn't track local changes
        var self = this;
        this.gl.setMatrixUniforms = function() {
            
            var shader = self.getCurrentShader();
        
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
        this.gl.enable(this.gl.BLEND);
        this.gl.blendFuncSeparate(
            this.gl.SRC_ALPHA, 
            this.gl.ONE_MINUS_SRC_ALPHA, 
            this.gl.ONE, 
            this.gl.ONE_MINUS_SRC_ALPHA
        );
        this.gl.clearColor(0.0, 0.0, 0.0, 1.0);

        if ('background' in options) {
            this.setClearColor(options.background);
        }
    }

    Renderer.prototype.isWebGL = function() {
        return this.usesWebGL === true;
    };

    /**
     * Expose our GL context to other modules.
     */
    Renderer.prototype.getGLContext = function() {
        return this.gl;
    };

    /**
     * Expose our active canvas
     */
    Renderer.prototype.getCanvas = function() {
        return this.canvas;
    };

    Renderer.prototype.clear = function() {
    
        if (this.isWebGL()) {
            this.gl.clear(this.gl.COLOR_BUFFER_BIT | this.gl.DEPTH_BUFFER_BIT);
        } else {
            // TODO: Support!
            throw new Error('Not supported');
            //gl.fillStyle = clearStyle;
            //gl.fillRect(0, 0, gl.viewportWidth, gl.viewportHeight);
        }
    };
    
    Renderer.prototype.createTexture = function(image) {
        
        var texture,
            gl = this.gl;

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
    
    /**
     * Set the clear color for the canvas. 
     *
     * @param vec3 color Color to use, RGB [0-255]
     */
    Renderer.prototype.setClearColor = function(color) {
        this.clearStyle = 'rgb(' + color[0] + ',' + color[1] + ',' + color[2] + ')';

        if (this.isWebGL()) {
            this.gl.clearColor(color[0]/255.0, color[1]/255.0, color[2]/255.0, 1.0);
        }
    };
    
    /** 
     * Set the current shader used by the renderer. 
     * 
     * @param ShaderResource shader
     */
    Renderer.prototype.useShader = function(shader) {

        this.currentShader = shader;
        this.gl.useProgram(shader.getProgram());
    };

    /**
     * Add a new shader to our list of available shaders
     * 
     * @param Shader shader The shader resource to add
     */
    Renderer.prototype.attachShader = function(shader) {
        this.shaders[shader.getId()] = shader;
    };
    
    Renderer.prototype.getCurrentShader = function() {
        return this.currentShader;
    };
    
    Renderer.prototype.getShader = function(id) {
        
        if (!(id in this.shaders)) {
            throw new Error('Shader [' + id + '] is not loaded');
        }
        
        return this.shaders[id];
    };
    
    // @todo the functionality of changing active shaders.
    // Need to take in account that we probably need to link a vs/fs to 
    // the same program, causing duplicates if we have duplicates in sets.
    // (ie: shared vs's)

    return Renderer;
});
