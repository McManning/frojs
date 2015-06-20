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

var REMOTE_PLAYER_THINK_INTERVAL = 50; // @todo Movement speed is too dependent on this value

function Map_RemotePlayer() {}
Map_RemotePlayer.prototype = new Map_Actor();

Map_RemotePlayer.prototype.initialise = function(eid, properties) {
    Map_Actor.prototype.initialise.call(this, eid, properties);
    
    // Is our identity authentic with the service
    this.authenticated = properties.hastoken;
    
    this.thinkInterval = fro.timers.addInterval(
        this, this.think, 
        REMOTE_PLAYER_THINK_INTERVAL
    );

    // Register an action controller with us
    this.actionController = new BufferedActionController(this, false);
}

Map_RemotePlayer.prototype.destroy = function() {

    fro.timers.removeInterval(this.thinkInterval);
    
    Map_Actor.prototype.destroy.call(this);
}

Map_RemotePlayer.prototype.think = function() {

    // Check for new actions on the buffer
    if (!this.isMoving()) {
        this.actionController.processActions();
    }
    
    if (this.isMoving()) {
    
        this.processMovement();
    
    } else {
    
        // Go into an idle stance if not already
        if (this.action == Action.MOVE) {
            this.setAction(Action.IDLE);
        }
    
        if (this.avatar) {
            var time = new Date().getTime();
            // Idle animate our avatar
            if (this.avatar.nextChange < time) {
            
                this.avatar.nextFrame(false);
                this.avatar.nextChange = time + this.avatar.currentDelay;
            }
        }
    }
    
}

