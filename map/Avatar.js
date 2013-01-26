
"use strict";

// @todo write this. It was just imported from a random .js file on my flash drive

/** 
 * Definition of an avatar/sprite object a particular actor can wear.
 * Handles animation, frameset changes, loading, etc.
 */
function Avatar() {
	// stuff
	
	
	$.extend(this, EventHooks);
}

Avatar.prototype.load = function(url, w, h, delay) {
	
	this.renderable = new RenderableImage(w, h);
	this.renderable.useAlphaKey = true;
	
	this.currentFrame = 0;
	this.currentRow = 0;
	this.frameCount = 0;
	this.rowCount = 0;
	this.delay = delay; // @todo actually use it
	this.url = url;
	
	this.renderable.setClip(0, 0);
	
	this.renderable.loadTexture(url, this,
			function() { // onload
				this.onImageLoad();
				this.fire('ready');
			},
			function() { // onerror
				// @todo Do something, revert or load a default some such
				this.fire('error');
			}
		);
}

/** 
 * Increment which frame of the current row animation is rendered
 * @param boolean loop If true, and we're already on the last frame, will reset() itself
 */
Avatar.prototype.nextFrame = function(loop) {
	
	if (this.currentFrame + 1 < this.frameCount) {
		this.currentFrame = this.currentFrame + 1;
		
	} else if (loop) {
		this.currentFrame = 0;
	}
	
	this.updateTextureClip();
}

/** Change row index (facing direction) */
Avatar.prototype.setRow = function(index) {

	if (index < this.rowCount && index >= 0) {
		this.currentRow = index;
		this.updateTextureClip();
	}
}

/** Set current frame index to 0 */
Avatar.prototype.reset = function() {
	this.currentFrame = 0;
	this.updateTextureClip();
}

Avatar.prototype.getWidth = function() { 
	return this.renderable.width;
}

Avatar.prototype.getHeight = function() { 
	return this.renderable.height;
}

/** Recalculate the source rect of our texture based on the current row/frame */
Avatar.prototype.updateTextureClip = function() {

	var x = this.getWidth() * this.currentFrame;
	var y = this.getHeight() * this.currentRow;
	
	// Update texture clip
	this.renderable.setClip(x, y);
}

/** Callback for when RenderableImage finally receives a texture */
Avatar.prototype.onImageLoad = function() {

	this.frameCount = this.renderable.texture.image.width / this.getWidth();
	this.rowCount = this.renderable.texture.image.height / this.getHeight();
	
	// Put origin at the bottom center
	this.renderable.offset[1] = this.getHeight()/2;
}

Avatar.prototype.render = function() {

	// @todo fancy additional stuff
	
	this.renderable.render();
}


