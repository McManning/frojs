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

function JsonResource() {}
JsonResource.prototype = new Resource();

JsonResource.prototype.load = function(json) {

	this.id = json.id;
	this.url = json.url;
	
	var self = this;
	$.ajax({
		url: json.url,
		dataType: 'json',
		success: function(data) {

			if (typeof data == 'string') {
				
				// decode as JSON
				try {
					self.json = JSON.parse(data);
				} catch (e) {
					fro.log.error(e);
					fro.log.error(data);
					self.fire('onerror', this);
					return;
				}
				
			} else {
				self.json = data;
			}
			
			self.fire('onload', this);
		},
		error: function(request, status, error) {
			fro.log.error(error);
			self.fire('onerror', this);
		}
	});
}

JsonResource.prototype.isLoaded = function() {

	return ('json' in this);
}

JsonResource.prototype.getJson = function() {
	return this.json;
}
