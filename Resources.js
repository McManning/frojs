
/*

Requesting textures
	A module sends in a request for a texture based off a specific image url.
	ResourceManager determines if that texture exists, and if so, returns the pre-created texture.
	If the texture does not exist, ResourceManager checks to see if the image has been precached. 
	If the image has been precached, ResourceManager will convert that image to a texture, and return.
	If not, ResourceManager will attempt to precache that image and notify the caller with the new
		texture when complete
	
	Rather than returning, it should always send in the texture via the callback. So that method is
		reliable, but the timing isn't to be relied on.
		
	What if the same image was asked to load twice, at the same time?
	This situation isn't handled anywhere. There'd have to be a more robust method
	to attach multiple callbacks to the same image load. But, that's a bit complicated, and 
	probably isn't necessary for our particular usage case. 
*/

"use strict";

fro.resources = {
	
	initialize : function() {
		this.loadedImages = new Array();
		this.loadedTextures = new Array();
		this.defaultTexture = null;
		this.bubbleImage = null;
		
		this.loadedEntityJSON = new Array();
		
		this.fontRendererCanvas = document.createElement('canvas');
	},
	
	getEntityJSON : function(uid, caller, onload, onerror) {

		var json = this.loadedEntityJSON[uid];

		// If the json is already loaded, call the onload immediately
		if (json) {
		
			fro.log.debug('Referencing JSON for ' + uid);
			onload.apply(caller, [uid, json]);

		} else {
			// No image, no texture, queue image to load and late-call onload/onerror
			
			fro.log.debug('Late loading JSON for ' + uid);
			
			$.ajax({
				url: this.entityJSONServer,
				data: { uid: uid },
				success: function(data) {
					
					fro.log.debug('Retrieved JSON for ' + uid);
					
					var json;
					try {
						json = JSON.parse(data);
					} catch (e) {
						fro.log.debug('Could not parse json for entity ' + uid);
						if (onerror)
							onerror.apply(caller, [uid]);
						
						return;
					}
					
					fro.resources.loadedEntityJSON[uid] = json;
					
					if (onload)
						onload.apply(caller, [uid, data]);
				},
				error: function(request, status, error) {
					
					// @todo notification
					fro.log.warning('Failed to get JSON for ' + uid);
					
					if (onerror)
						onerror.apply(caller, [uid]);
				}
			});
			
		}
	},

	/**
	 * Generates a texture from an image already preloaded in our document,
	 * and returns that new texture
	 *
	 * @param ele An image element preloaded into the dom
	 *
	 * @return GL texture | null
	 */
	getTextureFromElement : function(ele) {
		
		if (!ele || !ele.src) {
			fro.log.error('Invalid element [' + ele + ']');
			return null;
		}
		
		var url = ele.src;
		
		// If it's already been loaded once, don't load again
		if (this.loadedTextures[url]) {
			fro.log.debug('Texture already loaded ' + url);
			return this.loadedTextures[url];
		}
		
		// If we're not managing yet, add it to the list
		if (!this.loadedImages[url]) {
			this.loadedImages[url] = ele;
		}

		// Generate texture from the image
		var texture = gl.createTexture();
		texture.image = ele;
	
		this.configureImageTexture(texture);
		this.loadedTextures[url] = texture;
		
		fro.log.debug('Texture from Element: ' + url);
		
		return texture;
	},

	/**
	 * If the texture has already been loaded, will return the GL texture. Otherwise,
	 * will return null and attempt to late-load the texture and call either 
	 * onload or onerror when completed.
	 *
	 * @return GL Texture | null
	 */
	getTexture : function(url, caller, onload, onerror) {
		
		var img = this.loadedImages[url];
		var texture = this.loadedTextures[url];

		// If the texture is already loaded, call the onload immediately
		if (texture) {
		
			fro.log.debug('Texture already loaded ' + url);
			
			if (onload)
				onload.apply(caller, [texture]);
			
			return texture;
		
		} else if (img && img.complete) {
			// No texture, but the image is loaded, convert and trigger
			
			fro.log.debug('Image, !texture ' + url);
			
			texture = gl.createTexture();
			texture.image = img;
			
			this.configureImageTexture(texture);
			this.loadedTextures[url] = texture;
			
			if (onload)
				onload.apply(caller, [texture]);
			
			return texture;
		
		} else {
			// No image, no texture, queue image to load and late-call onload/onerror
			
			fro.log.debug('Late loading ' + url);
			
			img = new Image();
			img.src = url;
			
			// Hook a late load event
			img.onload = function() {
				
				fro.log.debug('img.onload ' + url);
				
				texture = gl.createTexture();
				texture.image = this;
				
				fro.resources.configureImageTexture(texture);
				
				// Cache resources
				fro.resources.loadedImages[url] = this;
				fro.resources.loadedTextures[url] = texture;
				
				if (onload)
					onload.apply(caller, [texture]);
			}
			
			// hook an error handler
			img.onerror = function() {
			
				fro.log.warning('img.onerror ' + url);
				
				if (onerror)
					onerror.apply(caller, [url]);
			}
		}
		
		return null;
	},
	
	/** 
	 * Generates a GL texture based off the input font and parameters. Does this by 
	 * rendering the string to a hidden canvas element on the page.
	 *
	 * The following options are available:
	 * 		height: Text height in pixels
	 *		family: Font family used to draw the text
	 *		maxWidth: Maximum width of the text in pixels.
	 *			If set, the text will wrap to fit within that maximum
	 *		color: Font color, as hex
	 *
	 * @param string text Text to render onto a texture
	 * @param array options A mapping of necessary options to render the text
	 * @return GL texture object or null
	 */
	getFontTexture : function(text, options) {
		
		if (!this.fontRendererCanvas) {
			fro.log.error('No fontRendererCanvas defined');
			return null;
		}
		
		var canvas = this.fontRendererCanvas;
		var ctx = canvas.getContext('2d');
		
		// Set some defaults, if not defined in the options
		if (!options.height)
			options.height = 12;
			
		if (!options.family)
			options.family = '"Helvetica Neue", Helvetica, Arial, sans-serif';
			
		//	options.family = 'monospace';

		if (!options.color)
			options.color = '#000000';
			
		ctx.font = options.height + 'px ' + options.family;

		var w, h, textX, textY;
		var textLines = [];
		
		// If we're wider than max width, calculate a wrap
		if (options.maxWidth && ctx.measureText(text).width > options.maxWidth) {
			w = createMultilineText(ctx, text, options.maxWidth, textLines);
			
			if (w > options.maxWidth)
				w = options.maxWidth;
		} else {
			
			textLines.push(text);
			w = ctx.measureText(text).width;
		}

		h = options.height * (textLines.length + 1);

		canvas.width = w;
		canvas.height = h;

		// Clear canvas
		ctx.clearRect(0, 0, canvas.width, canvas.height);

		// Render text
		textX = w / 2;
		textY = 0; //h / 2;

		ctx.fillStyle = options.color;
		ctx.textAlign = 'center';
		
		ctx.textBaseline = 'top'; // top/middle/bottom
		ctx.font = options.height + 'px ' + options.family;
		
		// draw lines
		for (var i = 0; i < textLines.length; i++) {

			textY = i * options.height;
			ctx.fillText(textLines[i], textX, textY);
		}
				
		// Convert canvas context to a texture
		var texture = gl.createTexture();
		texture.image = canvas; // Use the canvas itself as a texture source
		
		this.configureImageTexture(texture);
		
		return texture;
	},

	/**
	 * Generates a texture of a message wrapped in a chat bubble
	 * The following options are available:
	 * 		height: Text height in pixels
	 *		family: Font family used to draw the text
	 *		maxWidth: Maximum width of the bubble in pixels (before padding).
	 *			If set, the text will wrap to fit within that maximum
	 *		padding: Padding around the message in pixels
	 *		color: Font color, as hex
	 *		bgColor1: Starting color of the background gradient, as hex (top)
	 *		bgColor2: Ending color of the background gradient, as hex (bottom)
	 *
	 * @param string text The string to render into the bubble
	 * @param array options A mapping of necessary options to render the bubble
	 * @return GL Texture object or null
	 */
	getBubbleTexture : function(text, options) {

		if (!this.fontRendererCanvas) {
			fro.log.error('No fontRendererCanvas defined');
			return null;
		}

		// Pull the secondary canvas used for font rendering
		var canvas = this.fontRendererCanvas;
		var ctx = canvas.getContext("2d");

		ctx.font = options.height + 'px ' + options.family;

		// Canvas dimensions
		var w;
		var h;
		
		var textX, textY, offset;
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

		h = options.height * (textLines.length);

		// Add in padding for the bubble
		if (options.padding) {
			h += options.padding * 2;
			w += options.padding * 2;
		}
		
		var arrowHeight = options.height / 2;
		
		h += arrowHeight;
		
		canvas.width = w;
		canvas.height = h;

		//Padding for stroke dimensions
		w -= options.st_width * 2;
		h -= options.st_width * 2 + arrowHeight;
		
		var x = options.st_width;
		var y = x;
		var r = x + w;
		var b = y + h;
		var m = x + w / 2;
		
		var radius = 8;
		
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
		var texture = gl.createTexture();
		texture.image = canvas; // Use the canvas itself as a texture source
		
		this.configureImageTexture(texture);
		
		return texture;
	},

	configureImageTexture : function(texture) {

		gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, true);
		gl.bindTexture(gl.TEXTURE_2D, texture);
		gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, texture.image);
		//gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
		//gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);

		gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
		//gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR_MIPMAP_NEAREST);  

		// Supporting non power of two textures
		// See: http://www.khronos.org/webgl/wiki/WebGL_and_OpenGL_Differences#Non-Power_of_Two_Texture_Support
		gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
		gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
		gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);

		// Can't mipmap if want non-power-of-two via wrapping
		//gl.generateMipmap(gl.TEXTURE_2D); 

		gl.bindTexture(gl.TEXTURE_2D, null);
	},
	
	printStats : function() {
		
		console.log('-- Images --');
		for (var url in this.loadedImages) {
			console.log('[' + url + '] Complete: ' + this.loadedImages[url].complete);
		}
		
		console.log('-- Textures --');
		for (var url in this.loadedTextures) {
			console.log('[' + url + ']');
		}
	}

};

