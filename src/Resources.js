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
    'resource/Shader',
    'resource/FontImage',
    'resource/Animation'
], function(EventHooks, Util, Image, Sound, Json, Shader, FontImage, Animation) {

    // TODO: Rewrite a lot of this. I don't like the error list, I don't like how
    // the error handling works in general, etc. This can be a lot simpler, and a lot
    // more elegant to use. 

    function Resources(context) {
        Util.extend(this, EventHooks); // Allow events to be fired from resource manager

        // Mapping type strings to class names
        this.resourceTypes = {
            'image': Image,
            'sound': Sound,
            'json': Json,
            'shader': Shader,
            'text': FontImage,
            'animation': Animation
        };

        this.context = context;
        this.loaded = {};
        this.failed = {};
        // Canvas used for generating temporary texture sources
        // TODO: Do we still want this? We lose any type of asyncronous support
        // if resources have to wait on a canvas element to work.
        //scratchCanvas = document.createElement('canvas'),
        this.totalPreload = 0;
        this.completedPreload = 0;

        // Bind callbacks to this instance
        this.onPreloadResourceComplete = this.onPreloadResourceComplete.bind(this);
        this.onPreloadResourceError = this.onPreloadResourceError.bind(this);
    }

    Resources.prototype.preload = function(json) {
        this.totalPreload = 0;
        this.completedPreload = 0;
        
        if (json.hasOwnProperty('required')) {
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
            this.onPreloadResourceComplete(resource);
        } else {
            // Need to wait further for downloads/processing to complete
            resource
                .bind('onload', this.onPreloadResourceComplete)
                .bind('onerror', this.onPreloadResourceError);
        }
    };

    Resources.prototype.onPreloadResourceComplete = function(resource) {
        this.completedPreload++;
        this.fire('preload.status', resource);
        
        // If this was the last resource to download, fire a complete event
        if (this.completedPreload === this.totalPreload) {
            this.fire('preload.complete');
        }
    };

    Resources.prototype.onPreloadResourceError = function(resource) {
        // TODO: this.load() also adds it to this.loaded even though
        // it technically wasn't loaded. Re-evaluate this logic for failure
        // handling. 
        this.failed[resource._resourceId] = resource;
        this.fire('preload.error', resource);
    };
    
    Resources.prototype.isLoaded = function(id) {
        return this.loaded.hasOwnProperty(id);
    };

    /**
     * Load a resource by JSON definition. If the JSON definition matches
     * a previously loaded resource, this will immediately return a
     * reference to the old resource. If the returned resource's 
     * isLoaded() method returns true, it can be used immediately. Otherwise
     * the implementer must bind to it's 'onload' and 'onerror' events and
     * wait until it has been fully loaded.
     */
    Resources.prototype.load = function(json) {
        
        // Validate JSON properties
        // TODO: Better validators
        if (!json.hasOwnProperty('type')) {
            throw new Error(
                'JSON resource is missing required attribute [type]: ' + 
                JSON.stringify(json)
            );
        }

        // Generate a unique ID from a hash of the JSON
        var id = Util.hash(JSON.stringify(json));
        var type = json.type;
        
        if (!this.resourceTypes.hasOwnProperty(type)) {
            this.failed[id] = json;
            throw new Error(
                'Cannot load [' + id + ']. No loader for type [' + 
                type + ']'
            );
        }

        console.log(this.resourceTypes[type].shareable);

        var shareable = this.resourceTypes[type].shareable;

        // If the resource can be shared between instances, and we already have it
        // loaded, just return the original resource.
        if (shareable && this.loaded.hasOwnProperty(id)) {
            return this.loaded[id];
        }

        var resource = new this.resourceTypes[type](this.context, json);
        resource._resourceId = id;

        // If we can share it between instances, cache the results.
        if (shareable) {
            this.loaded[id] = resource;
        }
        
        return resource;
    };

    return Resources;
});
