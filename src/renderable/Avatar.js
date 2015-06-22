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

/** 
 * Definition of an avatar/sprite object a particular actor can wear.
 * Handles animation, frameset changes, loading, etc.
 */
function Avatar() {
    // stuff
    this.clip = rect.create();
    //this.HSVShift = vec3.create();
    
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
    
    this.currentKeyframe = '';
    this.currentFrame = 0;
    this.currentIndex = 0;
    this.currentDelay = 0;
    
    this.keyframes = settings.keyframes;

    this.id = id;
    this.url = settings.url;
    this.width = settings.width;
    this.height = settings.height;

    var renderable;
    
    // Check if the url was provided as a resource ID, or something already loaded
    if (fro.resources.isLoaded(settings.url)) {
    
        renderable = fro.resources.load(settings.url);
        
    } else { // Need to load a new resource
    
        renderable = fro.resources.load({
            type: 'image',
            id: settings.url,
            url: settings.url,
            width: settings.width,
            height: settings.height,
            //useAlphaKey: true,
            fitToTexture: false,
            shader: 'default_shader'
        });
    }
    
    // If it needs to load external resources, hook for errors
    if (!renderable.isLoaded()) {
    
        // Bind and wait for the image to be loaded
        var self = this;
        renderable.bind('onload', function() {

            self.fire('ready');
            
        }).bind('onerror', function() {
        
            self.fire('error', 'Failed to load ' + self.url);
        });
        
    } else {
        this.fire('ready'); 
    }
    
    this.renderable = renderable;
    
}

/** 
 * Increment which frame of the current row animation is rendered
 * @param boolean loop If true, and we're already on the last frame, will reset() itself
 */
Avatar.prototype.nextFrame = function(forceLoop) {
    
    if (this.currentKeyframe in this.keyframes) {
        // if we hit the end of the animation, loop (if desired)
        if (this.keyframes[this.currentKeyframe].frames.length <= this.currentIndex + 1) {
            if (this.keyframes[this.currentKeyframe].loop || forceLoop) {
                this.currentIndex = 0;
            } else {
                this.currentIndex -= 2;
            }
        }
        
        // Get the frame index (of the source image) to render
        this.currentFrame = this.keyframes[this.currentKeyframe]
                .frames[this.currentIndex];
        
        // pull out the delay for the next frame
        this.currentDelay = this.keyframes[this.currentKeyframe]
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
    return (key in this.keyframes);
}

Avatar.prototype.reset = function() {

    this.currentIndex = 0;
    this.currentDelay = 0;
    this.currentFrame = 0;
    this.nextChange = new Date().getTime();
    
    this.nextFrame(false);
}

Avatar.prototype.getWidth = function() { 
    return this.width;
}

Avatar.prototype.getHeight = function() { 
    return this.height;
}

/** Recalculate the source rect of our texture based on the current row/frame */
Avatar.prototype.updateTextureClip = function() {

    if (this.renderable) {
        var framesPerRow = Math.floor(this.renderable.getTextureWidth() / this.getWidth());
        
        var x = this.currentFrame % framesPerRow;
        var y = (this.currentFrame - x) / framesPerRow;

        //var x = this.getWidth() * this.currentFrame;
        //var y = this.getHeight() * this.currentRow;
        
        // Update texture clip
        this.clip[0] = x * this.getWidth();
        this.clip[1] = y * this.getHeight();
    }
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

Avatar.prototype.render = function(position) {

    // @todo fancy additional stuff
    
    this.renderable.render(position, 0.0, this.clip);
}

