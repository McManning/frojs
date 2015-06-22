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

        var audioContext,
            audioGainNode,
            ambientGainNode;

        try {
            // Fix up for prefixing
            window.AudioContext = window.AudioContext||window.webkitAudioContext;
            
            if (window.AudioContext) {
                audioContext = new window.AudioContext();
            }
        } catch (exception) {
            // TODO: Graceful failure, not a damn exception
            throw new Error('Failed to initialise AudioContext: ' + exception);
        }
        
        // More vendor corrections.
        if (!audioContext.createGain) {
            audioContext.createGain = audioContext.createGainNode;
        }

        // TODO: Necessary?
        if (!audioContext.createGain) {
            throw new Error('Failed to identify createGain() for audio context');
        }
        
        audioGainNode = audioContext.createGain();
        audioGainNode.connect(audioContext.destination);
        
        ambientGainNode = audioContext.createGain();
        ambientGainNode.connect(audioGainNode);
        
        /** 
         * Returns true if the audio API is available to use
         */
        this.isAvailable = function() {
            return audioContext !== null;
        };

        this.getAudioContext = function() {
            return audioContext;
        };
        
        this.setMasterVolume = function(volume) {
            
            if (volume > 1.0) {
                volume = 1.0;
            }
            
            if (audioContext && audioGainNode) {
                // Using an x-squared curve since simple linear (x) 
                // does not sound as good (via html5rocks.com)
                audioGainNode.gain.value = volume * volume;
                
                this.fire('setmaster', volume);
            }
        };
        
        this.getMasterVolume = function() {
        
            if (audioContext && audioGainNode) {
                // TODO: math is wrong, not the same as setMasterVolume
                return audioGainNode.gain.value;
            } else {
                return 0;
            }
        };
        
        this.setAmbientVolume = function(volume) {
            
            if (volume > 1.0) {
                volume = 1.0;
            }
            
            if (audioContext && audioGainNode) {
                // Using an x-squared curve since simple linear (x) 
                // does not sound as good (via html5rocks.com)
                ambientGainNode.gain.value = volume * volume;
                
                this.fire('setambient', volume);
            }
        };
        
        this.getAmbientVolume = function() {
            
            if (audioContext && audioGainNode) {
                // TODO: math is wrong, not the same as setAmbientVolume
                return ambientGainNode.gain.value;
            } else {
                return 0;
            }
        };
        
        this.addConnection = function(source, ambient) {
            
            if (audioContext) {
                if (ambient) {
                    source.connect(ambientGainNode);
                } else { // connect directly to master
                    source.connect(audioGainNode);
                }
            }
        };
        
        this.play = function(source) {
            
            if (audioContext) {
                source.start(0);
            }
        };
        
        this.stop = function(source) {
        
            if (audioContext) {
                source.stop(0);
            }
        };
    }

    return Audio;
});    
