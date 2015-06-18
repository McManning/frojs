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


function Player() {

	// generate collision rects
	this.feet = rect.create([-8, 0, 16, 16]);
	this.left = rect.create([-16, 16, 16, 64-16-8]);
	this.right = rect.create([0, 16, 16, 64-16-8]);
	this.head = rect.create([-8, 64-8, 16, 8]);
	
	this.feetRect = new RenderableImage(this.feet[2], this.feet[3]);
	this.feetRect.color[0] = 1;
	this.feetRect.color[3] = 1;
	
	this.leftRect = new RenderableImage(this.left[2], this.left[3]);
	this.leftRect.color[1] = 1;
	this.leftRect.color[3] = 1;
	
	this.rightRect = new RenderableImage(this.right[2], this.right[3]);
	this.rightRect.color[2] = 1;
	this.rightRect.color[3] = 1;
	
	this.headRect = new RenderableImage(this.head[2], this.head[3]);
	this.headRect.color[0] = 1;
	this.headRect.color[2] = 1;
	this.headRect.color[3] = 1;
	
	this.position = vec3.create();
}

Player.prototype.render = function() {

	// draw collision rects

	this.feetRect.position[0] = this.feet[0] + this.feet[2] * 0.5 + this.position[0];
	this.feetRect.position[1] = this.feet[1] + this.feet[3] * 0.5 + this.position[1];
	this.feetRect.render();
	
	this.leftRect.position[0] = this.left[0] + this.left[2] * 0.5 + this.position[0];
	this.leftRect.position[1] = this.left[1] + this.left[3] * 0.5 + this.position[1];
	this.leftRect.render();
	
	this.rightRect.position[0] = this.right[0] + this.right[2] * 0.5 + this.position[0];
	this.rightRect.position[1] = this.right[1] + this.right[3] * 0.5 + this.position[1];
	this.rightRect.render();
	
	this.headRect.position[0] = this.head[0] + this.head[2] * 0.5 + this.position[0];
	this.headRect.position[1] = this.head[1] + this.head[3] * 0.5 + this.position[1];
	this.headRect.render();
	
}


function PlatformerTest() {
	
	this.inputInterval = window.setInterval(function() {
		FRO_Engine.editor.processInput();
	}, 50);
	
	
	FRO_Input.registerListener('mousedown', this, function(e) {
		this.onMouseDown(FRO_Input.getCursorPosition());
	});
	
	FRO_Input.registerListener('mouseup', this, function(e) {
		this.onMouseUp(FRO_Input.getCursorPosition());
	});
	
	FRO_Input.registerListener('keyup', this, function(e) {
		this.onKeyUp(e.keyCode);
	});
	
	FRO_Input.registerListener('keydown', this, function(e) {
		this.onKeyDown(e.keyCode);
	});
	
	this.collisions = new Array();

	window.setInterval(function() {
		FRO_Engine.editor.think();
	}, 50);

	this.avy = new Player(); //RenderableImage(32, 64);
	//this.avy.loadTexture('img/avy.png');
	//this.avy.offset[1] = 32;
	
	this.avy.accel = vec3.create();
	
	this.targetRect = new RenderableBox();
	this.targetRect.setLineWidth(7);
	this.targetRect.setStyle('img/line2.png');
	
	this.fly = false;
}


/**
 * @param vec3 pos Mouse position in canvas coordinates (Where topleft = 0,0)
 */
PlatformerTest.prototype.onMouseDown = function(pos) {

	// Convert pos to world coordinates
	var p = FRO_Camera.canvasVec3ToWorld(pos);

	this.lineStart = p;
	
/*	this.currentLine = new RenderableLine();
	this.currentLine.setStyle('img/line.png');
	this.currentLine.setWidth(33);
	this.currentLine.setStart(p[0], p[1]);
	this.currentLine.setEnd(p[0], p[1]);
	*/

	this.rect = rect.create();
	this.rect[0] = p[0];
	this.rect[1] = p[1];
	this.rect[2] = 1;
	this.rect[3] = 1;
	
	this.currentRect = new RenderableBox();
	this.currentRect.setStyle('img/line.png');
	this.currentRect.setLineWidth(33);
	this.currentRect.setRect(this.rect);
}

/**
 * @param vec3 pos Mouse position in canvas coordinates (Where topleft = 0,0)
 */
