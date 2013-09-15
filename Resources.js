/*
	New resource manager, revision ... 3?
*/


"use strict";

fro.resources = $.extend({

	// Mapping type strings to class names
	resourceTypes : {
		"image" : "ImageResource",
		"sound" : "SoundResource",
		"json" : "JsonResource",
		"shader" : "ShaderResource",
	},

	initialise : function() {
		
		this.loadedResources = new Array();
		this.failedResources = new Array(); // Tracking of all resources failing download
		
		// Canvas used for generating temporary texture sources
		this.scratchCanvas = document.createElement('canvas');
	},
	
	preload : function(json) {

		this.totalPreload = 0;
		this.completedPreload = 0;
		
		this.totalPreload += json.required.length;
		
		for (var i in json.required) {
			this._preloadResource(json.required[i]);
		}
		// @todo optional preload logic?
		
		return this;
	},
	
	isPreloadComplete : function() {
		return this.totalPreload == this.completedPreload;
	},
	
	_preloadResource : function(json) {

		var self = this;
		
		var resource = this.load(json);
		
		if (resource.isLoaded()) { // already done
			
			this.completedPreload++;
			this.fire('preload.status', resource);
			
			// If this was the last resource to download, fire a complete event
			if (this.completedPreload == this.totalPreload) {
				this.fire('preload.complete');
			}
		
		} else { // wait for it to finish
					
			resource.bind('onload', function preloadLoad() {
				
					self.completedPreload++;
					self.fire('preload.status', this);
					
					// If this was the last resource to download, fire a complete event
					if (self.completedPreload == self.totalPreload) {
						self.fire('preload.complete');
					}
				})
				.bind('onerror', function preloadError() {
					self.failedResources[i] = json[i];
					self.fire('preload.error', this);
				});
		}

	},

	load : function(jsonOrID) {
		
		// load("resource_id")
		if (typeof jsonOrID == 'string') {
			if (jsonOrID in this.loadedResources) {
				console.log('Loading from cache ' + jsonOrID);
				return this.loadedResources[jsonOrID];
			} else {
				throw new Error('Resource ' + jsonOrID + ' not loaded');
			}
		}
		
		// otherwise, it's JSON
		
		// Validate JSON properties
		if (!('id' in jsonOrID) || !('type' in jsonOrID)) {
			throw new Error('Invalid resource JSON: ' + JSON.stringify(jsonOrID));
		}
		
		var id = jsonOrID.id;
		var type = jsonOrID.type;
		
		// We can't re-define a resource that exists already
		if (id in this.loadedResources) {
			throw new Error('Resource ' + id + ' already exists');
		}
		
		console.log('Loading new resource ' + id);

		if (!(type in this.resourceTypes)) {
			this.failedResources[id] = jsonOrID;
			throw new Error('Cannot load ' + id + '. No loader for type ' + type);
		}

		var resourceClass = this.resourceTypes[type];
		var resource = new window[resourceClass]();
		
		this.loadedResources[id] = resource;
		resource.load(jsonOrID);
		
		return resource;
	}
	
}, EventHooks);

