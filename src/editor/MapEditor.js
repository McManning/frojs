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

/*
    Properties of objects on a map:
    
    - Z-order
    - Rotation
    - X/Y
    - Scale
    - HSV (?)
    
    Global properties of a map:
    - 
*/

var PAN_SPEED = 32;

function MapEditor() {
    
    this.inputInterval = window.setInterval(function() {
        FRO_Engine.editor.processInput();
    }, 50);
}
    
MapEditor.prototype.processInput = function() {

    if (!FRO_Input.hasFocus())
        return;

    // Camera pan controls
    if (FRO_Input.isKeyDown(87)) { // w: north

        FRO_Camera._position[1] -= PAN_SPEED;

    } else if (FRO_Input.isKeyDown(83)) { // s: south
    
        FRO_Camera._position[1] += PAN_SPEED;
    } 
    
    if (FRO_Input.isKeyDown(65)) { // a: west
        
        FRO_Camera._position[0] += PAN_SPEED;
        
    } else if (FRO_Input.isKeyDown(68)) { // d: east
        
        FRO_Camera._position[0] -= PAN_SPEED;
    }

    // Camera zoom controls
    if (FRO_Input.isKeyDown(33)) { // pgup: zoom in
    
        if (FRO_Camera.zoom > 0.2)
            FRO_Camera.zoom -= 0.1;
            
    } else if (FRO_Input.isKeyDown(34)) { // pgdown: zoom out
    
        if (FRO_Camera.zoom < 2.0)
            FRO_Camera.zoom += 0.1;
            
    } else if (FRO_Input.isKeyDown(36)) { // home: reset zoom
    
        FRO_Camera.zoom = 1.0;
    }
    
}

MapEditor.prototype.render = function() {
    
}

/** 
 * Populates user input fields with values from our global map properties
 */
MapEditor.prototype.refreshGlobalPropInputs = function() {

    $('#world_title').val(this.title);
}

/**
 * Sends values from the user input fields to our global map properties
 */
MapEditor.prototype.loadGlobalPropsFromInputs = function() {
    
    this.title = $('#world_title').val();
}

/** 
 * Populates user input fields with values from our grabbed entity
 */
MapEditor.prototype.refreshEntityPropInputs = function() {
    
    // @todo toggle various editor input screens based on entity type
    
    if (this.grabbed instanceof Map_Prop) {
        var pos = this.grabbed.getPosition();
    
        $('#template_id').val(this.grabbed.templateID);
        $('#entity_id').val(this.grabbed.id);
        $('#position_x').val(pos[0]);
        $('#position_y').val(pos[1]);
        $('#zorder').val(this.grabbed.zorder);
        $('#scale').val('0.0');
        $('#rotation').val('0.0');
    } else {
        $('#template_id').val('N/A');
        $('#id').val('N/A');
        $('#position_x').val('N/A');
        $('#position_y').val('N/A');
        $('#zorder').val('N/A');
        $('#scale').val('N/A');
        $('#rotation').val('N/A');
    }
}

/**
 * Sends properties from the user input fields to our grabbed entity
 */
MapEditor.prototype.loadEntityPropsFromInput = function() {
    
    if (this.grabbed instanceof Map_Prop) {
        var pos = this.grabbed.getPosition();
        
        pos[0] = Number($('position_x').val());
        pos[1] = Number($('position_y').val());
        this.grabbed.zorder = Number($('#zorder').val());
        // @todo scale/rotation/ ID || UID?
    }
}

/**
 * Loads a new entity instance into the map. Will request the entity 
 *   configurationJSON and load the new entity into the map
 */
MapEditor.prototype.loadEntity = function(uid) {
    
    FRO_Resources.getEntityJSON(uid, this,
        function(uid, data) { // success
        
            // @todo load extra properties into the entity
            // for instance purposes
            
            // And basically define the exact difference
            // between template entity properties &
            // instance entity properties
        
            FRO_Engine.world.parseObject(data);
        },
        function(uid) { // error
            
            // @todo some sort of warning display
        }
    );
}


