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
    'Utility',
    'resource/Image',
    'resource/Sound',
    'resource/Json',
    'resource/Shader'
], function(EventHooks, Util, Image, Sound, Json, Shader) {

    function Resources(context) {
        Util.extend(this, EventHooks); // Allow events to be fired from resource manager

        // Mapping type strings to class names
        this.resourceTypes = {
            'image': Image,
            'sound': Sound,
            'json': Json,
            'shader': Shader
        };

        this.context = context;
        this.loaded = [];
        this.failed = [];
        // Canvas used for generating temporary texture sources
        // TODO: Do we still want this? We lose any type of asyncronous support
        // if resources have to wait on a canvas element to work.
        //scratchCanvas = document.createElement('canvas'),
        this.totalPreload = 0;
        this.completedPreload = 0;
    }

    Resources.prototype.preload = function(json) {
        this.totalPreload = 0;
        this.completedPreload = 0;
        
        if ('required' in json) {
            this.totalPreload += json.required.length;

            for (var i = 0; i < json.required.length; i++) {
                this._preloadResource(json.required[i]);
            }
        }
        
        // TODO: Support optional preloads 
        return this;
    };
    
    Resources.prototype.isPreloadComplete = function() {
        return this.totalPreload === this.completedPreload;
    };
    
    Resources.prototype._preloadResource = function(json) {

        var resource = this.load(json);
        if (resource.isLoaded()) {
            // Download was already complete
            this.completedPreload++;
            this.fire('preload.status', resource);
            
            // If this was the last resource to download, fire a complete event
            if (this.completedPreload === this.totalPreload) {
                this.fire('preload.complete');
            }
        
        } else {
            // Need to wait further for the download to complete
            var self = this;
            resource
                .bind('onload', function() {
                    self.this.completedPreload++;
                    self.fire('preload.status', this);
                    
                    // If this was the last resource to download, fire a complete event
                    if (self.this.completedPreload === self.this.totalPreload) {
                        self.fire('preload.complete');
                    }
                })
                .bind('onerror', function() {
                    // TODO: this.load() also adds it to this.loaded even though
                    // it technically wasn't loaded. Re-evaluate this logic for failure
                    // handling. 
                    self.this.failed[this.id] = this;
                    self.fire('preload.error', this);
                });
        }
    };
        
    Resources.prototype.isLoaded = function(id) {
        return (id in this.loaded);
    };

    Resources.prototype.load = function(jsonOrId) {
        
        // load("resource_id")
        if (typeof jsonOrId === 'string') {
            if (jsonOrId in this.loaded) {
                //fro.log.debug('Loading from cache ' + jsonOrId);
                return this.loaded[jsonOrId];
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
        
        // If it already exists, just return the existing resource 
        if (id in this.loaded) {
            if (this.loaded[id].type !== type) {
                throw new Error(
                    'Type mismatch: Trying to load resource [' + id + 
                    '] as [' + type + '] but already instanced as [' + 
                    this.loaded[id].type + ']'
                );
            }
            return this.loaded[id];
        }
        
        //fro.log.debug('Loading new resource ' + id);

        if (!(type in this.resourceTypes)) {
            this.failed[id] = jsonOrId;
            throw new Error('Cannot load [' + id + ']. No loader for type [' + type + ']');
        }

        var resource = new this.resourceTypes[type](this.context, jsonOrId);            
        this.loaded[id] = resource;
        
        return resource;
    };

    return Resources;
});
