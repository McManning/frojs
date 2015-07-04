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

define([
    'Enum',
    'Timer'
], function(Enum, Timer) {
     
    var THINK_INTERVAL_MS = 50;

    function Player(context, properties) {
        // jshint unused: false
        this.networkBuffer = '';

        this.context = context;


        // Create a think timer for this avatar
        this.onThink = this.onThink.bind(this);
        this.thinkTimer = new Timer(this.onThink, THINK_INTERVAL_MS);
        //this.thinkTimer.start();
    }

    Player.prototype.onThink = function() {

        this.checkInput();
    };

    Player.prototype.checkInput = function() {
        var input = this.context.input,
            cam = this.context.camera,
            buffer = '',
            dir = Enum.Direction.NONE,
            north, east, south, west;
        
        // Don't process additional actions if we have no actor, or are still moving
        if (!this.actor || this.actor.isMoving()) {
            return;
        }

        if (!input.hasFocus()) {
            return;
        }

        // Handle zoom (@todo move, this is just for testing)
        if (input.isKeyDown(window.KeyEvent.DOM_VK_PAGE_UP)) { // pgup: zoom in
        
            if (cam.zoom > 0.2) {
                cam.zoom -= 0.1;
                cam.updateTranslation();
            }

        } else if (input.isKeyDown(window.KeyEvent.DOM_VK_PAGE_DOWN)) { // pgdown: zoom out
        
            if (cam.zoom < 2.0) {
                cam.zoom += 0.1;
                cam.updateTranslation();
            }

        } else if (input.isKeyDown(window.KeyEvent.DOM_VK_HOME)) { // home: reset zoom
        
            cam.zoom = 1.0;
            cam.updateTranslation();
        }
        
        // Pull desired direction of movement
        // TODO: Rebindable settings!
        north = input.isKeyDown(window.KeyEvent.DOM_VK_W) || input.isKeyDown(window.KeyEvent.DOM_VK_UP);
        south = input.isKeyDown(window.KeyEvent.DOM_VK_S) || input.isKeyDown(window.KeyEvent.DOM_VK_DOWN);
        west = input.isKeyDown(window.KeyEvent.DOM_VK_A) || input.isKeyDown(window.KeyEvent.DOM_VK_LEFT);
        east = input.isKeyDown(window.KeyEvent.DOM_VK_D) || input.isKeyDown(window.KeyEvent.DOM_VK_RIGHT);

        if (north) {
            if (east) {
                dir = Enum.Direction.NORTHEAST;
            } else if (west) {
                dir = Enum.Direction.NORTHWEST;
            } else {
                dir = Enum.Direction.NORTH;
            }
        } else if (south) {
            if (east) {
                dir = Enum.Direction.SOUTHEAST;
            } else if (west) {
                dir = Enum.Direction.SOUTHWEST;
            } else {
                dir = Enum.Direction.SOUTH;
            }
        } else if (east) {
            dir = Enum.Direction.EAST;
        } else if (west) {
            dir = Enum.Direction.WEST;
        }

        // If we're trying to move in a direction, check for other modifiers
        // and whether or not it's even allowed. Update the buffer.
        if (dir !== Enum.Direction.NONE) {

            // Check for a sit in some direction
            if (input.isKeyDown(window.KeyEvent.DOM_VK_C) || input.isKeyDown(window.KeyEvent.DOM_VK_CONTROL)) {
                
                // Only accept if it's not the exact same action+direction
                if (this.actor.action !== Enum.Action.SIT || this.actor.direction !== dir) {
                    buffer += 's' + Enum.Direction.toChar(dir);
                }
            } else {

                // We want to move, check if we can actually do it
                if (this.actor.canMove(dir)) {

                    // We can move, so check for a speed modifier first
                    if (input.isKeyDown(window.KeyEvent.DOM_VK_SHIFT)) {
                        if (this.actor.speed !== Enum.Speed.RUN) {
                            buffer += 'r';
                        }
                    } else {
                        if (this.actor.speed !== Enum.Speed.WALK) {
                            buffer += 'w';
                        }
                    }

                    // Finally append a step in the desired direction
                    buffer += Enum.Direction.toChar(dir);

                } else {
                    // Can't move, if we're not already facing that way, face that way.
                    if (this.actor.direction !== dir) {
                        buffer += 't' + Enum.Direction.toChar(dir);
                    }
                }
            }
        }

        if (buffer.length > 0) {
            // Queue up the buffer to be sent to the network
            this.networkBuffer += buffer;

            // Also move our linked actor
            this.actor.addToActionBuffer(buffer);
        }
    };

    return Player;
});
