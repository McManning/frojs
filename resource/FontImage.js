
"use strict";

function FontImageResource() {}
FontImageResource.prototype = new ImageResource();

FontImageResource.prototype.load = function(json) {
	ImageResource.prototype.load.call(this, json);
	
	this.fitToTexture = false; 
	this.text = json.text;
	this.options = json;
	
	this.generateFontTexture(json);
	
	this.buildVertexBuffer();
	this.buildTextureBuffer();
}

FontImageResource.prototype.generateFontTexture = function(options) {

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
	this.texture = fro.renderer.createTexture(canvas);
	this.width = w;
	this.height = h;
}

FontImageResource.prototype.getTextureWidth = function() {
	return this.width;
}

FontImageResource.prototype.getTextureHeight = function() {
	return this.height;
}
