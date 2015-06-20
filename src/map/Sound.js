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

function Map_Sound() {}
Map_Sound.prototype = new Map_Entity();

Map_Sound.prototype.initialise = function(eid, properties) {
    Map_Entity.prototype.initialise.call(this, eid, properties);
    
    this.position = vec3.create();
    
    //this.audioBuffer = undefined;
    this.positional = properties.positional;
    this.loop = properties.loop;
    this.autoplay = properties.autoplay;
    this.ambient = properties.ambient;
    
    // If this is a positional audio source, set some coordinates
    if (properties.positional) {
        this.position[0] = properties.x;
        this.position[1] = properties.y;
    }
    
    if (fro.audio.isAvailable()) {
    
        // Use an internal gain node to control this single sound's volume
        this.audioGainNode = fro.audio.getAudioContext().createGain();
        this.setVolume(properties.volume);
        
        var resource = fro.resources.load(properties.sound);
        
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
            
                // @todo do something, revert, load default, etc.
                fro.log.error('Audio File Load Error');
                fro.log.error(this);
            });
        }
        
        fro.log.debug('New audio node "' + eid + '" at ' + vec3.str(this.position));
        
    } else {
        fro.log.warning('Muting audio node "' + eid + '". Browser does not support fro.audio');
    }
    
}

Map_Sound.prototype.destroy = function() {
    
    // Stop the track, in case we were still playing
    this.stop();
    
    if (this.audioBuffer) {
        this.audioGainNode.disconnect(0);
        //this.audioBuffer.disconnect(0); // @todo is this necessary?
        //delete this.audioBuffer;
        delete this.audioGainNode;
    }
    
    Map_Entity.prototype.destroy.call(this);
}

Map_Sound.prototype.setBuffer = function(buffer) {
    
    this.buffer = buffer;

    if (this.autoplay)
        this.play();
}

Map_Sound.prototype.setVolume = function(volume) {

    if (volume > 1.0)
        volume = 1.0;

    if (this.audioGainNode) {
        // Using an x-squared curve since simple linear (x) 
        // does not sound as good (via html5rocks.com)
        this.audioGainNode.gain.value = volume * volume;
    }
}

Map_Sound.prototype.play = function() {
    
    // @todo scale volume based on position relative to camera
    
    this.stop();
    
    if (fro.audio.isAvailable()) {
    
        // Each time we play, we need to generate a new audioBuffer object
        var source = fro.audio.getAudioContext().createBufferSource();
        source.buffer = this.buffer;
        source.loop = this.loop;
        
        // Patch some cross-browser differences
        if (!source.start)
            source.start = source.noteOn;
            
        if (!source.stop)
            source.stop = source.noteOff;
            
        this.audioBuffer = source;

        this.audioBuffer.connect(this.audioGainNode);
        fro.audio.addConnection(this.audioGainNode, this.ambient);
        
        fro.audio.play(this.audioBuffer);
    }
}

Map_Sound.prototype.stop = function() {

    if (this.audioBuffer) {
        fro.audio.stop(this.audioBuffer);
        delete this.audioBuffer; // No longer playable source
    }
}
