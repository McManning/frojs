
"use strict";

fro.audio = $.extend({
	
	context : null,
	
	initialise : function(options) {
	
		var context;
	
		try {
			// Fix up for prefixing
			window.AudioContext = window.AudioContext||window.webkitAudioContext;
			
			if (window.AudioContext) {
				context = new window.AudioContext();
			}
		} catch(e) {
			fro.log.error('[fro.audio] Failed to initialise AudioContext: ' + e);
		}
		
		if (!context) {
			alert('Web Audio API is not supported in this browser');
			return;
		}
		
		if (!context.createGain) {
			context.createGain = context.createGainNode;
		}
		
		this.audioGainNode = context.createGain();
		this.audioGainNode.connect(context.destination);
		
		this.ambientGainNode = context.createGain();
		this.ambientGainNode.connect(this.audioGainNode);
		
		this.context = context;
	},
	
	/** 
	 * Returns true if the audio API is available to use
	 */
	isAvailable : function() {
		return (this.context != null);
	},
	
	getAudioContext : function() {
		return this.context;
	},
	
	setMasterVolume : function(volume) {
		
		if (volume > 1.0) {
			volume = 1.0;
		}
		
		if (this.context && this.audioGainNode) {
			// Using an x-squared curve since simple linear (x) 
			// does not sound as good (via html5rocks.com)
			this.audioGainNode.gain.value = volume * volume;
			
			this.fire('setmaster', volume);
		}
	},
	
	getMasterVolume : function() {
	
		if (this.context && this.audioGainNode) {
			// @todo math is wrong, not the same as setVolume
			return this.audioGainNode.gain.value;
		} else {
			return 0;
		}
	},
	
	setAmbientVolume : function(volume) {
		
		if (volume > 1.0) {
			volume = 1.0;
		}
		
		if (this.context && this.ambientGainNode) {
			// Using an x-squared curve since simple linear (x) 
			// does not sound as good (via html5rocks.com)
			this.ambientGainNode.gain.value = volume * volume;
			
			this.fire('setambient', volume);
		}
	},
	
	getAmbientVolume : function(volume) {
		
		if (this.context && this.ambientGainNode) {
			// @todo math
			return this.ambientGainNode.gain.value;
		} else {
			return 0;
		}
	},
	
	addConnection : function(source, ambient) {
		
		if (this.context) {
			if (ambient) {
				source.connect(this.ambientGainNode);
			} else { // connect directly to master
				source.connect(this.audioGainNode);
			}
		}
	},
	
	play : function(source) {
		
		if (this.context) {
			source.start(0);
		}
	},
	
	stop : function(source) {
	
		if (this.context) {
			source.stop(0);
		}
	}
	
}, EventHooks);
