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
    'resource/Resource'
], function(Resource) {

    /**
     * Built-in sound resource type.
     * On load, this will issue a GET for an audio clip supported
     * by the user's browser and buffer the contents. Note, this
     * does not attempt to determine support for track types. 
     */
    function Sound(context, properties) {
        Resource.call(this, context, properties);

        this.url = properties.url;
        this.buffer = null;
        
        var request = new window.XMLHttpRequest();
        request.open('GET', this.url, true);
        request.responseType = 'arraybuffer';
        
        // Decode asynchronously
        var self = this;
        request.onload = function() {
            var audioContext = context.audio.getAudioContext();
            if (audioContext) {
                
                audioContext.decodeAudioData(request.response, function(buffer) {

                    self.buffer = buffer;
                    self.fire('onload', self);
                    
                }, function() {
                    self.fire('onerror', self);
                });
                
            } else {
                self.fire('onerror', self);
            }
        };
        
        // hook an error handler for network errors
        request.onerror = function() { 
            self.fire('onerror', self);
        };
        
        request.send();
    }

    Sound.prototype = Object.create(Resource.prototype);
    Sound.prototype.constructor = Sound;

    /**
     * Returns whether the input metadata schema is acceptable. 
     *
     * @param {Object} metadata
     *
     * @return {boolean}
     */
    Sound.prototype.validateMetadata = function(metadata) {
        var requiredKeys = [
            'url'
        ];
        
        for (var i = 0; i < requiredKeys.length; i++) {
            if (!metadata.hasOwnProperty(requiredKeys[i])) {
                return false;
            }
        }

        return true;
    };

    Sound.isLoaded = function() {

        return !!this.buffer;
    };

    Sound.getBuffer = function() {

        return this.buffer;
    };

    return Sound;
});
