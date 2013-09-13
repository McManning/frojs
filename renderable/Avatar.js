
"use strict";

/** 
 * Definition of an avatar/sprite object a particular actor can wear.
 * Handles animation, frameset changes, loading, etc.
 */
function Avatar() {
	// stuff
	this.clip = rect.create();
	this.HSVShift = vec3.create();
	
	$.extend(this, EventHooks);
}

Avatar.prototype.load = function(id, settings) {
	
	// Perform metadata validation
	var requiredKeys = [
		'id', 'width', 'height', 'url', 'keyframes'
	];
	
	for (var i in requiredKeys) {
		if ( !settings[requiredKeys[i]] ) {
			self.fire('error', 'Metadata missing required key ' + requiredKeys[i]);
			return;
		}
	}
	
	this.renderable = new RenderableImage(
							settings.width,
							settings.height
						);
					
	this.renderable.useAlphaKey = true;
	this.renderable.textureStretching = false;

	this.settings = settings;
	
	this.currentKeyframe = '';
	this.currentFrame = 0;
	this.currentIndex = 0;
	this.currentDelay = 0;
	
	this.id = id;
	this.url = settings.url;

	var resource = fro.resources.load(settings.url);
	
	if (resource.isLoaded()) { 
	
		// If it's already cached, load immediately
		this.renderable.setTexture(resource.getTexture());
		this.fire('ready'); 
	
	} else {
	
		// Bind and wait for the image to be loaded
		var self = this;
		resource.bind('onload', function() {

			self.renderable.setTexture(this.getTexture());
			self.fire('ready');
		})
		.bind('onerror', function() {
		
			self.fire('error', 'Failed to load ' + self.url);
		});
	}
}

/** 
 * Increment which frame of the current row animation is rendered
 * @param boolean loop If true, and we're already on the last frame, will reset() itself
 */
Avatar.prototype.nextFrame = function(forceLoop) {
	
	if (this.currentKeyframe in this.settings.keyframes) {
		// if we hit the end of the animation, loop (if desired)
		if (this.settings.keyframes[this.currentKeyframe].frames.length <= this.currentIndex + 1) {
			if (this.settings.keyframes[this.currentKeyframe].loop || forceLoop) {
				this.currentIndex = 0;
			} else {
				this.currentIndex -= 2;
			}
		}
		
		// Get the frame index (of the source image) to render
		this.currentFrame = this.settings
				.keyframes[this.currentKeyframe]
				.frames[this.currentIndex];
		
		// pull out the delay for the next frame
		this.currentDelay = this.settings
				.keyframes[this.currentKeyframe]
				.frames[this.currentIndex+1];
		
		// pull out the frame number for the next frame
		this.currentIndex += 2;
		
		this.updateTextureClip();
		
	} else {
		fro.log.warning('[Avatar.nextFrame] no key ' + this.currentKeyframe);
	}
}

Avatar.prototype.setKeyframe = function(key) {

	if (this.currentKeyframe != key && this.hasKeyframe(key)) {
		// @todo check if it exists first! If not, default to w/e the first keyframes set is
		this.currentKeyframe = key;
		
		// Reset current animation
		this.reset();
	}
}

Avatar.prototype.hasKeyframe = function(key) {
	return (key in this.settings.keyframes);
}

Avatar.prototype.reset = function() {

	this.currentIndex = 0;
	this.currentDelay = 0;
	this.currentFrame = 0;
	this.nextChange = new Date().getTime();
	
	this.nextFrame(false);
}

Avatar.prototype.getWidth = function() { 
	return this.renderable.width;
}

Avatar.prototype.getHeight = function() { 
	return this.renderable.height;
}

/** Recalculate the source rect of our texture based on the current row/frame */
Avatar.prototype.updateTextureClip = function() {

	var framesPerRow = Math.floor(this.renderable.texture.image.width / this.getWidth());
	
	var x = this.currentFrame % framesPerRow;
	var y = (this.currentFrame - x) / framesPerRow;

	//var x = this.getWidth() * this.currentFrame;
	//var y = this.getHeight() * this.currentRow;
	
	// Update texture clip
	this.clip[0] = x * this.getWidth();
	this.clip[1] = y * this.getHeight();
}

/** Callback for when RenderableImage finally receives a texture */
Avatar.prototype.onImageLoad = function() {
/*
	this.frameCount = this.renderable.texture.image.width / this.getWidth();
	this.rowCount = this.renderable.texture.image.height / this.getHeight();
	
	// Put origin at the bottom center
	this.renderable.offset[1] = this.getHeight()/2;
*/
}

Avatar.prototype.render = function(position, offset) {

	// @todo fancy additional stuff
	
	this.renderable.render(position, offset, 0.0, this.clip, 0, this.HSVShift);
}


