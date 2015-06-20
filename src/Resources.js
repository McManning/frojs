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

    function Resources(options) {
        Util.extend(this, EventHooks); // Allow events to be fired from resource manager

        // Mapping type strings to class names
        var resourceTypes = {
            'image': 'ImageResource',
            'sound': 'SoundResource',
            'json': 'JsonResource',
            'shader': 'ShaderResource'
        };

        var loadedResources = [],
            failedResources = [],
            // Canvas used for generating temporary texture sources
            // TODO: Do we still want this? We lose any type of asyncronous support
            // if resources have to wait on a canvas element to work.
            scratchCanvas = document.createElement('canvas'),
            totalPreload = 0,
            completedPreload = 0;

        this.preload = function(json) {
            totalPreload = 0;
            completedPreload = 0;
            
            if ('required' in json) {
                totalPreload += json.required.length;

                for (var i in json.required) {
                    this._preloadResource(json.required[i]);
                }
            }
            
            // TODO: Support optional preloads 
            return this;
        };
        
        this.isPreloadComplete = function() {
            return totalPreload === completedPreload;
        };
        
        this._preloadResource = function(json) {

            var resource = this.load(json);
            if (resource.isLoaded()) {
                // Download was already complete
                completedPreload++;
                this.fire('preload.status', resource);
                
                // If this was the last resource to download, fire a complete event
                if (completedPreload === totalPreload) {
                    this.fire('preload.complete');
                }
            
            } else {
                // Need to wait further for the download to complete
                var self = this;
                resource
                    .bind('onload', function() {
                        self.completedPreload++;
                        self.fire('preload.status', this);
                        
                        // If this was the last resource to download, fire a complete event
                        if (self.completedPreload === self.totalPreload) {
                            self.fire('preload.complete');
                        }
                    })
                    .bind('onerror', function() {
                        self.failedResources[i] = json[i];
                        self.fire('preload.error', this);
                    });
            }
        };
            
        this.isLoaded = function(id) {
            return (id in loadedResources);
        };

        this.load = function(jsonOrId) {
            
            // load("resource_id")
            if (typeof jsonOrId === 'string') {
                if (jsonOrId in loadedResources) {
                    //fro.log.debug('Loading from cache ' + jsonOrId);
                    return loadedResources[jsonOrId];
                } else {
                    throw new Error('Resource [' + jsonOrId + '] has not been cached.');
                }
            }
            
            // otherwise, assume JSON
            // TODO: Support more interesting loaders (like functions)
            
            // Validate JSON properties
            // TODO: Better validators
            if (!('id' in jsonOrId)) {
                throw new Error('JSON resource is missing required attribute [id]: ' + JSON.stringify(jsonOrId));
            }

            if (!('type' in jsonOrId)) {
                throw new Error('JSON resource is missing required attribute [type]: ' + JSON.stringify(jsonOrId));
            }
            
            var id = jsonOrId.id;
            var type = jsonOrId.type;
            
            // We can't re-define a resource that exists already.
            // TODO: Decide if we should provide the original instead, or continue to fail. 
            if (id in loadedResources) {
                throw new Error('Attempted to load JSON resource with existing ID [' + id + ']');
            }
            
            //fro.log.debug('Loading new resource ' + id);

            if (!(type in resourceTypes)) {
                failedResources[id] = jsonOrId;
                throw new Error('Cannot load [' + id + ']. No loader for type [' + type + ']');
            }

            var resourceClass = resourceTypes[type];

            // TODO: Redefine how this resource is created. This doesn't work all too well.
            // We need a better way to connect loaders. 
            var resource = new window[resourceClass]();
            
            loadedResources[id] = resource;
            resource.load(jsonOrId);
            
            return resource;
        };
    }

    return Resources;
});

