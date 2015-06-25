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
     * Built-in shader resource type.
     */
    function Shader(context, properties) {
        Util.extend(this, EventHooks);

        /*
            Expected JSON parameters:
            id - unique ID for referencing shaders in the renderer
            vertex - vertex shader source url
            fragment - fragment shader source url
            uniforms = [
                uniform names
            ],
            attributes = [
                attribute names
            ]
        */
        
        this.id = properties.id;
        this.type = properties.type;
        this.context = context;
        this.program = null;
        
        // Add some values expected of all shaders
        //this.attributes['aVertexPosition'] = false;
        //this.attribute['aTextureCoord'] = false;
        this.uniforms = [];
        this.uniforms.uPMatrix = false;
        this.uniforms.uMVMatrix = false;
        
        for (var u = 0; u < properties.uniforms.length; u++) {
            this.uniforms[properties.uniforms[u]] = false;
        }

        this.attributes = [];
        for (var a = 0; a < properties.attributes.length; a++) {
            this.attributes[properties.attributes[a]] = false;
        }

        // TODO: Eventually support url loading. For now, assume
        // the shaders are completely in memory
        this.fragmentShaderSource = properties.fragment;
        this.vertexShaderSource = properties.vertex;
        
        this.compileProgram();
        
        // TODO: move this?
        this.context.renderer.attachShader(this);
    }

    /**
     * Loads uniforms and attribute locations from the shader program
     */
    Shader.prototype.bindParameters = function() {
        var gl = this.context.renderer.getGLContext();

        // TODO: error testing for non-existing uniforms/attributes?
        
        for (var u in this.uniforms) {
            if (this.uniforms.hasOwnProperty(u)) {
                this.uniforms[u] = gl.getUniformLocation(this.program, u);
            }
        }
        
        for (var a in this.attributes) {
            if (this.attributes.hasOwnProperty(a)) {
                this.attributes[a] = gl.getAttribLocation(this.program, a);
                gl.enableVertexAttribArray(this.attributes[a]);
            }
        }
    };

    Shader.prototype.compileProgram = function() {
        var gl = this.context.renderer.getGLContext();

        if (!this.vertexShaderSource || !this.fragmentShaderSource) {
            throw new Error('Program [' + this.id + '] missing shader sources');
        }
        
        if (this.program) {
            gl.deleteProgram(this.program);
        }
        
        this.program = gl.createProgram();
        
        // Compile Vertex Shader
        var vs = gl.createShader(gl.VERTEX_SHADER);
        gl.shaderSource(vs, this.vertexShaderSource);
        gl.compileShader(vs);
        
        if (!gl.getShaderParameter(vs, gl.COMPILE_STATUS)) {
            throw new Error('Program ' + this.id + ' Vertex Shader Error: ' + 
                            gl.getShaderInfoLog(vs) + '\n' + 
                            Util.getBrowserReport(true, gl)
            );
        } else {
            gl.attachShader(this.program, vs);
        }
        
        // Compile Fragment Shader
        var fs = gl.createShader(gl.FRAGMENT_SHADER);
        gl.shaderSource(fs, this.fragmentShaderSource);
        gl.compileShader(fs);
        
        if (!gl.getShaderParameter(fs, gl.COMPILE_STATUS)) {
            throw new Error('Program ' + this.id + ' Fragment Shader Error: ' + 
                            gl.getShaderInfoLog(fs) + '\n' + 
                            Util.getBrowserReport(true, gl)
            );
        } else {
            gl.attachShader(this.program, fs);
        }
        
        // Link and use
        gl.linkProgram(this.program);

        if (!gl.getProgramParameter(this.program, gl.LINK_STATUS)) {
            throw new Error('Could not initialize shaders: ' + 
                            gl.getProgramInfoLog(this.program) + '\n' + 
                            Util.getBrowserReport(true, gl)
            );
        }
        
        this.bindParameters();
    };

    Shader.prototype.isLoaded = function() {
        return true;
    };

    Shader.prototype.getAttrib = function(name) {
        if (!(name in this.attributes)) {
            throw new Error('Attribute ' + name + ' does not exist in program [' + this.id + ']');
        }
        
        return this.attributes[name];
    };

    Shader.prototype.getUniform = function(name) {
        if (!(name in this.uniforms)) {
            throw new Error('Uniform ' + name + ' does not exist in program [' + this.id + ']');
        }
        
        return this.uniforms[name];
    };

    Shader.prototype.getProgram = function() {
        return this.program;
    };

    Shader.prototype.bindTexture = function(uniform, texture) {
        var gl = this.context.renderer.getGLContext();

        // @todo the ability to bind multiple textures at once, and assign each
        // to a different texture index based on the uniform selected
        
        gl.activeTexture(gl.TEXTURE0);
        gl.bindTexture(gl.TEXTURE_2D, texture);
        gl.uniform1i(this.getUniform(uniform), 0);
    };

    // Resource can be cached and reused
    Shader.shareable = true;

    return Shader;
});
