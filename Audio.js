
"use strict";

fro.audio = $.extend({
	
	context : null,
	
	initialise : function(options) {
	
		var context;
	
		try {
			// Fix up for prefixing
			window.AudioContext = window.AudioContext||window.webkitAudioContext;
			context = new AudioContext();
		}
		catch(e) {
			throw 'Web Audio API is not supported in this browser';
		}
		
		if (!context.createGain)
			context.createGain = context.createGainNode;
			
		this.audioGainNode = context.createGain();
		this.audioGainNode.connect(context.destination);
		
		this.ambientGainNode = context.createGain();
		this.ambientGainNode.connect(this.audioGainNode);
		
		this.context = context;
	},
	
	getAudioContext : function() {
		return this.context;
	},
	
	setMasterVolume : function(volume) {
		
		if (volume > 1.0)
			volume = 1.0;
			
		// Using an x-squared curve since simple linear (x) 
		// does not sound as good (via html5rocks.com)
		this.audioGainNode.gain.value = volume * volume;
		
		this.fire('setmaster', volume);
	},
	
	getMasterVolume : function() {
	
		// @todo math is wrong, not the same as setVolume
		return this.audioGainNode.gain.value;
	},
	
	setAmbientVolume : function(volume) {
		
		if (volume > 1.0)
			volume = 1.0;
			
		// Using an x-squared curve since simple linear (x) 
		// does not sound as good (via html5rocks.com)
		this.ambientGainNode.gain.value = volume * volume;
		
		this.fire('setambient', volume);
	},
	
	getAmbientVolume : function(volume) {
		
		// @todo math
		return this.ambientGainNode.gain.value;
	},
	
	addConnection : function(source, ambient) {
		
		if (ambient) {
			source.connect(this.ambientGainNode);
		} else { // connect directly to master
			source.connect(this.audioGainNode);
		}
	},
	
	play : function(source) {

		source.start(0);
	},
	
	stop : function(source) {
	
		source.stop(0);
	}
	
}, EventHooks);

/*
	Instead of a central manager, we'll have audio objects that we can move
	around, and a central reference for the context and global audio nonsense.
	We'll use resource loader to generate the audio objects, which can then be
	played on their own, using the settings in fro.audio.
	
	fro.audio should then be able to add new loader methods to the resource
	loader, which means we should have some sort of plugin interface for the
	resource loader...
	
	Why aren't timers objects too? Instead of reference numbers?
	
	Let's make map audio actual map objects. That would be a LOT fucking neater.
	There could be a global audio option, loop option, positional audio option, etc.
	
	DO IT. FUCKING DO IT! WOOOH!
	That way we can finally use the non-renderable entities listing
	
	fro.sound can manage audio globals, maybe playback and mixing?
	
*/

