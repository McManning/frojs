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
     * Built-in JSON resource type.
     * On load, this will issue a GET for a JSON file and validate
     * if it actually JSON.
     */

    function Json(context, properties) {
        Resource.call(this, context, properties);

        this.url = properties.url;
        
        var request = new window.XMLHttpRequest();
        request.open('GET', this.url, true);

        var self = this;
        request.onload = function() {
            if (request.status >= 200 && request.status < 400) {
                self.json = JSON.parse(request.responseText);
                self.fire('onload', this);
            } else {
                // We reached our target server, but it returned an error
                self.fire('onerror', this);
            }
        };

        request.onerror = function() {
            // There was a connection error of some sort
            self.fire('onerror', this);
        };

        request.send();
    }

    Json.prototype = Object.create(Resource.prototype);
    Json.prototype.constructor = Json;

    /**
     * Returns whether the input metadata schema is acceptable. 
     *
     * @param {Object} metadata
     *
     * @return {boolean}
     */
    Json.prototype.validateMetadata = function(metadata) {
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

    Json.prototype.isLoaded = function() {
        return typeof this.json === 'object';
    };

    Json.prototype.getJson = function() {
        return this.json;
    };

    return Json;
});
