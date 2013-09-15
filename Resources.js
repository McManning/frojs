/*
	New resource manager, revision ... 3?
*/


"use strict";

fro.resources = $.extend({

	// Mapping type strings to class names
	resourceTypes : {
		"texture" : "TextureResource",
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
		
		for (var i in json) {
			this._preloadResource(json[i]);
		}
		// @todo optional preload logic?
		
		return this;
	},
	
	_preloadResource : function(json) {
		this.totalPreload++;
		
		var self = this;
		this.load(json)
			.bind('onload', function preloadLoad() {
			
				self.completedPreload++;
				self.fire('preload.status', this);
				
				// If this was the last resource to download, fire a complete event
				if (self.completedPreload == fro.resources.totalPreload) {
					self.fire('preload.complete');
				}
			})
			.bind('onerror', function preloadError() {
				self.failedResources[i] = json[i];
				self.fire('preload.error', this);
			});
	},

	load : function(jsonOrID) {
		
		// load("resource_id")
		if (typeof jsonOrID == 'string') {
			if (jsonOrID in this.loadedResources) {
				console.log('Loading from cache ' + jsonOrID);
				return this.loadedResources[jsonOrID];
			}
		}
		
		// otherwise, it's JSON
		
		// Validate JSON properties
		if (!('id' in jsonOrID) || !('type' in jsonOrID)) {
			throw new Error('Invalid resource JSON');
		}
		
		var id = jsonOrID.id;
		var type = jsonOrID.type;
		
		// We can't re-define a resource that exists already
		if (id in this.loadedResources) {
			throw new Error('Resource ' + id + ' already exists');
		}
		
		console.log('Loading new resource ' + id);

		if (!(type in this.resourceLoader)) {
			this.failedResources[id] = jsonOrID;
			throw new Error('Cannot load ' + id + '. No loader for type ' + type);
		}

		var resourceClass = this.resourceLoader[type];
		var resource = new window[resourceClass]();
		
		this.loadedResources[id] = resource;
		resource.load(jsonOrID);
		
		return resource;
	}
	
}, EventHooks);

