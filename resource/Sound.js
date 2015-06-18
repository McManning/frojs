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

