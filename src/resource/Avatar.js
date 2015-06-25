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

define([
    'EventHooks',
    'Utility'
], function(EventHooks, Util) {

    // TODO: I actually would prefer to abstract away the frameset rules
    // a bit more. I want to be able to let NPCs or whomever just play
    // random animations - which would be defined by framesets. 

    /** 
     * Definition of an avatar/sprite object a particular actor can wear.
     * Handles animation, frameset changes, loading, etc.
     */
    function Avatar(context, properties) {
        Util.extend(this, EventHooks);

        if (!this.validateMetadata(properties)) {
            // TODO: better error handling
            throw new Error('Malformed Avatar metadata');
        }

        // This has an internal state, cannot be shared between instances.
        this.isShared = false; 

        this.url = properties.url;
        this.width = properties.width;
        this.height = properties.height;
        this.keyframes = properties.keyframes;

        this.keyframe = '';

        this.clip = rect.create();

        // Load an image resource. Note that we load this 
        // as a sub-resource so that we can load cached images
        // if another avatar instance already uses the same source.
        this.image = context.resources.load({
            type: 'image',
            url: properties.url,
            width: properties.width,
            height: properties.height,
            fitToTexture: false
        });

        this.onImageReady = this.onImageReady.bind(this);
        this.onImageError = this.onImageError.bind(this);

        // If we're still loading this image, bind events and wait
        if (!this.image.isLoaded()) {
            this.image.bind('onload', this.onImageReady);
            this.image.bind('onerror', this.onImageError);
        } else {
            this.onImageReady();
        }

        // Initialize keyframe-tracking properties
        this.reset();
    }

    /**
     * Returns whether the input metadata schema is acceptable. 
     *
     * @param {Object} metadata
     *
     * @return boolean
     */
    Avatar.prototype.validateMetadata = function(metadata) {

        // TODO: More validation rules!
        var requiredKeys = [
            'id', 'width', 'height', 'url', 'keyframes'
        ];
        
        for (var i = 0; i < requiredKeys.length; i++) {
            if (!metadata.hasOwnProperty(i)) {
                return false;
            }
        }

        return true;
    };

    /** 
     * Increment which frame of the current animation is rendered.
     *
     * @param {boolean} forceLoop if it should reset() after the final frame
     */
    Avatar.prototype.nextFrame = function(forceLoop) {
        
        // If our avatar somehow lost the keyframe, attempt to 
        // gracefully degrade down to something that works. 
        if (this.keyframes.hasOwnProperty(this.keyframe)) {
            this.setKeyframe(this.keyframe, true);
        }

        // if we hit the end of the animation, loop (if desired)
        if (this.keyframes[this.keyframe].frames.length <= this.index + 1) {
            if (this.keyframes[this.keyframe].loop || forceLoop) {
                this.index = 0;
            } else {
                this.index -= 2;
            }
        }
        
        // Get the frame index (of the source image) to render
        this.frame = this.keyframes[this.keyframe].frames[this.index];
        
        // pull out the delay for the next frame
        this.delay = this.keyframes[this.keyframe].frames[this.index+1];
        
        // pull out the frame number for the next frame
        this.index += 2;

        this.updateTextureClip();
    };

    /**
     * Set the active keyframe and reset the animation from the beginning.
     * This method will try to gracefully degrade down to something that works
     *
     * @param {String} key to apply 
     * @param {Boolean} force true will ignore a match with the current keyframe
     */
    Avatar.prototype.setKeyframe = function(key, force) {

        // If they change the keyframe, or force a set, try to set.
        if (this.keyframe !== key || force === true) {

            if (this.keyframes.hasOwnProperty(key)) {
                this.keyframe = key;
                this.reset();
            }

            // TODO: Check if it exists, if not, default to something.
            // Default rules from original fro were (in order):
            // - if act_* and no act_*, use stop_*
            // - if stop_* and no stop_*, use move_*
            // - if move_* and no move_*, use move_2
            // - if move_2 and no move_2, use first keyframe
        }
    };

    /**
     * Reset the current animation to the beginning of the frameset.
     */
    Avatar.prototype.reset = function() {

        this.index = 0;
        this.delay = 0;
        this.frame = 0;
        this.next = new Date().getTime();
        
        this.nextFrame(false);
    };

    /** 
     * Recalculate the source rect of our texture based on the current row/frame 
     */
    Avatar.prototype.updateTextureClip = function() {

        if (this.image) {
            var framesPerRow = Math.floor(this.image.getTextureWidth() / this.width);
            
            var x = this.frame % framesPerRow;
            var y = (this.frame - x) / framesPerRow;

            //var x = this.getWidth() * this.frame;
            //var y = this.getHeight() * this.currentRow;
            
            // Update texture clip
            this.clip[0] = x * this.width;
            this.clip[1] = y * this.height;
        }
    };

    Avatar.prototype.onImageReady = function() {

        // Re-set our active keyframe, just in case the current keyframe
        // does not exist in the new avatar.
        this.setKeyframe(this.keyframe, true);
    };

    Avatar.prototype.onImageError = function() {
        // TODO: Stuff!
    };

    Avatar.prototype.render = function(position) {

        // Just render a clip of our source image
        if (this.image) {
            this.image.render(position, 0.0, this.clip);
        }
    };

    return Avatar;
});