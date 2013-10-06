
;(function(fro, undefined) {
	
	"use strict";
	
	var BUBBLE_ZORDER = 999; // @todo global UI_ZORDER
	
	//var BUBBLE_UPDATE_INTERVAL = 100; // for tracking a followed entity
	var CHAT_BUBBLE_MIN_TTL = 3000;
	
	fro.plugins.chatBubbles = {
		
		initialise : function(options) {
			
			this.options = $.extend({
				family: '\'Droid Sans\', sans-serif',
				color: '#000',
				height: 14,
				max_width: 256,
				min_width: 25,
				padding: 7,
				radius: 8,
				bg_color1: '#BBB',
				bg_color2: '#FFF',
				st_width: 1.5,
				st_color1: '#000',
				st_color2: '#000',
				
			}, options);
		
			fro.world.bind('add.entity', function(entity) {
				
				// Spawn and attach a bubble entity for each actor spawned
				if (entity instanceof Map_Actor) {
					var properties = {};
					properties.entity = entity;

					var bubble = new Map_ChatBubble();
					bubble.initialise(entity.eid + '_bubble', properties);
					fro.world.add(bubble);
				}
			});
			
		}
	}
	
	// Define our custom resource type for generating bubble textures
	function BubbleResource() {}
	BubbleResource.prototype = new ImageResource();

	BubbleResource.prototype.load = function(json) {
		ImageResource.prototype.load.call(this, json);
		
		this.fitToTexture = false; 
		this.text = json.text;
		this.options = json;
		
		this.generateTexture(json);
		
		this.buildVertexBuffer();
		this.buildTextureBuffer();
	}

	BubbleResource.prototype.generateTexture = function(options) {

		if (!fro.resources.scratchCanvas) {
			throw new Error('No fro.resources.scratchCanvas defined');
			return null;
		}

		var canvas = fro.resources.scratchCanvas;
		var ctx = canvas.getContext('2d');
		var text = this.text;
		
		if (!text || text.length < 1) {
			throw new Error('No text');
		}
		
		// Set up size before ctx.measureText() 
		ctx.font = options.height + 'px ' + options.family;
	
		var w, h, textX, textY, offset;
		var textLines = [];

		// If we're wider than max width, calculate a wrap
		if (options.max_width && ctx.measureText(text).width > options.max_width) {
			w = createMultilineText(ctx, text, options.max_width, textLines);
			
			if (w > options.max_width)
				w = options.max_width;
		} else {
			textLines.push(text);
			w = ctx.measureText(text).width;
			if (w < options.min_width)
				w = options.min_width;
		}

		h = options.height * textLines.length;

		// Add in padding for the bubble
		if (options.padding) {
			h += options.padding * 2;
			w += options.padding * 2;
		}
		
		var arrowHeight = options.height / 2;
		
		h += arrowHeight;
		
		canvas.width = w;
		canvas.height = h;

		// Clear canvas
		ctx.clearRect(0, 0, canvas.width, canvas.height);

		//Padding for stroke dimensions
		w -= options.st_width * 2;
		h -= options.st_width * 2 + arrowHeight;

		var x = options.st_width;
		var y = x;
		var r = x + w;
		var b = y + h;
		var m = x + w / 2;
		
		var radius = options.radius;
		
		// If we haven't specified a gradient, use a solid stroke color
		if (options.st_color1 == options.st_color2) {
		
			ctx.strokeStyle = options.st_color1;
			
		} else { // Render a linear gradient for the stroke
			
			// Set stroke style to a gradient
			var stGrd = ctx.createLinearGradient(0, 0, 0, h);
			stGrd.addColorStop(0,options.st_color1);
			stGrd.addColorStop(1,options.st_color2);
			
			ctx.strokeStyle = stGrd;
		}

		// Render a polygon via paths
		ctx.beginPath();

		ctx.lineWidth = options.st_width;
		
		ctx.moveTo(x+radius, y); // top left top curve
		
		ctx.lineTo(r-radius, y); // top right top curve
		ctx.quadraticCurveTo(r, y, r, y+radius); // top right bottom curve
		ctx.lineTo(r, y+h-radius); // bottom right top curve
		ctx.quadraticCurveTo(r, b, r-radius, b); // bottom right bottom curve
		
		// Bottom arrow point
		ctx.lineTo(m - 4, b); // start point 
		ctx.lineTo(m - 4, b + arrowHeight); // part that sticks out
		ctx.lineTo(Math.max(x+radius, m - 20), b); // reconnecting point to the bubble bottom
		
		ctx.lineTo(x+radius, b); // bottom left bottom curve
		ctx.quadraticCurveTo(x, b, x, b-radius); // bottom left top curve
		ctx.lineTo(x, y+radius); // top left bottom curve
		ctx.quadraticCurveTo(x, y, x+radius, y); // top left top curve
		
		// If we haven't specified a gradient, use a solid background color
		if (options.bg_color1 == options.bg_color2) {
		
			ctx.fillStyle = options.bg_color1;
			
		} else { // Render a linear gradient for the background
			
			var bgGrd = ctx.createLinearGradient(0, 0, 0, h);
			bgGrd.addColorStop(0,options.bg_color1);
			bgGrd.addColorStop(1,options.bg_color2);
			
			ctx.fillStyle = bgGrd;
		}
		
		ctx.fill();
		ctx.stroke(); // draw

		// Render text
		ctx.fillStyle = options.color;
		ctx.textAlign = 'center';
		
		ctx.textBaseline = 'middle'; // top/middle/bottom
		ctx.font = options.height + 'px ' + options.family;
		
		var textTopPadding = options.padding + options.height / 2;
		
		// draw lines
		for (var i = 0; i < textLines.length; i++) {
		
			textY = i * options.height + textTopPadding;
			ctx.fillText(textLines[i], m, textY);
		}

		// Convert canvas context to a texture
		this.texture = fro.renderer.createTexture(canvas);
		this.width = canvas.width;
		this.height = canvas.height;
	}

	BubbleResource.prototype.getTextureWidth = function() {
		return this.width;
	}

	BubbleResource.prototype.getTextureHeight = function() {
		return this.height;
	}

	
	// Define our custom entity within the plugin closure
	function Map_ChatBubble() {}
	Map_ChatBubble.prototype = new Map_RenderableEntity();

	Map_ChatBubble.prototype.initialise = function(eid, properties) {
		Map_RenderableEntity.prototype.initialise.call(this, eid, properties);

		var pos = this.getPosition();
		
		pos[2] = BUBBLE_ZORDER;
		
		this.trackedEntity = properties.entity;

		// bind events to our tracked entity (talking, moving, deleting)
		this.trackedEntity.bind('say.bubble', this, function(message) {

			this.display(message);
		
		}).bind('move.bubble, avatar.bubble', this, function() {
			
			this._updatePosition();
			
		}).bind('destroy.bubble', this, function() {
			
			this.destroy();
		});
		
		// Initially hide this bubble and only display when the entity speaks
		this.visible = false;
	}

	Map_ChatBubble.prototype.display = function(text) {
	
		// Generate bubble texture
		
		if (!this.renderable) {
			this.renderable = new BubbleResource();
		}
		
		this.renderable.load(
			$.extend({
				text: text,
				shader: 'default_shader',
			}, fro.plugins.chatBubbles.options)
		);
		
		this.width = this.renderable.getTextureWidth();
		this.height = this.renderable.getTextureHeight();
		
		this.visible = true;
		
		this._updatePosition();
	
		
		// Determine TTL
		var ttl = CHAT_BUBBLE_MIN_TTL * Math.ceil(text.length / 50);
		
		// If we already are visible, just increase display time
		if (this.visible)
			fro.timers.removeTimeout(this.timeout);
		
		this.timeout = fro.timers.addTimeout(this, this.hide, ttl);
	}

	Map_ChatBubble.prototype.hide = function() {
		this.visible = false;
	}

	Map_ChatBubble.prototype._updatePosition = function() {

		var pos = this.getPosition();		
		var epos = this.trackedEntity.getPosition();
		
		// If the tracked entity has a nickname being rendered, reposition self accordingly
		if (this.trackedEntity.nicknameAttachment) {
			
			var nick = this.trackedEntity.nicknameAttachment;
			var npos = nick.getPosition();
			
			//pos[0] = epos[0] - nick.width * 0.5;
			//pos[1] = npos[1] + this.height * 0.5;
			
			pos[0] = epos[0];
			pos[1] = npos[1] + this.height * 0.5;
			
		} else { // just overhead
		
			var r = rect.create();
			this.trackedEntity.getBoundingBox(r);
			
			pos[0] = epos[0];
			pos[1] = epos[1] + r[3] + this.height * 0.5 + 5; // Above the tracked entity's head

		}
		
		// Factor in Z translation to match our tracked entity
		this._translation[0] = pos[0];
		this._translation[1] = pos[1] + epos[2];
	}

	Map_ChatBubble.prototype.render = function() {
		
		this.renderable.render(this._translation, 0);
	}

	/**
	 * @param rect r
	 */
	Map_ChatBubble.prototype.getBoundingBox = function(r) {

		// @todo factor in rotations and scaling
		// and utilize this.renderable.getTopLeft(), getBottomRight(), etc
		
		// @todo this is incorrect. We center the (x, y)
		r[0] = this.position[0];
		r[1] = this.position[1];
		r[2] = this.width;
		r[3] = this.height;
	}

})(fro);