PlatformerTest.prototype.onMouseUp = function(pos) {

	// Convert pos to world coordinates
	var p = FRO_Camera.canvasVec3ToWorld(pos);
	
	if (this.currentRect) {
	
		//this.currentLine.setEnd(p[0], p[1]);

		// Add line to the list
		if (this.rect[2] > 1 && this.rect[3] > 1)
			this.collisions.push(this.currentRect);
			
		this.currentRect = undefined;
	}
	
	this.currentLine = undefined;
}

PlatformerTest.prototype.onKeyDown = function(keycode) {

	switch (keycode) {

		default: break;
	}
}

PlatformerTest.prototype.onKeyUp = function(keycode) {

	switch (keycode) {
		case KeyEvent.DOM_VK_T: 
		
			var p = FRO_Camera.canvasVec3ToWorld(FRO_Input.getCursorPosition());
			this.avy.position[0] = p[0];
			this.avy.position[1] = p[1];
			this.avy.accel[0] = 0;
			this.avy.accel[1] = 0;
			break;
			
		case KeyEvent.DOM_VK_F:
			this.fly = !this.fly;
			break;
		default: break;
	}
}

PlatformerTest.prototype.processInput = function() {


	// update line end
	if (this.currentRect) {
		
		var p = FRO_Camera.canvasVec3ToWorld(FRO_Input.getCursorPosition());

		if (p[0] < this.rect[0])
			this.rect[2] = 1;
		else
			this.rect[2] = p[0] - this.rect[0];
		
		if (p[1] < this.rect[1])
			this.rect[3] = 1;
		else
			this.rect[3] = p[1] - this.rect[1];

		this.currentRect.setRect(this.rect);
		
		//this.currentLine.setEnd(p[0], p[1]);
	}
}

PlatformerTest.prototype.think = function() {

	if (this.fly) {
		
		if (FRO_Input.isKeyDown(KeyEvent.DOM_VK_W))
			this.avy.accel[1] = 10;
		else if (FRO_Input.isKeyDown(KeyEvent.DOM_VK_S))
			this.avy.accel[1] = -10;
		else
			this.avy.accel[1] = 0;
			
		if (FRO_Input.isKeyDown(KeyEvent.DOM_VK_D))
			this.avy.accel[0] = 10;
		else if (FRO_Input.isKeyDown(KeyEvent.DOM_VK_A))
			this.avy.accel[0] = -10;
		else
			this.avy.accel[0] = 0;
	
	} else {
		
		if (FRO_Input.isKeyDown(KeyEvent.DOM_VK_W) && this.avy.accel[1] < 0)
			this.avy.accel[1] = 50;
		
		if (FRO_Input.isKeyDown(KeyEvent.DOM_VK_D))
			this.avy.accel[0] = 10;
		else if (FRO_Input.isKeyDown(KeyEvent.DOM_VK_A))
			this.avy.accel[0] = -10;
		else
			this.avy.accel[0] = 0;
	
		// gravitational acceleration
		this.avy.accel[1] -= 10;
		
		// temp clamp (fix these!)
		this.avy.accel[1] = Math.max(this.avy.accel[1], -50);
	}
	
	// character think
	var v = vec3.create(this.avy.accel);

	var newpos = vec3.create(this.avy.position);

	vec3.add(newpos, v);

	this.targetRect.setRect([newpos[0]-16, newpos[1], 32, 64]);
	
	if (newpos[1] < -240)
		newpos[1] = -240;
	
	// Collision test
	var ty = newpos[1];
	
	
	// Calculate desired positions of collision boxes 
	var left = rect.create(this.avy.left);
	left[0] += newpos[0];
	left[1] += newpos[1];
		
	var feet = rect.create(this.avy.feet);
	feet[0] += newpos[0];
	feet[1] += newpos[1];
		
	var right = rect.create(this.avy.right);
	right[0] += newpos[0];
	right[1] += newpos[1];
		
	var head = rect.create(this.avy.head);
	head[0] += newpos[0];
	head[1] += newpos[1];
	
	/*
	if (head[0] > this.avy.head[0])
		head[0] = this.avy.head[0];
		head[2] += this.avy.head[2];
	else
		todo
	*/
	
	var collidesLeft = false;
	var collidesRight = false;
	var collidesHead = false;
	var collidesFeet = false;

	console.log('-------');
	
	for (var index in this.collisions) {
		
		var col = this.collisions[index].bounds;
		
		// If the collision is to our left, ignore collidesRight
		if (col[0] + col[2] * 0.5 < newpos[0]) {
		
			collidesRight = false;
			collidesLeft = rect.intersects(col, left);
			
		} else { // Ignore collidesLeft and calculate right
			
			collidesLeft = false;
			collidesRight = rect.intersects(col, right);
		}
		
		// @todo, toggle these based on our velocity and other factors
		// (for "cloud" collisions)
		collidesHead = rect.intersects(col, head);
		collidesFeet = rect.intersects(col, feet);
		
		if (collidesHead || collidesFeet || collidesLeft || collidesRight)
			console.log(index + ': head(' + collidesHead + ') feet(' + collidesFeet
					+ ') left(' + collidesLeft + ') right(' + collidesRight + ')');
	}
	

	/*
		newpos = position + acceleration
		
		for all collisions
			if intersects newpos
				get y of interception @ avy's origin x
				
				// if it's above us
				if y > newpos.y
					slope.y = max(slope.y, y)
		
		
		if slope.y - newpos.y > threshold (too high up)
			do not move
		else
			newpos.y = slope.y
	*/
	
	// see if the newpos y is too high (a collision point is too high)
	//if (this.avy.position[1] - newpos[1] < 16)

	var canmove = true;
	
	// ty = 50
	// newpos = 23
	
	// pos = ty - 50 (if at terminal)
	

	// slope up
	if (ty > this.avy.position[1] && newpos[1] < ty) {
		
		// check for too steep a slope
		if (ty - this.avy.position[1] > 16)
			canmove = false;
		else
			newpos[1] = ty; // match slope.y
	}
	else
	{
		if (newpos[1] < ty)
			newpos[1] = ty;
	}
	
	if (canmove)
		this.avy.position = newpos;

}

