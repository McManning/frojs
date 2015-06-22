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
    function Shader(context) {
        Util.extend(this, EventHooks);

        var id,
            uniforms = [],
            attributes = [],
            fragmentShaderSource,
            vertexShaderSource,
            program,
            gl = context.renderer.getGLContext();

        this.load = function(properties) {
            /*
                Expected JSON parameters:
                vertex - vertex shader source url
                fragment - fragment shader source url
                uniforms = [
                    uniform names
                ],
                attributes = [
                    attribute names
                ]
            */
            
            id = properties.id;
            
            // Add some values expected of all shaders
            //this.attributes['aVertexPosition'] = false;
            //this.attribute['aTextureCoord'] = false;
            uniforms.uPMatrix = false;
            uniforms.uMVMatrix = false;
            
            for (var u = 0; u < properties.uniforms.length; u++) {
                uniforms[properties.uniforms[u]] = false;
            }
            
            for (var a = 0; a < properties.attributes.length; a++) {
                attributes[properties.attributes[a]] = false;
            }

            // TODO: Eventually support url loading. For now, assume
            // the shaders are completely in memory
            fragmentShaderSource = properties.fragment;
            vertexShaderSource = properties.vertex;
            
            this.compileProgram();
            
            // TODO: move this?
            context.renderer.attachShader(this);
        };

        this.getId = function() {
            return id;
        };

        /**
         * Loads uniforms and attribute locations from the shader program
         */
        this.bindParameters = function() {

            // TODO: error testing for non-existing uniforms/attributes?
            
            for (var u in uniforms) {
                if (uniforms.hasOwnProperty(u)) {
                    uniforms[u] = gl.getUniformLocation(program, u);
                }
            }
            
            for (var a in attributes) {
                if (attributes.hasOwnProperty(a)) {
                    attributes[a] = gl.getAttribLocation(program, a);
                    gl.enableVertexAttribArray(attributes[a]);
                }
            }
        };

        this.compileProgram = function() {
            
            if (!vertexShaderSource || !fragmentShaderSource) {
                throw new Error('Program [' + id + '] missing shader sources');
            }
            
            if (program) {
                gl.deleteProgram(program);
            }
            
            program = gl.createProgram();
            
            // Compile Vertex Shader
            var vs = gl.createShader(gl.VERTEX_SHADER);
            gl.shaderSource(vs, vertexShaderSource);
            gl.compileShader(vs);
            
            if (!gl.getShaderParameter(vs, gl.COMPILE_STATUS)) {
                throw new Error('Program ' + id + ' Vertex Shader Error: ' + 
                                gl.getShaderInfoLog(vs) + '\n' + 
                                Util.getBrowserReport(true, gl)
                );
            } else {
                gl.attachShader(program, vs);
            }
            
            // Compile Fragment Shader
            var fs = gl.createShader(gl.FRAGMENT_SHADER);
            gl.shaderSource(fs, fragmentShaderSource);
            gl.compileShader(fs);
            
            if (!gl.getShaderParameter(fs, gl.COMPILE_STATUS)) {
                throw new Error('Program ' + id + ' Fragment Shader Error: ' + 
                                gl.getShaderInfoLog(fs) + '\n' + 
                                Util.getBrowserReport(true, gl)
                );
            } else {
                gl.attachShader(program, fs);
            }
            
            // Link and use
            gl.linkProgram(program);

            if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
                throw new Error('Could not initialize shaders: ' + 
                                gl.getProgramInfoLog(program) + '\n' + 
                                Util.getBrowserReport(true, gl)
                );
            }
            
            this.bindParameters();
        };

        this.isLoaded = function() {
            return true;
        };

        this.getAttrib = function(name) {
            if (!(name in attributes)) {
                throw new Error('Attribute ' + name + ' does not exist in program [' + id + ']');
            }
            
            return attributes[name];
        };

        this.getUniform = function(name) {
            if (!(name in uniforms)) {
                throw new Error('Uniform ' + name + ' does not exist in program [' + id + ']');
            }
            
            return uniforms[name];
        };

        this.getProgram = function() {
            return program;
        };

        this.bindTexture = function(uniform, texture) {
            
            // @todo the ability to bind multiple textures at once, and assign each
            // to a different texture index based on the uniform selected
            
            gl.activeTexture(gl.TEXTURE0);
            gl.bindTexture(gl.TEXTURE_2D, texture);
            gl.uniform1i(this.getUniform(uniform), 0);
        };
    }

    return Shader;
});
