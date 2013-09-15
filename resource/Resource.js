
"use strict";

function Resource() {
	$.extend(this, EventHooks);
}

Resource.prototype.load = function(id, url) {

}

Resource.prototype.isLoaded = function() {
	return false;
}
