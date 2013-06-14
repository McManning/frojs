
"use strict";

var HEARTBEAT_INTERVAL = 1000/30;

var fro = {

	version : '0.1.0',

	initialise : function(canvas) {
	
		this.shaderProgram = null;
	
		this.log.initialise();
		this.timers.initialise();
		this.resources.initialise();

		// If the renderer submodule is included, 
		// initialise it and related submodules
		if ('renderer' in this) {
			this.renderer.initialise(canvas);

			this.input.initialise(canvas);
			this.camera.initialise();
			
			this.camera.setCenter(0, 0);
			
			// @todo to renderer or third party
			this.framerate = new Framerate('framerate');
			
			this.background = new RenderableImage(400, 300);
			this.background.setTexture(this.resources.getDefaultTexture(), false);
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
		fro.framerate.snapshot();
	},

	render : function() {
		
		this.camera.setupViewport();
		
		// Set some GL globals	@todo alternate method for shader animations
		var time = Date.now();

		gl.uniform1f(fro.shaderProgram.timeUniform, (time - this.startTime) / 1000.0);

		gl.uniform3f(fro.shaderProgram.cameraPositionUniform, 
					this.camera._translation[0], 
					this.camera._translation[1], 
					this.camera._translation[2]);
		
		if (this.background)
			this.background.render(0, 0);
			
		if (this.world) {
			this.world.render();
		}
	},
};


