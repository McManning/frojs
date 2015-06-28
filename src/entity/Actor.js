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
    'Utility',
    'entity/Entity'
], function(Enum, Util, Entity) {

    var MOVEMENT_DISTANCE = 16;

    function Actor(context, properties) {
        Entity.call(this, context, properties);
        
        this.isRenderable = true; // Add this entity to the render queue

        this.step = 0;
        this.action = properties.action;
        this.speed = Enum.Speed.WALK;
        this.direction = properties.direction;

        this.destination = vec3.create();
        this.directionNormal = vec3.create();
        
        this.setPosition(properties.position);
        this.setNick(properties.nick || '');
        
        if (properties.hasOwnProperty('avatar')) {
            this.setAvatar(properties.avatar);
        }
    }

    Actor.prototype = Object.create(Entity.prototype);
    Actor.prototype.constructor = Actor;

    /**
     * Set the display name of this Actor. This triggers a `name`
     * event that can be handled by all plugins as appropriate
     * (to update a nameplate, or send to the chatbox, etc).
     * 
     * @param {string} name to change to
     */
    Actor.prototype.setName = function(name) {
        this.name = name;
        this.fire('name', this);
    };

    /**
     * Sets this.avatar to the new Animation object, and reconfigures
     * the actor's properties as appropriate (resize, animation reset, etc)
     *
     * @param {Animation} animation to use as an avatar
     */
    Actor.prototype.setAvatar = function(animation) {
        this.avatar = animation;
        this.fire('avatar', this);
        
        this.offset[1] = this.avatar.height * 0.5;
        this.updateTranslation();
        
        this.recalculateAvatarRow();
    };

    /**
     * Send a `say` message to everyone. This triggers a `say` event
     * event that can be handled by all plugins as appropriate
     * (to create word bubbles, or dialog, etc).
     *
     * @param {string} message to send
     */
    Actor.prototype.say = function(message) {
        this.fire('say', message);
    };

    Actor.prototype.render = function() {

        if (this.avatar) {
            this.avatar.render(this.translation, 0.0);
        }
    };

    /**
     * @param {Enum.Direction} direction to test 
     * @return {boolean}
     */
    Actor.prototype.canMove = function(direction) {

        // TODO: test the points between current location and target (x, y)
        // For now, it assumes the distance is close enough to be negligible

        var x = this.position[0];
        var y = this.position[1];
        
        if (direction & Enum.Direction.NORTH) {
            y += MOVEMENT_DISTANCE;
        } else if (direction & Enum.Direction.SOUTH) {
            y -= MOVEMENT_DISTANCE;
        }
            
        if (direction & Enum.Direction.EAST) {
            x += MOVEMENT_DISTANCE;
        } else if (direction & Enum.Direction.WEST) {
            x -= MOVEMENT_DISTANCE;
        }
        
        // Collision rectangle is a 16x16 (@todo generate into this.collisions?)
        // TODO: optimize rect creation
        var r = rect.create([
                    x - 8,
                    y,
                    16, 16
                ]);
        
        return !(this.context.world.isRectBlocked(r, this));
    };

    /** 
     * Returns true if our current position does not match up with 
     *  our current destination
     *  
     * @return {boolean}
     */
    Actor.prototype.isMoving = function() {

        var pos = this.getPosition();

        // TODO: referencing action buffer???
        return (pos[0] !== this.destination[0] ||
                pos[1] !== this.destination[1]);
    };

    /**
     * @param {rect} r
     */
    Actor.prototype.getBoundingBox = function(r) {

        // TODO: factor in rotations and scaling
        // and utilize this.renderable.getTopLeft(), getBottomRight(), etc
        
        var pos = this.getPosition();

        r[0] = pos[0];
        r[1] = pos[1] + this.avatar.height * 0.5;
        
        if (this.avatar) {
            r[2] = this.avatar.width;
            r[3] = this.avatar.height;
        } else {
            r[2] = 0;
            r[3] = 0;
        }
    };

    /**
     * Set the actor's position. Accepts either an (x,y) pair
     * or an (x,y,z) to also specify the z-order. This will
     * also stop any automatic walking to a destination. 
     *
     * @param {vec2|vec3} position
     */
    Actor.prototype.setPosition = function(position) {
        Entity.prototype.setPosition.call(this, position);

        vec3.set(this.position, this.destination);
        this.fire('move', this.position);
    };

    /** 
     * Sets our current action (idle, sit, etc) and updates the avatar.
     *
     * @param {Enum.Action} action
     */
    Actor.prototype.setAction = function(action) { 
        this.action = action;
        this.recalculateAvatarRow();
    };

    /** 
     * Sets our current movement speed (walk/run).
     *
     * @param {Enum.Speed} speed
     */
    Actor.prototype.setSpeed = function(speed) {
        this.speed = speed;
    };

    /**
     * Sets our actors "close enough" direction, and updates the avatar
     * 
     * @param {Enum.Direction} dir
     */
    Actor.prototype.setDirection = function(dir) {
        this.direction = dir;
        this.recalculateAvatarRow();
    };

    /** 
     * Moves our actor in order to match up our current position with our destination
     */
    Actor.prototype.processMovement = function() {

        var position = this.getPosition();
        var direction = this.directionNormal;

        // Get the distance between our position and destination
        vec3.subtract(this.destination, position, direction);
        var distance = vec3.length(direction);
        
        // Create a normal vector from position to destination
        vec3.normalize(direction);
        
        // console.log('Distance: ' + distance);
        
        // If we have less distance to cover, just move the difference
        if (distance < this.speed) {
            vec3.scale(direction, distance);
            distance = 0;
        } else {
            vec3.scale(direction, this.speed);
            distance -= this.speed;
        }
        
        //console.log('Adjusted Distance: ' + distance);
        //console.log(direction);
        
        if (distance > 0) { // Move toward destination
        
            direction[0] = Math.ceil(direction[0]);
            direction[1] = Math.ceil(direction[1]);
        
            vec3.add(position, direction);
            Entity.prototype.setPosition.call(this, position);
            
        } else { // close enough, just set
            
            vec3.set(this.destination, position);
            Entity.prototype.setPosition.call(this, position);
        }
        
        // Animate the step
        // TODO: better logic here to delay step animations to every-other distance
        if (this.step < 2) {
            this.step += 1;
        } else {
            this.step = 0;
            this.avatar.nextFrame(true);
            
            // Get the map to queue a resort of objects
            this.context.world.resort();
        }
        
        // If our relative direction changed, make sure we reflect that
        var d = Util.directionFromVector(direction);
        
        if (d !== this.direction) {
            this.setDirection(d);
        }

        this.fire('move', this.position);
    };

    /** 
     * Determines what row to render based on a translation of our 
     * direction and current action.
     */
    Actor.prototype.recalculateAvatarRow = function() {
        var row;
        
        if (this.direction & Enum.Direction.NORTH) { // N/NE/NW
            row = 8;
        } else if (this.direction & Enum.Direction.SOUTH) { // S/SE/SW
            row = 2;
        } else if (this.direction === Enum.Direction.WEST) {
            row = 4;
        } else if (this.direction === Enum.Direction.EAST) {
            row = 6;
        } else { // default to south again, just in case
            row = 2;
        }

        var frame = 'stop_';

        if (this.action === Enum.Action.MOVE || !this.avatar.hasKeyframe(frame + row)) {
            frame = 'move_';
        }
        
        if (this.action === Enum.Action.SIT) {
            frame = 'act_';
            if (!this.avatar.hasKeyframe(frame + row)) {
                frame = 'move_';
            }
        }
        
        // Still doesn't exist, default to move_2
        if (!this.avatar.hasKeyframe(frame + row)) {
            frame = 'move_';
            row = '2';
        }

        this.avatar.setKeyframe(frame + row);
    };

    Actor.prototype.stepInDirection = function(dir) {
        
        vec3.set(this.getPosition(), this.destination);
        
        // Offset our destination based on desired direction from our current position
        if (dir & Enum.Direction.NORTH) {
            this.destination[1] += MOVEMENT_DISTANCE;
        } else if (dir & Enum.Direction.SOUTH) {
            this.destination[1] -= MOVEMENT_DISTANCE;
        }
            
        if (dir & Enum.Direction.EAST) {
            this.destination[0] += MOVEMENT_DISTANCE;
        } else if (dir & Enum.Direction.WEST) {
            this.destination[0] -= MOVEMENT_DISTANCE;
        }
    };

    return Actor;
});
