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
     * Base model for all resources
     */
    function Resource(context, properties) {
        Util.extend(this, EventHooks);

        if (!this.validateMetadata(properties)) {
            // TODO: better error handling
            throw new Error('Malformed resource metadata');
        }

        this.shareable = true;
        this.context = context;
    }

    /**
     * Returns true if the resource has fully loaded.
     *
     * @return {boolean}
     */
    Resource.prototype.isLoaded = function() {
        throw Error('Method must be implemented by an inherited resource type.');
    };

    /**
     * Returns whether the input metadata schema is acceptable. 
     *
     * @param {Object} metadata
     *
     * @return {boolean}
     */
    Resource.prototype.validateMetadata = function(metadata) {
        // jshint unused: false
        throw Error('Method must be implemetned by an inherited resource type.');
    };

    return Resource;
});
