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

var HEARTBEAT_INTERVAL = 1000/30;

var fro = {

    version : '0.1.0',
    plugins : {},

    initialise : function(options) {
    
        this.options = options;

        this.log.initialise(options);
        this.timers.initialise();
        this.resources.initialise();
        this.audio.initialise(options);
        
        // If the renderer submodule is included, 
        // initialise it and related submodules
        if ('renderer' in this) {
            this.renderer.initialise(options);

            this.input.initialise(options);
            this.camera.initialise();
            
            this.camera.setCenter(0, 0);
            
            // Set up properties to record framerates
            this.framerates = [];
            this.numFramerates = 10;
            this.renderTime = -1;
            
            //this.background = new RenderableImage(400, 300);
            //this.background.setTexture(this.resources.getDefaultTexture(), false);
        }
    },
    
    run : function() {
    
        //this.heartbeat();
        
        this.startTime = Date.now();
        
        // We won't use fro.timers here because it doesn't matter if rendering 
        // skips a few beats or doesn't process with perfect timing. 
        //this.interval = window.setInterval(fro.heartbeat, HEARTBEAT_INTERVAL);
        this.timers.addInterval(fro, fro.heartbeat, HEARTBEAT_INTERVAL);
        // But we WILL use fro.timers here for stress testing purposes
        // (maybe can later add a variable like "should this timer be allowed to play catchup")
    },

    heartbeat : function() {
        
        // hook this function to be called next redraw 
        //requestAnimFrame(fro.heartbeat); 
        
        // stuff that should go into steady timers...
        
        // @todo either rename to non-heartbeat and specify that timers are dealt elsewhere,
        // or include timer logic within this interval (depends on how timers are actually 
        // dealt with on a browser-by-browser basis, in terms of threading/polling/etc)
        
        fro.render();
        fro.snapshot();
    },

    render : function() {
        
        this.camera.setupViewport();
        
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
            
        if (this.world) {
            this.world.render();
        }
    },
    
    snapshot : function() {
    
        if (this.renderTime < 0) {
            this.renderTime = new Date().getTime();
        } else {
            var newTime = new Date().getTime();
            var t = newTime - this.renderTime;
            if (t == 0)
                return;
            var framerate = 1000/t;
            this.framerates.push(framerate);
            while (this.framerates.length > this.numFramerates)
                this.framerates.shift();
            this.renderTime = newTime;
        }
    },
    
    getFramerate : function() {
         var tot = 0;
        for (var i = 0; i < this.framerates.length; ++i)
            tot += this.framerates[i];

        var framerate = tot / this.framerates.length;
        framerate = Math.round(framerate);
        
        return framerate;
    }
};


