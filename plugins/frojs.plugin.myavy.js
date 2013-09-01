
;(function(fro, undefined) {

	// Specify default metadata to load in case of error,
	// or the user has no avatar to load
	var DEFAULT_AVATAR = {
		"id": "default_avatar",
		"url": "default_avatar",
		
		"version": 1,
		"format": "MG-PNG",
		"tags": "",
		"shared": false,
		"name": "",
		"width": 32,
		"height": 64,
		"keyframes": {
			"move_2": {
				"loop": false,
				"frames": [
					0,
					1000,
					1,
					1000
				]
			},
			"move_8": {
				"loop": false,
				"frames": [
					2,
					1000,
					3,
					1000
				]
			},
			"move_4": {
				"loop": false,
				"frames": [
					4,
					1000,
					5,
					1000
				]
			},
			"move_6": {
				"loop": false,
				"frames": [
					6,
					1000,
					7,
					1000
				]
			},
			"act_2": {
				"loop": false,
				"frames": [
					8,
					1000,
					9,
					1000
				]
			}
		}
	};

	function _getUrl(id) {
		return 'http://myavy.net/' + id.substr(8);
	}
	
	function _onError(entity, id, error) {
		
		// kill loader entity
		// notify system (if local, or debugging)
		
	}
	
	function _onReady(entity, id, avatar) {
		
		// kill loader entity
		
		// Finally set as our entity's avatar
		entity.applyAvatar(avatar);
	}
	
	function _onMetadata(entity, id, metadata) {
		
		var avatar = new Avatar();
		
		// Bind the new avatar ready/error events to notify this plugin
		avatar.bind('ready', function() {
		
			_onReady(entity, id, this);
		})
		.bind('error', function(error) {
			
			_onError(entity, id, error);
		});
		
		// Load the metadata into the avatar and let it take over
		avatar.load(metadata);
	}
	
	function _setAvatar(entity, url) {
		if (url.toString().indexOf('myavy.net') >= 0 
			|| url.toString().indexOf('localhost') >= 0) {
			
			// @todo attach a loader entity
			
			// Retrieve metadata from our source URL
			$.ajax({
				url: url, //_getUrl(id),
				dataType: 'jsonp',
				timeout: 5000,
				success: function(data) {
					_onMetadata(entity, url, data);
				},
				error: function(xhr, status, error) {
					// Either json parsing failed, or the server
					// refused to respond to the request
					_onError(entity, url, error);
				}
			});

		} else if (url == 'default') {
			// Also handle requests for the default avatar
			// (@todo this should actually be an internal
			// plugin that deals with "unknown" urls)
			
			// Skip metadata load process and use the embedded object
			_onMetadata(entity, url, DEFAULT_AVATAR);
		}
	}
	
	fro.plugins.myavy = {
		
		/*options : {
			
		},*/
		
		initialise : function(options) {
			
			//options = $.extend(this.options, options);
			
			fro.world.bind('new.entity', function(entity) {
				
				if (entity instanceof Map_Actor) {
					entity.bind('avatar.set', function(id) {
						_setAvatar(this, id);
					});
				}
			});
		},
		
		preload : function() {
			
			return [
				'/frojs/resources/img/avatar_loader.png'
			];
		}
		
	};
	
})(fro);