// Given the line and an x point, returns the y point on the line
// (assuming the line is infinite length. Non-infinite testing should've come first)
PlatformerTest.prototype.getY = function(x, col) {
	
	// (y - y0) = m(x - x0)
	
	var dx = (col.end[0] - col.position[0]);
	
	// vertical line test
	if (dx == 0)
		return col.position[1];
		
	var m = (col.end[1] - col.position[1]) / dx;
	
	return m * (x - col.position[0]) + col.position[1];
}

PlatformerTest.prototype.collidesWith = function(pos, col) {
	
	var a_rectangleMinX = pos[0] - 16;
	var a_rectangleMinY = pos[1];
	var a_rectangleMaxX = a_rectangleMinX + 32;
	var a_rectangleMaxY = a_rectangleMinY + 64;
	
	//0 -304 32 -240
	//console.log(a_rectangleMinX + ', ' + a_rectangleMinY + ', ' + a_rectangleMaxX + ', ' + a_rectangleMaxY);
	
	var a_p1x = col.position[0];
	var a_p1y = col.position[1];
	var a_p2x = col.end[0];
	var a_p2y = col.end[1];
	
	// Find min and max X for the segment
    var minX = a_p1x;
    var maxX = a_p2x;

    if (a_p1x > a_p2x) {
		minX = a_p2x;
		maxX = a_p1x;
    }

    // Find the intersection of the segment's and rectangle's x-projections

    if (maxX > a_rectangleMaxX)
      maxX = a_rectangleMaxX;

    if (minX < a_rectangleMinX)
      minX = a_rectangleMinX;

    if (minX > maxX) // If their projections do not intersect return false
      return false;

    // Find corresponding min and max Y for min and max X we found before
    var minY = a_p1y;
    var maxY = a_p2y;

    var dx = a_p2x - a_p1x;

    if (Math.abs(dx) > 0.0000001) {
      var a = (a_p2y - a_p1y) / dx;
      var b = a_p1y - a * a_p1x;
      minY = a * minX + b;
      maxY = a * maxX + b;
    }

    if (minY > maxY) {
		var tmp = maxY;
		maxY = minY;
		minY = tmp;
    }

    // Find the intersection of the segment's and rectangle's y-projections

    if (maxY > a_rectangleMaxY)
		maxY = a_rectangleMaxY;
 
    if (minY < a_rectangleMinY)
		minY = a_rectangleMinY;

    if (minY > maxY) // If Y-projections do not intersect return false
		return false;

    return true;
}

PlatformerTest.prototype.render = function() {
	
	if (this.avy)
		this.avy.render();
	
	if (this.targetRect)
		this.targetRect.render();
	
	for (var index in this.collisions) {
		this.collisions[index].render();
	}
	
	if (this.currentLine)
		this.currentLine.render();
	
	if (this.currentRect)
		this.currentRect.render();

}




