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

    /** 
     * Definition of an animation/spritesheet. 
     * Handles setting framesets, animation timing, looping, etc. 
     */
    function Animation(context, properties) {
        Util.extend(this, EventHooks);

        if (!this.validateMetadata(properties)) {
            // TODO: better error handling
            throw new Error('Malformed Animation metadata');
        }

        this.context = context;
        this.url = properties.url;
        this.width = properties.width;
        this.height = properties.height;
        this.playing = true;
        this.keyframes = properties.keyframes;
        this.clip = rect.create();
        this.keyframe = null; // So that setKeyframe() to 'undefined' forces default.

        // Initialize keyframe-tracking properties and reset
        this.setKeyframe();

        // Load an image resource. Note that we load this 
        // as a sub-resource so that we can load cached images
        // if another Animation instance already uses the same source.
        this.image = context.resources.load({
            type: 'image',
            url: properties.url,
            width: properties.width,
            height: properties.height,
            shader: properties.shader,
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

        // Create an animation timer for this avatar
        this.playInterval = context.timers.addInterval(
            this, 
            this.onInterval, 
            this.delay
        ); 
    }

    /**
     * Returns whether the input metadata schema is acceptable. 
     *
     * @param {Object} metadata
     *
     * @return {boolean}
     */
    Animation.prototype.validateMetadata = function(metadata) {

        // TODO: More validation rules!
        var requiredKeys = [
            'width', 'height', 'url', 'keyframes'
        ];
        
        for (var i = 0; i < requiredKeys.length; i++) {
            if (!metadata.hasOwnProperty(requiredKeys[i])) {
                return false;
            }
        }

        return true;
    };

    /** 
     * Increment which frame of the current animation is rendered.
     *
     * @param {boolean} forceLoop even if the frameset set loop to false
     */
    Animation.prototype.next = function(forceLoop) {
        
        // If our animation somehow lost the keyframe, play default
        if (!this.keyframes.hasOwnProperty(this.keyframe)) {
            this.setKeyframe();
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
    Animation.prototype.setKeyframe = function(key) {

        // If they change the keyframe, or force a set, try to set.
        if (this.keyframe !== key) {

            if (key && this.keyframes.hasOwnProperty(key)) {
                this.keyframe = key;
                this.reset();
            } else {
                // Default active keyframe to the first one found
                this.keyframe = Object.keys(this.keyframes)[0];
            }
        }
    };

    /**
     * Reset the current animation to the beginning of the frameset.
     */
    Animation.prototype.reset = function() {

        this.index = 0;
        this.frame = 0;
        this.delay = 0;

        this.next(false);
    };

    /** 
     * Recalculate the source rect of our texture based on the current row/frame 
     */
    Animation.prototype.updateTextureClip = function() {

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

    /**
     * Returns true if the underlying Image resource has fully loaded.
     *
     * @return {boolean}
     */
    Animation.prototype.isLoaded = function() {
        return this.image.isLoaded();
    };

    Animation.prototype.onImageReady = function() {
        this.reset();

        // Notify listeners
        this.fire('onload', this);
    };

    Animation.prototype.onImageError = function() {
        // TODO: Stuff!
        this.fire('onerror', this);
    };

    Animation.prototype.render = function(position) {

        // Just render a clip of our source image
        if (this.image) {
            this.image.render(position, 0.0, this.clip);
        }
    };

    Animation.prototype.onInterval = function() {
        
        if (this.playing) {
            this.next(false);

            // TODO: Probably not use Timers engine. The whole deal is that
            // Timers is steady, so if there's a delay in processing, it'll
            // re-run the callback constantly until it catches up. Animations
            // don't matter, and we can skip playback of a few frames. Although
            // I guess it technically doesn't know how many to skip, and this
            // would prevent slowdown and instead actually skip.

            // Update timer delay to the next frame's delay
            // TODO: This line is dumb. Reference the interval instance or something.
            this.context.timers.intervals[this.playInterval].delay = this.delay;
        }

        // TODO: If not playing, we need to reset the interval to something to check
        // for playback, or reset. 
    };

    /**
     * Start automatic playback of the active keyframe animation.
     */
    Animation.prototype.play = function() {
        this.playing = true;

        // Update the timer to continue playback
        var interval = this.context.timers.intervals[this.playInterval];
        interval.delay = this.delay;
        interval.lastRun = Date.now();
    };

    /**
     * Stop playback of the current keyframe animation.
     */
    Animation.prototype.stop = function() {
        this.playing = false;

        // TODO: Proper "stop". For now, we just set it to a large number
        // to prevent it from running as often. 
        var interval = this.context.timers.intervals[this.playInterval];
        interval.delay = 100000;
    };

    // Since each animation has an internal state, it can't be shared
    // among other resources (otherwise they'll all play the same 
    // frames simultaneously. And that gets boring :P)
    Animation.shareable = false;

    return Animation;
});
