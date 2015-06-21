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
     * Built-in JSON resource type.
     * On load, this will issue a GET for a JSON file and validate
     * if it actually JSON.
     */
    function Json(context) {
        Util.extend(this, EventHooks);

        var id,
            url,
            json;

        this.load = function(properties) {

            id = properties.id;
            url = properties.url;
            
            var self = this;
            var request = new XMLHttpRequest();
            request.open('GET', url, true);

            request.onload = function() {
                if (request.status >= 200 && request.status < 400) {
                    json = JSON.parse(request.responseText);
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
        };

        this.isLoaded = function() {
            return typeof json === 'object';
        };

        this.getId = function() {
            return id;
        };

        this.getJson = function() {
            return json;
        };
    }

    return Json;
});
