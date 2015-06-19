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

/*
    Two types of editors will be defined:
    
    Map Editor
        Spawn entities to place on the map. Can translate/scale/rotate/HSVshift
        these objects, along with giving them IDs and other unique-instance properties
        
    Object Editor
        Editing of a single object, giving it properties shared by all instances
        including resource files (images/scripts), dimensions, animations,
        and collision data. 
        
    Collision rectangle editing:
    - We have the ability to define multiple rectangles on the object that will be
        used for collision detection
    - By shift clicking empty space on the prop (not within an existing rectangle)
        you can start a new collision rectangle. The rectangle will resize as you 
        move the mouse until you click again to place. 
    - By clicking an existing rectangle, you select it
    - By pressing R while holding an existing rectangle, the endpoint will snap 
        to the mouse until the mouse is clicked to lock the new size
    
    Shift + Click somewhere to create a new collision rectangle.
        It'll be defined by a renderable rectangle, and an anchor image in
            the bottom right corner. 
    
    Click + dragging an anchor will resize the associated collision rectangle.
    Clicking an anchor will select it.
    Delete key will delete the selected anchor/rectangle.
    
*/

"use strict";

var PAN_SPEED = 32;

function PropEditor() {
    
    this.thinkInterval = window.setInterval(function() {
        if (fro._editor) {
            fro._editor.processInput();
            fro._editor.think();
        }
    }, 50);
    
    // JSON serializable properties map
    this.properties = {};
    
    fro.input
        .bind('mousedown', function(e) {
            fro._editor.onMouseDown(fro.input.getCursorPosition());
        })
        .bind('mouseup', function(e) {
            fro._editor.onMouseUp(fro.input.getCursorPosition());
        });
        
    this.__collisions = new Array();
    this.selectedCollision = null;
    this.movingSelected = false;
    
    this.canEditCollisions = false;
    
    fro.camera.updateTranslation();
}

/**
 * @param vec3 pos Mouse position in canvas coordinates (Where topleft = 0,0)
 */
PropEditor.prototype.onMouseDown = function(pos) {

    // Convert pos to world coordinates
    var r = vec3.create();
    fro.camera.canvasVec3ToWorld(pos, r);

    if (this.canEditCollisions) {
    
        var collision = this.getCollisionByAnchor(r);
        
        if (!collision) {
            // create a new one
            collision = new CollisionRectangle([r[0], r[1], 32, 32]);

            this.__collisions.push(collision);        
        } else {
            
            this.movingSelected = true;
        }

        // Set either the existing collision rect, or the new one as selected
        if (this.selectedCollision) {
            this.selectedCollision.selected = false;
        }
        
        this.selectedCollision = collision;
        collision.selected = true;
    }
}

/**
 * Retrieves a managed collision object with an anchor intersecting pos
 * 
 * @param vec3 pos
 *
 * @return CollisionRectangle|null
 */
PropEditor.prototype.getCollisionByAnchor = function(pos) {
    
    for (var index in this.__collisions) {
        
        if (this.__collisions[index].anchorIntersects(pos))
            return this.__collisions[index];
    }
    
    return null;
}

/**
 * @param vec3 pos Mouse position in canvas coordinates (Where topleft = 0,0)
 */
PropEditor.prototype.onMouseUp = function(pos) {

    // Convert pos to world coordinates
    var r = vec3.create();
    fro.camera.canvasVec3ToWorld(pos, r);
    
    if (this.selectedCollision)
        this.selectedCollision.resizing = false;
        
    this.movingSelected = false;
}

PropEditor.prototype.think = function() {
    
    // if we're resizing a collision rect, update dimensions
    if (this.canEditCollisions && this.selectedCollision) {
        
        var r = vec3.create();
        fro.camera.canvasVec3ToWorld(fro.input.getCursorPosition(), r);
        
        if (this.selectedCollision.resizing)
            this.selectedCollision.setEnd(r);
        else if (this.movingSelected) {
            
            // Offset by the anchor
            r[0] -= this.selectedCollision.box.bounds[2];
            r[1] -= this.selectedCollision.box.bounds[3];
            
            this.selectedCollision.setStart(r);
        }
    }
}

PropEditor.prototype.processInput = function() {
    
    if (!fro.input.hasFocus())
        return;
        
    // Camera pan controls
    if (fro.input.isKeyDown(KeyEvent.DOM_VK_W)) { // north

        fro.camera._position[1] += PAN_SPEED;
        fro.camera.updateTranslation();

    } else if (fro.input.isKeyDown(KeyEvent.DOM_VK_S)) { // south
    
        fro.camera._position[1] -= PAN_SPEED;
        fro.camera.updateTranslation();
    } 
    
    if (fro.input.isKeyDown(KeyEvent.DOM_VK_A)) { // west
        
        fro.camera._position[0] -= PAN_SPEED;
        fro.camera.updateTranslation();
        
    } else if (fro.input.isKeyDown(KeyEvent.DOM_VK_D)) { // east
        
        fro.camera._position[0] += PAN_SPEED;
        fro.camera.updateTranslation();
    }

    // Camera zoom controls
    if (fro.input.isKeyDown(KeyEvent.DOM_VK_PAGE_UP)) { // zoom in
    
        if (fro.camera.zoom > 0.2) {
            fro.camera.zoom -= 0.1;
            fro.camera.updateTranslation();
        }
            
    } else if (fro.input.isKeyDown(KeyEvent.DOM_VK_PAGE_DOWN)) { // zoom out
    
        if (fro.camera.zoom < 2.0) {
            fro.camera.zoom += 0.1;
            fro.camera.updateTranslation();
        }
            
    } else if (fro.input.isKeyDown(KeyEvent.DOM_VK_HOME)) { // home: reset zoom
    
        fro.camera.zoom = 1.0;
        fro.camera.updateTranslation();
    }
    
    if (this.canEditCollisions && this.selectedCollision) {
        if (fro.input.isKeyDown(KeyEvent.DOM_VK_SHIFT)) { // resize collision item
        
            this.selectedCollision.resizing = true;
        } else {
            this.selectedCollision.resizing = false;
        }
        
        if (fro.input.isKeyDown(KeyEvent.DOM_VK_DELETE)) {
            this.deleteSelectedCollision();
        }
    }
}

