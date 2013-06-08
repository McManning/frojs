
"use strict";

var DEFAULT_AVATAR = {
    "id": "default_avatar",
    "url": "default_avatar",
    "metadata": {
		"version": 1,
		"format": "MG-PNG",
		"tags": "",
		"shared": false,
		"name": "",
		"width": 32,
		"height": 64,
		"keyframes": {
			"move_2": {
				"loop": false,
				"frames": [
					0,
					1000,
					1,
					1000
				]
			},
			"move_8": {
				"loop": false,
				"frames": [
					2,
					1000,
					3,
					1000
				]
			},
			"move_4": {
				"loop": false,
				"frames": [
					4,
					1000,
					5,
					1000
				]
			},
			"move_6": {
				"loop": false,
				"frames": [
					6,
					1000,
					7,
					1000
				]
			},
			"act_2": {
				"loop": false,
				"frames": [
					8,
					1000,
					9,
					1000
				]
			}
		}
	}
};

/** 
 * Definition of an avatar/sprite object a particular actor can wear.
 * Handles animation, frameset changes, loading, etc.
 */
function Avatar() {
	// stuff
	
	
	$.extend(this, EventHooks);
}

Avatar.prototype.loadDefault = function() {
	
	this.load(DEFAULT_AVATAR);
}

Avatar.prototype.load = function(settings) {
	
	this.renderable = new RenderableImage(
							settings.metadata.width, 
							settings.metadata.height
						);
					
	this.renderable.useAlphaKey = true;
	this.renderable.textureStretching = false;

	// Put origin at bottom center
	this.renderable.offset[1] = this.getHeight()/2;
	
	this.settings = settings;
	
	this.currentKeyframe = '';
	this.currentFrame = 0;
	this.currentIndex = 0;
	this.currentDelay = 0;
	
	// @todo some magic here for the URL 
	this.url = settings.url;
	
	this.renderable.setClip(0, 0);

	var resource = fro.resources.load(settings.url);
	
	if (resource.isLoaded()) { 
	
		// If it's already cached, load immediately
		this.renderable.setTexture(resource.getTexture());
		this.onImageLoad();
		this.fire('ready'); 
	
	} else {
	
		// Bind and wait for the image to be loaded
		var self = this;
		resource.bind('onload', function() {

			self.renderable.setTexture(this.getTexture());
			//self.onImageLoad();
			self.fire('ready'); // @todo get rid of this, used for row recalc on the Actor level
		})
		.bind('onerror', function() {
		
			// @todo do something, revert, load default, etc.
			fro.log.error('Avatar Image Load Error');
			fro.log.error(this);
		});
	}
}

/** 
 * Increment which frame of the current row animation is rendered
 * @param boolean loop If true, and we're already on the last frame, will reset() itself
 */
Avatar.prototype.nextFrame = function(forceLoop) {

	// if we hit the end of the animation, loop (if desired)
	if (this.settings.metadata.keyframes[this.currentKeyframe].frames.length <= this.currentIndex + 1) {
		if (this.settings.metadata.keyframes[this.currentKeyframe].loop || forceLoop) {
			this.currentIndex = 0;
		} else {
			this.currentIndex -= 2;
		}
	}
	
	// Get the frame index (of the source image) to render
	this.currentFrame = this.settings.metadata
			.keyframes[this.currentKeyframe]
			.frames[this.currentIndex];
	
	// pull out the delay for the next frame
	this.currentDelay = this.settings.metadata
			.keyframes[this.currentKeyframe]
			.frames[this.currentIndex+1];
	
	// pull out the frame number for the next frame
	this.currentIndex += 2;
	
	this.updateTextureClip();
}

Avatar.prototype.setKeyframe = function(key) {

	if (this.currentKeyframe != key && this.hasKeyframe(key)) {
		console.log(key);
		// @todo check if it exists first! If not, default to w/e the first keyframes set is
		this.currentKeyframe = key;
		
		// Reset current animation
		this.reset();
	}
}

Avatar.prototype.hasKeyframe = function(key) {
	return (key in this.settings.metadata.keyframes);
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
	this.renderable.setClip(x * this.getWidth(), y * this.getHeight());
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

Avatar.prototype.render = function() {

	// @todo fancy additional stuff
	
	this.renderable.render();
}


