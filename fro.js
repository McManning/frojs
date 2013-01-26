
"use strict";

var HEARTBEAT_INTERVAL = 1000/30;

var fro = {

	initialize : function(params) {
	
		this.params = params;
		this.shaderProgram = null;
		
		if ('log' in params) {
			this.log.initialize(params.log);
		} else {
			this.log.initialize();
		}
		
		this.timers.initialize();
		
		if (params != null && 'canvas' in params) {
		
			this.initializeWebGL(params.canvas);
			
			this.input.initialize(gl.canvas);
			this.camera.initialize();
			this.resources.initialize();
			
			this.framerate = new Framerate('framerate');
			
			//	this.backgroundRect = new RenderableRect(640, 480, [1.0, 1.0, 0.0]);
			this.background = new RenderableImage(640, 480);
			this.background.loadTexture('img/background.png');
			this.background.position[0] = 0;
			this.background.position[1] = 0;
			
			//this.camera.setCenter(0, 0);
			
			// @todo differentiate b/w editor mode and game mode
			this.world = new World();
			this.player = new Map_Player();
			this.world.addRenderableEntity(this.player);
			this.camera.followEntity(this.player);
			
		}

		this.network.initialize();
		this.setupNetworkBinds();

	},
	
	setupNetworkBinds : function() {
		
		// Set up network binds for remote entity events
		// @todo this code feels really out of place, possibly refactor
		
		this.network.bind('auth', function(evt) { // Sent to our client when a player joins after us 
			
			fro.player.eid = evt.eid;
		
		}).bind('join', function(evt) { // Sent to our client when a player joins after us 
			
			var actor = new Map_RemotePlayer(evt.eid, evt);
			fro.world.addRenderableEntity(actor);
		
		}).bind('identity', function(evt) { // Sent to our client when we join a world, and players already exist
			
			var actor = new Map_RemotePlayer(evt.eid, evt);
			fro.world.addRenderableEntity(actor);
		
		}).bind('say', function(evt) { // Chat message { msg: 'message' }
			
			var ent = fro.world.getEntity(evt.eid);
			ent.say(evt.msg);
			
		}).bind('nick', function(evt) { // Update nickname { nick: 'John Doe' }
			
			var ent = fro.world.getEntity(evt.eid);
			ent.setNick(evt.nick);
			
		}).bind('avatar', function(evt) { // Change avatar { url: 'http', w: 0, h: 0, delay: 0 }
			
			var ent = fro.world.getEntity(evt.eid);
			ent.setAvatar(evt);
			
		}).bind('move', function(evt) { // Update action buffer { buffer: 'buffercontents' }
			
			var ent = fro.world.getEntity(evt.eid);
			
			// @todo something generic, that can change based on controller type
			ent.actionController.write(evt.buffer);
		
		}).bind('leave', function(evt) { // Leave world { reason: 'Why I left' }
		
			var ent = fro.world.getEntity(evt.eid);
			
			// @todo rewrite
			fro.timers.removeInterval(ent.thinkInterval);
			fro.world.removeEntity(ent);
		});
	},
	
	initializeWebGL : function(canvas) {
		
		try {
		
			var ctx = canvas.getContext('experimental-webgl');
			gl = ctx; //WebGLDebugUtils.makeDebugContext(ctx, undefined, validateNoneOfTheArgsAreUndefined);
			
			gl.viewportWidth = canvas.width;
			gl.viewportHeight = canvas.height;
			
			fro.log.notice(gl.viewportWidth + ', ' + gl.viewportHeight);
			
			// Add some matrix manipulation helpers
			gl.mvMatrix = mat4.create();
			gl.pMatrix = mat4.create();
			
			gl.clearColor(0.56, 0.25, 0.98, 1.0);	

			gl.mvMatrixStack = new Array();
			
			gl.mvPopMatrix = function() {
				if (gl.mvMatrixStack.length == 0) {
					throw 'Invalid popMatrix!';
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
				gl.uniformMatrix4fv(fro.shaderProgram.pMatrixUniform, false, gl.pMatrix);
				gl.uniformMatrix4fv(fro.shaderProgram.mvMatrixUniform, false, gl.mvMatrix);
			}
			
		} catch (e) {
			fro.log.error(e.message);
		}
		
		if (!gl) {
			throw 'No WebGL Support. Sux2bu';
		}
	},

	/**
	 * Load an editor module to delegate events/rendering to
	 */
	editor : function(editor) {
		
		// @todo cannot disable an editor via this method
		if (editor != null) {
			this._editor = editor;
		}
		// @todo non underscore'd editor
		
		return editor;
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
		
		if (this.backgroundRect)
			this.backgroundRect.render();
		
		if (this.background)
			this.background.render();
			
		if (this.world) {
			this.world.render();
		} else if (this._editor) {
			this._editor.render();
		}
	},
};


