
"use strict";

function SoundResource() {}
SoundResource.prototype = new Resource();

SoundResource.prototype.load = function(properties) {

	this.id = properties.id;
	this.url = properties.url;
	
	var self = this;

	var request = new XMLHttpRequest();
	
	request.open('GET', properties.url, true);
	request.responseType = 'arraybuffer';
	
	// Decode asynchronously
	request.onload = function() {
	
		var context = fro.audio.getAudioContext();
		if (context) {
			
			context.decodeAudioData(request.response, function(buffer) {

				self.buffer = buffer;
				self.fire('onload', self);
				
			}, function() {
				self.fire('onerror', self);
			});
			
		} else {
			self.fire('onerror', self);
		}
		
	};
	
	// hook an error handler for network errors
	request.onerror = function() { 
		self.fire('onerror', self);
	}
	
	request.send();
}

SoundResource.prototype.isLoaded = function() {

	if (!this.buffer) {
		return false;
	}
	
	return true;
}

SoundResource.prototype.getBuffer = function() {
	return this.buffer;
}