PropEditor.prototype.deleteSelectedCollision = function() {
    
    for (var index in this.__collisions) {
        if (this.__collisions[index] == this.selectedCollision) {
            
            // Erase from the list and dereference
            this.__collisions.splice(index, 1);
            this.selectedCollision = null;
            
            return;
        }
    }
}

/**
 * Reloads the rendered prop based on changes in our properties map
 */
PropEditor.prototype.refreshRenderable = function() {

    // Lazily create a new prop based on these properties
    if (this.properties.url.length > 0) {
        
        // Add some additional properties not used in the entity template,
        // but necessary to actually spawn 
        var props = {};
        
        for (var field in this.properties) {
            props[field] = this.properties[field];
        }
        
        props.x = 0;
        props.y = 0;
    
        this.prop = new Map_Prop('', props);
    } else {
        this.prop = undefined;
    }
}

/**
 * Creates a prop from the input json string
 */ 
PropEditor.prototype.loadJSON = function(id, json) {
    
    this.id = id;
    this.properties = JSON.parse(json);

    this.readCollisionData();
    this.refreshEditorFields();
    
    this.refreshRenderable();
}

/**
 * Creates a new blank prop to edit 
 */
PropEditor.prototype.createNewProp = function(id) {
    
    this.id = id;
    this.properties.type = 'prop';
    this.properties.url = '';
    this.properties.w = 0;
    this.properties.h = 0;
    this.properties.offset_x = 0;
    this.properties.offset_y = 0;
    this.properties.delay = 0;
    this.properties.alphakey = false;
    
    this.__collisions.length = 0;
    this.selectedCollision = null;
    
    this.refreshRenderable();
    this.refreshEditorFields();
}

/**
 * Populates user input fields with values from our properties map
 */
PropEditor.prototype.refreshEditorFields = function() {
    
    // Populate editor fields
    $('prop_id').val(this.id);
    
    $('#url').val(this.properties.url);
    $('#width').val(this.properties.w);
    $('#height').val(this.properties.h);
    $('#offset_x').val(this.properties.offset_x);
    $('#offset_y').val(this.properties.offset_y);
    $('#delay').val(this.properties.delay);
    $('#alphakey').prop('checked', this.properties.alphakey == true);
}

/**
 * Populates our properties map with data from user input fields
 */
PropEditor.prototype.loadPropertiesFromEditorFields = function() {

    this.properties.type = 'prop';
    this.properties.url = $('#url').val();
    this.properties.w = Number($('#width').val());
    this.properties.h = Number($('#height').val());
    this.properties.offset_x = Number($('#offset_x').val());
    this.properties.offset_y = Number($('#offset_y').val());
    this.properties.delay = Number($('#delay').val());
    this.properties.alphakey = Boolean($('#alphakey').prop('checked'));
}

/**
 * Converts our properties map to a JSON string and returns
 * @return string
 */
PropEditor.prototype.generateJSON = function() {
    
    this.generateCollisionData();
    
    return JSON.stringify(this.properties);
}

/**
 * Reads data from our collisions list and adds a serializable array
 * to our properties object
 */
PropEditor.prototype.generateCollisionData = function() {
    
    /*
        Map as:
        array(
            x, y, w, h,
            x, y, w, h,
            ...
        )
    */
    if (this.__collisions.length > 0) {
    
        this.properties.collisions = new Array();
        var coltable = this.properties.collisions;
        
        for (var index in this.__collisions) {
            
            var bounds = this.__collisions[index].box.bounds;
            
            coltable.push(bounds[0]);
            coltable.push(bounds[1]);
            coltable.push(bounds[2]);
            coltable.push(bounds[3]);
        }
    }
}

/**
 * Reads data from a serializable array in our properties object and
 * generates editable collision objects
 */
PropEditor.prototype.readCollisionData = function() {

    // @todo doesn't this just load directly into the entity anyway?
    
    this.__collisions.length = 0;
    this.selectedCollision = null;

    if ("collisions" in this.properties) {
        var coltable = this.properties.collisions;
        var collision;
        
        for (var index = 0; index < coltable.length; index += 4) {
            
            collision = new CollisionRectangle(rect.create([
                                    coltable[index], 
                                    coltable[index+1],
                                    coltable[index+2],
                                    coltable[index+3]
                                ]));

            this.__collisions.push(collision);        
        }
    }
}

PropEditor.prototype.render = function() {
    
    if (this.prop)
        this.prop.render();
        
    if (this.canEditCollisions) {
        for (var index in this.__collisions)
            if (typeof this.__collisions[index] == 'object')
                this.__collisions[index].render();
    }
}

