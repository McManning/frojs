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


/**
 * @param rect r Starting rectangle of this rectangle
 */
function CollisionRectangle(r) {

    // De-float any collision rectangles
    for (var i in r)
        r[i] = Math.floor(r[i]);

    this.box = new RenderableBox();
    this.box.setStyle('img/line.png');
    this.box.setLineWidth(13);
    this.box.setRect(r);
    
    this.anchor = new RenderableImage(28, 28);
    this.activeAnchor = new RenderableImage(28, 28);
    
    // @todo all these images could be shared, if we had a way
    // to designate specific locations to render images and with references
    // and whatnot. ]:<
    this.anchor.loadTexture('img/glyphish-free/13-target.png');
    this.activeAnchor.loadTexture('img/glyphish-free/19-gear.png');
    
    this.anchor.position[0] = r[0] + r[2];
    this.anchor.position[1] = r[1] + r[3];
    vec3.set(this.anchor.position, this.activeAnchor.position);
    
    this.selected = false;
    this.resizing = false;
}

/**
 * Moves the collision rectangle, but maintains dimensions (only changes x,y)
 *
 * @param vec3 pos
 */
CollisionRectangle.prototype.setStart = function(pos) {

    var r = rect.create(this.box.bounds);
    r[0] = Math.floor(pos[0]);
    r[1] = Math.floor(pos[1]);
    
    this.box.setRect(r);
    
    // Move the two anchors to the bottom right corner
    this.anchor.position[0] = r[0] + r[2];
    this.anchor.position[1] = r[1] + r[3];
    vec3.set(this.anchor.position, this.activeAnchor.position);
}

/**
 * Changes dimensions of the collision rectangle by specifying a new endpoint,
 * and maintaining the same (x,y) origin point
 *
 * @param vec3 pos
 */
CollisionRectangle.prototype.setEnd = function(pos) {
    
    for (var i in pos)
        pos[i] = Math.floor(pos[i]);
    
    vec3.set(pos, this.anchor.position);
    
    var r = rect.create(this.box.bounds);
    
    if (r[0] < pos[0])
        r[2] = pos[0] - r[0];
    else // ignore? @todo
        r[2] = r[2];
        
    if (r[1] < pos[1])
        r[3] = pos[1] - r[1];
    else
        r[3] = r[3]; // @todo again
    
    this.box.setRect(r);
    
    // Move the two anchors to the bottom right corner
    this.anchor.position[0] = r[0] + r[2];
    this.anchor.position[1] = r[1] + r[3];
    vec3.set(this.anchor.position, this.activeAnchor.position);
}

/**
 * @return boolean
 */
CollisionRectangle.prototype.anchorIntersects = function(pos) {
    
    // lazily do a distance check for now
    var d = vec3.create(this.anchor.position);
    vec3.subtract(d, pos);
    
    return (vec3.length(d) < 12);
}

CollisionRectangle.prototype.render = function() {

    this.box.render();
    
    if (this.selected)
        this.activeAnchor.render();
    else
        this.anchor.render();
}

