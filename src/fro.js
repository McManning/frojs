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
    'Timer',
    'Audio',
    'Resources',
    'Renderer',
    'Camera',
    'Input',
    'World',
    'Player',
    'text!shaders/main.vs', // TODO: Maybe not include these shaders in the main package... 
    'text!shaders/main.fs',
    'plugins/Nametag'
], function(Timer, Audio, Resources, Renderer, Camera, Input, 
            World, Player, vertexShaderSource, fragmentShaderSource,
            NametagPlugin) {

    var FRAMERATE = 1000/30;

    function Fro(options) {

        this.options = options;
        this.plugins = {};

        // Set up properties to record framerates
        this.framerates = [];
        this.numFramerates = 10;
        this.renderTime = -1;

        // Initialise submodules
        this.resources = new Resources(this);

        this.audio = new Audio(this, options.audio || {});
        this.renderer = new Renderer(this, options.renderer || {});
        this.camera = new Camera(this, options.camera || {});
        this.input = new Input(this, options.input || {});

        // Load our packaged default shader
        //var self = this;
        this.resources
            .load({
                id: 'shader:default',
                type: 'shader',
                vertex: vertexShaderSource,
                fragment: fragmentShaderSource,
                uniforms: [
                    'uTime',
                    'uCamera',
                    'uClip',
                    'uSampler',
                    'uMVMatrix',
                    'uPMatrix'
                ],
                attributes: [
                    'aVertexPosition',
                    'aTextureCoord'
                ]
            });

        // TODO: Shader resources are written a bit odd right now 
        // and don't have event callbacks after loading. Instead, they
        // just automatically attach themselves to the renderer.

        // If we specified a world at load time, create it as well.
        // Note this has to be done after shader loading because entities
        // loaded will need to know the default shader, if applicable.
        if (options.hasOwnProperty('world')) {
            this.world = new World(this, options.world);
        }

        this.player = new Player(this, options.player);

        this.heartbeat = this.heartbeat.bind(this);
        this.heartbeatTimer = new Timer(this.heartbeat, FRAMERATE);

        // Add nametag plugin here randomly because fuck it.
        // TODO: Figure out plugin loaders from the outside...
        this.plugins.nametag = new NametagPlugin(this, {});
    }

    Fro.prototype.run = function() {
    
        this.startTime = Date.now();

        this.heartbeatTimer.start();
    };

    Fro.prototype.heartbeat = function() {
        this.render();
        this.snapshot();
    };

    Fro.prototype.render = function() {
        this.camera.setupViewport();

        /*
        // Set some GL globals    @todo alternate method for shader animations
        var time = Date.now();

        // set default shader
        var shader = this.renderer.getShader('default_shader');
        this.renderer.useShader(shader);
        
        var shader = this.renderer.getCurrentShader();

        gl.uniform1f(shader.getUniform('uTime'), (time - this.startTime) / 1000.0);

        gl.uniform3f(shader.getUniform('uCamera'), 
                    this.camera._position[0], 
                    this.camera._position[1], 
                    this.camera._position[2]);
        
        //if (this.background)
        //    this.background.render(0, 0);
            
        */
        if (this.world) {
            this.world.render();
        }
    };
    
    Fro.prototype.snapshot = function() {
    
        if (this.renderTime < 0) {
            this.renderTime = new Date().getTime();
        } else {
            var newTime = new Date().getTime();
            var t = newTime - this.renderTime;
            
            if (t === 0) {
                return;
            }

            var framerate = 1000/t;
            this.framerates.push(framerate);
            while (this.framerates.length > this.numFramerates) {
                this.framerates.shift();
            }

            this.renderTime = newTime;
        }
    };
    
    Fro.prototype.getFramerate = function() {
        var tot = 0;
        for (var i = 0; i < this.framerates.length; ++i) {
            tot += this.framerates[i];
        }

        var framerate = tot / this.framerates.length;
        framerate = Math.round(framerate);
        
        return framerate;
    };

    return Fro;
});
