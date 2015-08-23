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
    'entity/Actor',
    'Enum',
    'Timer'
], function(Actor, Enum, Timer) {
     
    // Duration we allow the action buffer to fill up before
    // sending to the network. Remote clients will see our 
    // actions with roughly the same delay specified here. 
    var SEND_BUFFER_INTERVAL_MS = 2000;

    function Player(context, properties) {
        this.networkBuffer = '';

        // If our context has a network connection, start a timer
        // to transmit our network buffer
        // TODO: Player is initialized before network, so this will
        // always be false. But I don't want player after network
        // because we need to guarantee Player is setup for auth.
        // Better idea would be to just integrate into onThink,
        // rather than using a new timer. 
        if (context.network) {
            this.onBufferTimer = this.onBufferTimer.bind(this);
            this.bufferTimer = new Timer(this.onBufferTimer, SEND_BUFFER_INTERVAL_MS);
            this.bufferTimer.start();

            // If we are looking to join a server, cache the player avatar
            // and don't load it until the server gives the go-ahead.
            this.avatarForNetwork = properties.avatar;
            delete properties.avatar; 
        }

        Actor.call(this, context, properties);
    }

    Player.prototype = Object.create(Actor.prototype);
    Player.prototype.constructor = Player;

    Player.prototype.destroy = function() {
        if (this.bufferTimer) {
            this.bufferTimer.stop();
        }

        Actor.prototype.destroy.call(this);
    };

    Player.prototype.onThink = function() {

        this.checkInput();
        Actor.prototype.onThink.call(this);
    };

    Player.prototype.onBufferTimer = function() {

        if (this.networkBuffer.length > 0) {

            // Serialize our current state into 5-tuple
            var state = [
                this.position[0],
                this.position[1],
                this.position[2],
                this.direction,
                this.action
            ];

            this.context.network.emit('move', {
                buffer: this.networkBuffer,
                state: state
            });

            // Clear buffer to load another payload
            this.networkBuffer = '';
        }
    };

    Player.prototype.checkInput = function() {
        var input = this.context.input,
            cam = this.context.camera,
            buffer = '',
            dir = Enum.Direction.NONE,
            north, east, south, west;
        
        // Don't process additional actions if we are still moving
        // or the context is out of focus
        if (this.isMoving() || !input.hasFocus()) {
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
                if (this.action !== Enum.Action.SIT || this.direction !== dir) {
                    buffer += 's' + Enum.Direction.toChar(dir);
                }
            } else {

                // We want to move, check if we can actually do it
                if (this.canMove(dir)) {

                    // We can move, so check for a speed modifier first
                    if (input.isKeyDown(window.KeyEvent.DOM_VK_SHIFT)) {
                        if (this.speed !== Enum.Speed.RUN) {
                            buffer += 'r';
                        }
                    } else {
                        if (this.speed !== Enum.Speed.WALK) {
                            buffer += 'w';
                        }
                    }

                    // Finally append a step in the desired direction
                    buffer += Enum.Direction.toChar(dir);

                } else {
                    // Can't move, if we're not already facing that way, face that way.
                    if (this.direction !== dir) {
                        buffer += 't' + Enum.Direction.toChar(dir);
                    }
                }
            }
        }

        if (buffer.length > 0) {
            this.addToActionBuffer(buffer);
        }
    };

    /**
     * Override of Actor.addToActionBuffer to queue up the new
     * buffer to be sent to the network next tick.
     *
     * @param {string} buffer
     */
    Player.prototype.addToActionBuffer = function(buffer) {

        // Queue up the buffer to be sent to the network
        // TODO: Obvious timing issue, we add to the buffer
        // and if we send immediately, before the buffer is
        // even processed, the actor state will be incorrect.
        // (will send with the state before buffer processing).
        if (this.context.network) {
            this.networkBuffer += buffer;
        }

        Actor.prototype.addToActionBuffer.call(this, buffer);
    };

    /**
     * Override of Actor.say to send the message to the
     * network, if we're connected. Regardless if we are or not,
     * this will still fire Actor.say (and the `say` event).
     *
     * @param {string} message
     */
    Player.prototype.say = function(message) {
        
        if (this.context.network) {
            this.context.network.emit('say', {
                message: message
            });
        }

        Actor.prototype.say.call(this, message);
    };

    Player.prototype.setName = function(name) {

        // If we're connected to a server, name changes must
        // be validated by the server before being applied.
        if (this.context.network) {

            this.context.network.emit('name', {
                name: name
            });

        } else {
            // Pass directly to the Actor
            Actor.prototype.setName.call(this, name);
        }
    };

    /**
     * Override of Actor.setAvatar to send the message to the
     * network, if we're connected.
     *
     * @param {object} properties of an avatar Animation
     */
    Player.prototype.setAvatar = function(properties) {
        if (this.context.network) {
            this.avatarForNetwork = properties;
            
            this.context.network.emit('avatar', {
                metadata: properties
            });
        } else {
            Actor.prototype.setAvatar.call(this, properties);
        }
    };

    return Player;
});
