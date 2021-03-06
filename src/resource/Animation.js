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
    'resource/Resource',
    'Utility',
    'Timer'
], function(Resource, Util, Timer) {
    var rect = Util.rect;

    // Minimum allowed display time for each frame.
    var MINIMUM_FRAME_MS = 100;

    /** 
     * Definition of an animation/spritesheet. 
     * Handles setting framesets, animation timing, looping, etc. 
     */
    function Animation(context, properties) {
        Resource.call(this, context, properties);

        this.shareable = false; // CANNOT be cached/reused as 
                                // each instance has a unique state.
        this.url = properties.url;
        this.width = properties.width;
        this.height = properties.height;
        this.autoplay = !!properties.autoplay; // Optional, default false
        this.keyframes = properties.keyframes;
        this.clip = rect.create();
        this.keyframe = null; // So that setKeyframe() to 'undefined' forces default.

        // Initialize keyframe-tracking properties and reset
        this.setKeyframe();

        // Load an image resource. Note that we load this 
        // as a sub-resource so that we can load cached images
        // if another Animation instance already uses the same source.
        this.image = context.resources.load({
            type: 'Image',
            url: properties.url,
            width: properties.width,
            height: properties.height,
            shader: properties.shader,
            fitToTexture: false
        });

        // Create an animation timer for this animation
        this.onTimer = this.onTimer.bind(this);
        this.animateTimer = new Timer(this.onTimer, this.delay);

        this.onImageReady = this.onImageReady.bind(this);
        this.onImageError = this.onImageError.bind(this);

        // If we're still loading this image, bind events and wait
        if (!this.image.isLoaded()) {
            this.image.bind('onload', this.onImageReady);
            this.image.bind('onerror', this.onImageError);
        } else {
            this.onImageReady();
        }
    }

    Animation.prototype = Object.create(Resource.prototype);
    Animation.prototype.constructor = Animation;

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
        //console.log('frame ' + this.frame + ' on ' + Date.now());

        // pull out the delay for the next frame
        this.delay = this.keyframes[this.keyframe].frames[this.index+1];

        // Limit frame display time so nobody can set a ridiculously short delay
        this.delay = Math.max(this.delay, MINIMUM_FRAME_MS);

        // pull out the frame number for the next frame
        this.index += 2;

        this.updateTextureClip();
    };

    /**
     * Set the active keyframe and reset the animation from the beginning.
     * This method will try to gracefully degrade down to something that works
     *
     * @param {string} key to apply 
     * @param {boolean} force true will ignore a match with the current keyframe
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
     * Returns true if the input keyframe key exists in this animation.
     *
     * @param {string} key
     *
     * @return {boolean}
     */
    Animation.prototype.hasKeyframe = function(key) {

        return this.keyframes.hasOwnProperty(key);
    };

    /**
     * Reset the current animation to the beginning of the frameset.
     */
    Animation.prototype.reset = function() {

        this.index = 0;
        this.frame = 0;
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

        if (this.autoplay) {
            this.play();
        }

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

    Animation.prototype.onTimer = function(timer) {
        
        this.next(false);

        // Update timer interval to the next frames display time
        timer.interval = this.delay;

        // TODO: Probably not use Timers engine. The whole deal is that
        // Timers is steady, so if there's a delay in processing, it'll
        // re-run the callback constantly until it catches up. Animations
        // don't matter, and we can skip playback of a few frames. Although
        // I guess it technically doesn't know how many to skip, and this
        // would prevent slowdown and instead actually skip.
    };

    /**
     * Start automatic playback of the active keyframe animation.
     */
    Animation.prototype.play = function() {
        this.animateTimer.interval = this.delay;
        this.animateTimer.start();
    };

    /**
     * Stop playback of the current keyframe animation.
     */
    Animation.prototype.stop = function() {

        this.animateTimer.stop();
    };
    
    Animation.prototype.isPlaying = function() {

        return this.animateTimer.running;
    };

    return Animation;
});
