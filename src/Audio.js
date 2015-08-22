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

    function Audio(context) {
        // jshint unused:false
        Util.extend(this, EventHooks);

        this.audioContext = null;
        this.audioGainNode = null;
        this.ambientGainNode = null;

        try {
            // Fix up for prefixing
            window.AudioContext = window.AudioContext||window.webkitAudioContext;
            
            if (window.AudioContext) {
                this.audioContext = new window.AudioContext();
            }
        } catch (exception) {
            this.audioContext = null;
        }

        if (this.audioContext) {
            // More vendor corrections.
            if (!this.audioContext.createGain) {
                this.audioContext.createGain = this.audioContext.createGainNode;
            }

            // TODO: Necessary?
            if (!this.audioContext.createGain) {
                throw new Error('Failed to identify createGain() for audio context');
            }
            
            this.audioGainNode = this.audioContext.createGain();
            this.audioGainNode.connect(this.audioContext.destination);
            
            this.ambientGainNode = this.audioContext.createGain();
            this.ambientGainNode.connect(this.audioGainNode);
        }
    }

    /** 
     * Returns true if the audio API is available to use
     */
    Audio.prototype.isAvailable = function() {
        return this.audioContext !== null;
    };

    Audio.prototype.getAudioContext = function() {
        return this.audioContext;
    };
    
    Audio.prototype.setMasterVolume = function(volume) {
        
        if (volume > 1.0) {
            volume = 1.0;
        }
        
        if (this.audioContext && this.audioGainNode) {
            // Using an x-squared curve since simple linear (x) 
            // does not sound as good (via html5rocks.com)
            this.audioGainNode.gain.value = volume * volume;
            
            this.fire('setmaster', volume);
        }
    };
    
    Audio.prototype.getMasterVolume = function() {
    
        if (this.audioContext && this.audioGainNode) {
            // TODO: math is wrong, not the same as setMasterVolume
            return this.audioGainNode.gain.value;
        } else {
            return 0;
        }
    };
    
    Audio.prototype.setAmbientVolume = function(volume) {
        
        if (volume > 1.0) {
            volume = 1.0;
        }
        
        if (this.audioContext && this.audioGainNode) {
            // Using an x-squared curve since simple linear (x) 
            // does not sound as good (via html5rocks.com)
            this.ambientGainNode.gain.value = volume * volume;
            
            this.fire('setambient', volume);
        }
    };
    
    Audio.prototype.getAmbientVolume = function() {
        
        if (this.audioContext && this.audioGainNode) {
            // TODO: math is wrong, not the same as setAmbientVolume
            return this.ambientGainNode.gain.value;
        } else {
            return 0;
        }
    };
    
    Audio.prototype.addConnection = function(source, ambient) {
        
        if (this.audioContext) {
            if (ambient) {
                source.connect(this.ambientGainNode);
            } else { // connect directly to master
                source.connect(this.audioGainNode);
            }
        }
    };
    
    Audio.prototype.play = function(source) {
        
        if (this.audioContext) {
            source.start(0);
        }
    };
    
    Audio.prototype.stop = function(source) {
    
        if (this.audioContext) {
            source.stop(0);
        }
    };

    return Audio;
});    
