
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

fro.resources = $.extend({

	initialise : function() {
	
		this.resourceLoaders = {
			jpg : this._loadImage,
			jpeg : this._loadImage,
			png : this._loadImage,
			image: this._loadImage, // Psuedo type
			json : this._loadJSON,
			js : this._loadJS,
			vs : this._loadData,
			fs : this._loadData,
			data : this._loadData, // Psuedo type
			wav : this._loadSound,
			mp3 : this._loadSound,
			ogg : this._loadSound,
		}
		
		this.loadedResources = new Array();
		this.failedResources = new Array(); // Tracking of all resources failing download
		
		// Canvas used for generating temporary texture sources
		this.scratchCanvas = document.createElement('canvas');
	},
	
	preload : function(json) {

		this.totalPreload = 0;
		this.completedPreload = 0;
		
		for (var i in json.required) {
			this._preloadResource(json.required[i]);
		}
		// @todo optional preload logic?
		
		
		return this;
	},
	
	_preloadResource : function(url) {
		++this.totalPreload;
		
		this.load(url)
			.bind('onload', function() {
			
				++fro.resources.completedPreload;
				fro.resources.fire('preload.status', this);
				
				// If this was the last resource to download, fire a complete event
				if (fro.resources.completedPreload == fro.resources.totalPreload) {
					fro.resources.fire('preload.complete');
				}
			})
			.bind('onerror', function() {
				fro.resources.failedResources[i] = json[i];
				fro.resources.fire('preload.error', this);
			});
	},
	
	load : function(url, type) {
		
		// Expand relative URLs
		if (url.indexOf('http') != 0) {
			url = location.protocol + '//' + location.host + url;
		}
		
		if (url in this.loadedResources) {
			console.log('Loading from cache ' + url);
			return this.loadedResources[url];
		}
		
		console.log('Loading new resource ' + url);
		
		// Determine which loader to use based on the filetype, if we didn't specify one
		if (type == undefined) { // .load(id, url)
		
			var index = url.lastIndexOf('.');
			if (index < 0) {
				this.failedResources[url] = url;
				throw new Error('Cannot determine resource type for ' + url);
			}
			
			type = url.substr( url.lastIndexOf('.') + 1 );
		}

		if (!(type in this.resourceLoaders)) {
			this.failedResources[url] = url;
			throw new Error('Cannot load ' + url + '. No loader for type ' + type);
		}

		var resource = this.resourceLoaders[type]();
		this.loadedResources[url] = resource;
		
		resource.load(url, url);
		// @todo catch and log onerror/onsuccess

		return resource;
	},
	
	/**
	 * Loads an image into a new image element, referenced by resource.img
	 *
	 * @return new resource object
	 */
	_loadImage : function() {
		
		// @todo possibly new class initiating, rather than this?
		var resource = $.extend({
			
			load : function(id, url) {
				
				this.id = id;
				this.url = url;
				
				this.img = new Image(); 
				this.img.crossOrigin = ''; // Enable CORS support (Ticket #59)
				this.img.src = url;
				
				var res = this;
				this.img.onload = function() {
					
					/* @todo We assume all images loaded will be used as
						textures, so here we would perform the conversion
						and test for any errors that may occur
					*/
					
					res.fire('onload', res);
				}
				
				// hook an error handler
				this.img.onerror = function() { 
					res.fire('onerror', res);
				}
				
			},
			
			isLoaded : function() {
				
				if (!('img' in this) || !this.img.complete) {
					return false;
				}
				
				if (typeof this.img.naturalWidth != 'undefined' 
					&& this.img.naturalWidth == 0) {
					return false;
				}
				
				return true;
			},
			
			getTexture : function() {
				
				if (!('texture' in this)) {
				
					// Make sure our image is actually loaded
					if (!this.isLoaded()) {
						throw new Error('Cannot get texture, image not yet loaded for ' + this.id);
					}

					this.texture = fro.renderer.createTexture(this.img);
				}
				
				return this.texture;
			}
			
		}, EventHooks);

		return resource;
	},
	
	/**
	 * Loads an audio buffer into resource.buffer, converted into 
	 * an AudioBuffer object via resource.getAudioBuffer()
	 *
	 * @return new resource object
	 */
	_loadSound : function() {
		
		// @todo possibly new class initiating, rather than this?
		var resource = $.extend({
			
			load : function(id, url) {
				
				this.id = id;
				this.url = url;
				
				var res = this;

				var request = new XMLHttpRequest();
				
				request.open('GET', url, true);
				request.responseType = 'arraybuffer';
				
				// Decode asynchronously
				request.onload = function() {
				
					var context = fro.audio.getAudioContext();
					if (context) {
						
						context.decodeAudioData(request.response, function(buffer) {

							res.buffer = buffer;
							res.fire('onload', res);
							
						}, function() {
							res.fire('onerror', res);
						});
						
					} else {
						res.fire('onerror', res);
					}
					
				};
				
				// hook an error handler for network errors
				request.onerror = function() { 
					res.fire('onerror', res);
				}
				
				request.send();
				
			},
			
			isLoaded : function() {
				
				if (!this.buffer) {
					return false;
				}
				
				return true;
			},

			getBuffer : function() {
				
				return this.buffer;
			}
			
		}, EventHooks);

		return resource;
	},
	
	/**
	 * Loads an AJAX response body into a JS object, in resource.json
	 *
	 * @return new resource object
	 */
	_loadJSON : function() {
		
		var resource = $.extend({
			
			load : function(id, url) {
				
				this.id = id;
				this.url = url;
				
				var res = this;
				$.ajax({
					url: url,
					success: function(data) {

						if (typeof data == 'string') {
							
							// decode as JSON
							try {
								res.json = JSON.parse(data);
							} catch (e) {
								console.log(e);
								console.log(data);
								res.fire('onerror', this);
								return;
							}
							
						} else {
							res.json = data;
						}
						
						res.fire('onload', this);
					},
					error: function(request, status, error) {
						console.log(error);
						res.fire('onerror', this);
					}
				});
			},
			
			isLoaded : function() {
				return ('json' in this);
			}
			
		}, EventHooks);

		return resource;
	},
	
	/**
	 * Loads and runs a Javascript script through AJAX
	 * @return new resource object
	 */
	_loadJS : function() {
		throw new Error('Not implemented');
	},
	
	/**
	 * Loads the raw AJAX response body into resource.data
	 *
	 * @return new resource object
	 */
	_loadData : function() {
		
		var resource = $.extend({
			
			load : function(id, url) {
				
				this.id = id;
				this.url = url;
				
				var res = this;
				$.ajax({
					url: url,
					success: function(data) {

						res.data = data;
						res.fire('onload', this);
					},
					error: function(request, status, error) {
						console.log(error);
						res.fire('onerror', this);
					}
				});
			},
			
			isLoaded : function() {
				return ('data' in this);
			}
			
		}, EventHooks);

		return resource;
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
	 * 
	 * @return GL texture object or null
	 */
	getFontTexture : function(text, options) {
		
		if (!this.scratchCanvas) {
			throw new Error('No fro.resources.scratchCanvas defined');
			return null;
		}
		
		if (text.length < 1) {
			throw new Error('No text');
		}
		
		var canvas = this.scratchCanvas;
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

		if (w < 1 || h < 1) {
			throw new Error('Invalid canvas dimensions ' + w + 'x' + h);
		}
		
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
		var texture = fro.renderer.createTexture(canvas);
		
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
	 * 
	 * @return GL Texture object or null
	 */
	getBubbleTexture : function(text, options) {

		if (!this.scratchCanvas) {
			fro.log.error('No fro.resources.scratchCanvas defined');
			return null;
		}

		// Pull the secondary canvas used for font rendering
		var canvas = this.scratchCanvas;
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
		var texture = fro.renderer.createTexture(canvas);
		
		return texture;
	},
	
	getDefaultTexture : function() {
		
		// If we already generated it, return it
		if (this._defaultTexture)
			return this._defaultTexture;
		
		// Draw a new texture with canvas primitives
		
		// Pull the secondary canvas used for sub rendering
		var canvas = this.scratchCanvas;
		var ctx = canvas.getContext("2d");

		var size = 256;
		
		canvas.width = size;
		canvas.height = size;

		var stGrd = ctx.createLinearGradient(0, 0, 0, size);
		stGrd.addColorStop(0, '#ff0000');
		stGrd.addColorStop(1, '#660000');
		
		ctx.strokeStyle = stGrd;
		//ctx.strokeStyle = '#ff0000';

		// Render a polygon via paths
		ctx.beginPath();

		ctx.lineWidth = 12;
		
		ctx.clearRect(0, 0, size, size);

		ctx.moveTo(3, 12); // top left
		ctx.lineTo(size-8, 25); // top right
		ctx.lineTo(size-20, size-20); // bottom right
		ctx.lineTo(8, size-8); // bottom left
		ctx.lineTo(8, 20); // back to top left
		ctx.lineTo(size-20, size-20); // back to bottom right
		ctx.moveTo(8, size-8); // bottom left
		ctx.lineTo(size-8, 25); // top right

		ctx.stroke(); // draw
		
		var texture = fro.renderer.createTexture(canvas);
		
		this._defaultTexture = texture;
		return texture;
	},

}, EventHooks);

