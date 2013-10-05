
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
					console.log(e);
					console.log(data);
					self.fire('onerror', this);
					return;
				}
				
			} else {
				self.json = data;
			}
			
			self.fire('onload', this);
		},
		error: function(request, status, error) {
			console.log(error);
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
