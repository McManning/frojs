
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

