
"use strict";

fro.camera = {

	followedEntity : false,
	_position : vec3.create(), /**< Our position would be the same as the canvas
									@todo type convert to rect? */
	zoom: 1.0, /**< Factor to zoom the viewport @todo disable for Canvas mode */
	_lastFollowedPosition : vec3.create(),
	_translation : vec3.create(),
	_bounds : rect.create(),
	
	initialise : function() {
		fro.log.notice('Starting fro.camera');

	},

	setupViewport : function() {
	
		this.update();
	
		if (fro.renderer.isWebGL()) {
	
			gl.viewport(0, 0, gl.viewportWidth, gl.viewportHeight);
			
			// set up projection matrix
			// @todo don't I only have to do this once? Or only when zoom changes?
			mat4.ortho(0, gl.viewportWidth * this.zoom, 0, gl.viewportHeight * this.zoom, 0.0, -100.0, gl.pMatrix);
			
			// set up model view matrix
			mat4.identity(gl.mvMatrix);
			
			// Translate origin away from our camera
			//var trans = vec3.create(this._position);
			//trans[0] *= -1;
			//trans[1] *= -1;
		
		} else {
			// @todo Canvas transformation reset and handling
			gl.setTransform(1, 0, 0, 1, 0, 0);
		}
		
		mat4.translate(gl.mvMatrix, this._translation);
		
		fro.renderer.clear();
	},
	
	setBounds : function(bounds) {
	
		rect.set(bounds, this._bounds);
	},
	
	/**
	 * Orders this camera to remain centered on a specific entity 
	 * (Entity is defined as any object with a getPosition() method)
	 */
	followEntity : function(entity) {
		
		if (typeof(entity.getPosition) == 'function') {
			this.followedEntity = entity;
			
		} else { 
			throw 'Invalid entity';
		}
	},

	/** Calculates the vector we need to translate the camera for rendering
	 * @return vec3
	 */
	updateTranslation : function() {
		
		var pos = this._position;
		
		// @see http://www.opengl.org/archives/resources/faq/technical/transformations.htm#tran0030
		// for explaination about the 0.375 correction
		this._translation[0] = gl.viewportWidth * this.zoom * 0.5 - pos[0]; //- 0.375; 
		this._translation[1] = gl.viewportHeight * this.zoom * 0.5 - pos[1]; // + 0.375;
	},

	/**
	 * Sets the center of this camera to the point defined
	 * and unsets getFollowedEntity()
	 */
	setCenter : function(x, y) {
		
		this.followedEntity = null;

		this._position[0] = x;
		this._position[1] = y;
		
		this.applyBounds();
		this.updateTranslation();
	},
	
	/**
	 * @return new vec3 object
	 */
	getCenter : function() {
	
		return this._position;
	},
	
	/**
	 * Updates the center of this camera to match the followed entity, if 
	 * the followed entity has moved since our last check
	 */
	update : function() {
		
		// If we're following an entity...
		if (this.followedEntity) {
		
			var epos = this.followedEntity.getPosition();
			
			// If the entity moved since last we checked, move the camera
			if (!vec3.equals(this._lastFollowedPosition, epos)) {
				
				vec3.set(epos, this._lastFollowedPosition);
		
				// Update camera position
				vec3.set(epos, this._position);
				
				//vec3.scale(this._position, this.zoom);
				
				this.applyBounds();
				
				this.updateTranslation();
			}
		}
	},
	
	/** 
	 * @return Entity reference, or null
	 */
	getFollowedEntity : function() {
		return this.followedEntity;
	},
	
	canvasVec3ToWorld : function(pos, result) {
		
		// @todo reduce these equations
		result[0] = (pos[0] - gl.viewportWidth * 0.5) * this.zoom + this._position[0];
		result[1] = (gl.viewportHeight - pos[1] - gl.viewportHeight * 0.5 ) * this.zoom + this._position[1];
		
	},

	/**
	 * Keeps camera position within the map bounds, if supplied
	 */
	applyBounds : function() {
		
		var pos = this._position;
	
		var bounds = this._bounds;
		
		if (bounds[0] != bounds[2] && bounds[1] != bounds[3]) {
		
			var w = gl.viewportWidth * this.zoom;
			var h = gl.viewportHeight * this.zoom;
			
			var x = pos[0] - w * 0.5;
			var y = pos[1] - h * 0.5;

			if (x < bounds[0])
				x = bounds[0];
			
			if (x + w >= bounds[2])
				x = bounds[2] - w;
			
			if (y < bounds[1])
				y = bounds[1];
				
			if (y + h >= bounds[3])
				y = bounds[3] - h;
				
			pos[0] = x + w * 0.5;
			pos[1] = y + h * 0.5;
		}
	},
	
};


