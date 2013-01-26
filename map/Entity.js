
"use strict";

/** Base class for all objects on a map */
function Map_Entity() {

}

/**
 * @return bool 
 */
Map_Entity.prototype.collides = function(r) {
	return false;
}

/**
 * @param rect r
 */
Map_Entity.prototype.getBoundingBox = function(r) {
	
}
