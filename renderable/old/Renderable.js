
"use strict";

/**
 * Base class for renderable primitives
 */
function Renderable() {
	this.rotation = 0.0;
	this.scale = 1.0;
	this.useSrcAlpha = false;
	this.useAlphaKey = false; // if true, the topleft pixel will be used for pixel discard testing
	
	this.width = 0;
	this.height = 0;
	
	// These objects are shared among all instances,
	// must be initialized in inherited classes
	//this.HSVShift = vec3.create();
	//this.position = vec3.create();
	//this.color = [0.0, 0.0, 0.0, 0.0]; // @todo vec4 or something
}

Renderable.prototype.beginDraw = function() {

	gl.mvPushMatrix();

	mat4.translate(gl.mvMatrix, this.getCenter());
	
	if (this.rotation != 0.0) {
		mat4.rotateZ(gl.mvMatrix, this.rotation);
	}

	// offset from origin would be here
	
	/*
		From http://en.wikipedia.org/wiki/Alpha_compositing#Alpha_blending
		outA = srcA + dstA(1 - srcA)
		outRGB = srcRGB(srcA) + dstRGB*dstA(1 - srcA)
		
		Orgb = srgb * Srgb + drgb * Drgb
		Oa = sa * Sa + da * Da
		glBlendFuncSeparate(srgb, drgb, sa, da)
	*/
	
	//if (this.useSrcAlpha) {
		gl.enable(gl.BLEND);
		gl.blendFuncSeparate(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA, gl.ONE, gl.ONE_MINUS_SRC_ALPHA);
	//} else {
	//	gl.disable(gl.BLEND);
	//}
	
	gl.uniform1i(fro.shaderProgram.alphaKeyUniform, this.useAlphaKey);
	
	gl.uniform4f(fro.shaderProgram.colorUniform, 
				this.color[0], this.color[1],
				this.color[2], this.color[3]);
				
				
	//console.log(this.HSVShift[0] + " " + this.position[0]);
	gl.uniform3f(fro.shaderProgram.HSVShiftUniform, 
				this.HSVShift[0], this.HSVShift[1], 
				this.HSVShift[2]);
	
}

Renderable.prototype.endDraw = function() {

	gl.mvPopMatrix();
}

/**
 * Determines if this renderable intersects a given point and takes in account
 * rotation/scaling/etc. 
 * @param pos vec3 world coordinate to test
 * @return true if pos is within our rectangle, false otherwise
 */
Renderable.prototype.intersectsBoundingBox = function(pos) {
	
	var dp = vec3.create(pos);
	vec3.subtract(dp, this.position);
	
	//this.localizePoint(dp);

	if (this.rotation != 0.0) {

		// rotate the test point in the opposite direction
		var c = Math.cos(-this.rotation);
		var s = Math.sin(-this.rotation);
		
		var r = vec3.create(dp);
		r[0] = dp[0] * c - dp[1] * s;
		r[1] = dp[0] * s + dp[1] * c;
		vec3.set(r, dp);
	}
	
	var w = this.width * this.scale * 0.5;
	var h = this.height * this.scale * 0.5;

	return (dp[0] >= -w && dp[0] <= w 
			&& dp[1] >= -h && dp[1] <= h);
}

/**
 * Calculates the top right corner of our box, factoring in scale and rotation
 * @return vec3 position of the top right point of our box
 */
Renderable.prototype.getTopRight = function() {

	var p = vec3.create();
	p[0] = this.width * 0.5;
	p[1] = this.height * 0.5;

	this.localizePoint(p);

	return p;
}

Renderable.prototype.getTopLeft = function() {

	var p = vec3.create();
	p[0] = -this.width * 0.5;
	p[1] = this.height * 0.5;

	this.localizePoint(p);

	return p;
}

Renderable.prototype.getBottomRight = function() {
	
	var p = vec3.create();
	p[0] = this.width * 0.5;
	p[1] = -this.height * 0.5;

	this.localizePoint(p);

	return p;
}

Renderable.prototype.getBottomLeft = function()  {
	
	var p = vec3.create();
	p[0] = -this.width * 0.5;
	p[1] = -this.height * 0.5;
	
	this.localizePoint(p);
	return p;
}

/**
 * Will apply this Renderable's translation/scale to the supplied vec3
 * @param pos vec3 point relative to the center of the Renderable
 * @return pos
 */
Renderable.prototype.localizePoint = function(pos) {

	var x = pos[0] * this.scale;
	var y = pos[1] * this.scale;
	var r = this.rotation;
	
	if (r != 0.0) {
		var c = Math.cos(r);
		var s = Math.sin(r);
		pos[0] = x * c - y * s;
		pos[1] = x * s + y * c;
	} else {
		pos[0] = x;
		pos[1] = y;
	}
	
	return pos;
}

Renderable.prototype.getCenter = function() {
	return this.position;
}

