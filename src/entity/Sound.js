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
    'entity/Entity'
], function(Entity) {

    /**
     * Sound effect (or ambience) that can have a position in the world.
     */
    function Sound(context, properties) {
        Entity.call(this, context, properties);

        this.positional = properties.positional || false;
        this.loop = properties.loop || false;
        this.autoplay = properties.autoplay || true;
        this.ambient = properties.ambient || false;

        //this.sourceBuffer;
        //this.audioBuffer;
        //this.audioGainNode;
        
        // If this is a positional audio source, set some coordinates
        if (this.positional) {
            this.setPosition(properties.x, properties.y);
        }

        // If our audio driver is working, go load our source file 
        if (this.context.audio.isAvailable()) {

            // Use an internal gain node to control this single sound's volume
            this.audioGainNode = this.context.audio.getAudioContext().createGain();
            this.setVolume(properties.volume || 100);

            var resource = this.context.resources.load(properties.sound);
            
            if (resource.isLoaded()) {
            
                // Audio source is already loaded
                this.setBuffer(resource.getBuffer());
                
            } else {
                
                // Bind and wait for the audio source to load
                var self = this;
                resource.bind('onload', function() {

                    self.setBuffer(this.getBuffer());
                })
                .bind('onerror', function() {
                
                    // TODO: do something, revert, load default, etc
                });
            }
        }
    }

    Sound.prototype = Object.create(Entity.prototype);
    Sound.prototype.constructor = Sound;

    Sound.prototype.destroy = function() {
        
        // Stop the track, in case we were still playing
        this.stop();
        
        if (this.audioBuffer) {
            this.audioGainNode.disconnect(0);
            //this.audioBuffer.disconnect(0); // TODO is this necessary?
            //delete this.audioBuffer;
            this.audioGainNode = undefined;
        }
        
        Entity.prototype.destroy.call(this);
    };

    Sound.prototype.setBuffer = function(buffer) {
        sourceBuffer = buffer;

        if (autoplay) {
            this.play();
        }
    };

    Sound.prototype.setVolume = function(volume) {

        if (volume > 1.0) {
            volume = 1.0;
        }

        this.volume = volume;

        if (this.audioGainNode) {
            // Using an x-squared curve since simple linear (x) 
            // does not sound as good (via html5rocks.com)
            this.audioGainNode.gain.value = volume * volume;
        }
    };

    Sound.prototype.play = function() {
        
        // @todo scale volume based on position relative to camera
        
        this.stop();
        
        if (this.context.audio.isAvailable()) {
        
            // Each time we play, we need to generate a new audioBuffer object
            var source = this.context.audio.getAudioContext().createBufferSource();
            source.buffer = this.sourceBuffer;
            source.loop = this.loop;
            
            // Patch some cross-browser differences
            if (!source.start) {
                source.start = source.noteOn;
            }
                
            if (!source.stop) {
                source.stop = source.noteOff;
            }
                
            this.audioBuffer = source;

            this.audioBuffer.connect(this.audioGainNode);
            this.context.audio.addConnection(this.audioGainNode, this.ambient);
            
            this.context.audio.play(this.audioBuffer);
        }
    };

    Sound.prototype.stop = function() {

        if (this.audioBuffer) {
            this.context.audio.stop(this.audioBuffer);
            this.audioBuffer = undefined; // No longer playable source
        }
    };

    return Sound;
});
