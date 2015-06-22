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
    'entity/Entity'
], function(Entity) {

    var Direction = {
        NONE : 0,
        NORTH : 1,
        SOUTH : 2,
        EAST : 4,
        WEST: 8,
        
        NORTHEAST : 5,
        NORTHWEST : 9,
        SOUTHEAST : 6,
        SOUTHWEST : 10
    };

    var Speed = {
        WALK : 4,
        RUN : 8
    };

    var Action = {
        IDLE : 0,
        MOVE : 1,
        SIT : 2,
        JUMP : 3
    };

    var MOVEMENT_DISTANCE = 16;

    function Actor(context, properties) {
        Entity.call(this, context, properties);
        
        this.isRenderable = true; // Add this entity to the render queue

        this.step = 0;
        this.action = properties.action;
        this.speed = Speed.WALK;
        this.direction = properties.direction;

        // TODO: Are these two required/used?
        this.width = 0;
        this.height = 0;
        
        this.destination = vec3.create();
        this.directionNormal = vec3.create();
        
        this.setPosition(properties.x, properties.y, properties.z);
        this.setNick(properties.nick || '');
        
        this.setAvatar('default');
        
        if ('avatar' in properties) {
            this.setAvatar(properties.avatar);
        }
    }

    Actor.prototype = Object.create(Entity.prototype);
    Actor.prototype.constructor = Actor;

    Actor.prototype.setNick = function(nick) {
        this.nick = nick;
        this.fire('nick', nick);
    };

    /**
     * Sets this.avatar to the new Avatar object, and reconfigures
     * the actor's properties as appropriate (resize, animation reset, etc)
     */
    Actor.prototype.applyAvatar = function(avatar) {
        this.avatar = avatar;
        
        this.width = avatar.getWidth();
        this.height = avatar.getHeight();
        
        this.offset[1] = this.height * 0.5;
        this.updateTranslation();
        
        this.recalculateAvatarRow();
    };

    Actor.prototype.setAvatar = function(id) {

        // Delegate to plugins
        this.fire('avatar.set', id);
    };

    Actor.prototype.render = function() {

        if (this.avatar) {
            this.avatar.render(this.translation);
        }
    };

    /**
     * @param dir Direction constant to test 
     * @return boolean
     */
    Actor.prototype.canMove = function(dir) {

        // TODO: test the points between current location and target (x, y)
        // For now, it assumes the distance is close enough to be negligible

        var x = this.position[0];
        var y = this.position[1];
        
        if (dir & Direction.NORTH) {
            y += MOVEMENT_DISTANCE;
        } else if (dir & Direction.SOUTH) {
            y -= MOVEMENT_DISTANCE;
        }
            
        if (dir & Direction.EAST) {
            x += MOVEMENT_DISTANCE;
        } else if (dir & Direction.WEST) {
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
     * @return boolean
     */
    Actor.prototype.isMoving = function() {

        var pos = this.getPosition();

        // @todo referencing action buffer???
        return (pos[0] !== this.destination[0] ||
                pos[1] !== this.destination[1]);
    };

    /**
     * @param rect r
     */
    Actor.prototype.getBoundingBox = function(r) {

        // @todo factor in rotations and scaling
        // and utilize this.renderable.getTopLeft(), getBottomRight(), etc
        
        var pos = this.getPosition();

        r[0] = pos[0];
        r[1] = pos[1] + this.height * 0.5;
        
        if (this.avatar) {
            r[2] = this.avatar.getWidth();
            r[3] = this.avatar.getHeight();
        } else {
            r[2] = 0;
            r[3] = 0;
        }
    };

    /** 
     * Wrapper to set the position of this actor on the map. 
     * Will prevent automatic walking to a destination.
     */
    Actor.prototype.setPosition = function(x, y, z) {
        Entity.prototype.setPosition.call(this, x, y, z);

        vec3.set(this.getPosition(), this.destination);
        this.fire('move', this.getPosition());
    };

    /** 
     * Sets our current action (idle, sit, etc) and updates the avatar.
     */
    Actor.prototype.setAction = function(action) { 
        this.action = action;
        this.recalculateAvatarRow();
    };

    /** 
     * Sets our current movement speed (walk/run).
     */
    Actor.prototype.setSpeed = function(speed) {
        this.speed = speed;
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
        var d = this.directionFromVector(direction);
        
        if (d !== this.direction) {
            this.setDirection(d);
        }

        this.fire('move', this.position);
    };

    /** 
     * Determines what row to render based on a translation of our 
     *   direction and current action
     */
    Actor.prototype.recalculateAvatarRow = function() {
        var row;
        
        if (this.direction & Direction.NORTH) { // N/NE/NW
            row = 8;
        } else if (this.direction & Direction.SOUTH) { // S/SE/SW
            row = 2;
        } else if (this.direction === Direction.WEST) {
            row = 4;
        } else if (this.direction === Direction.EAST) {
            row = 6;
        } else { // default to south again, just in case
            row = 2;
        }

        var frame = 'stop_';

        if (this.action === Action.MOVE || !this.avatar.hasKeyframe(frame + row)) {
            frame = 'move_';
        }
        
        if (this.action === Action.SIT) {
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
        if (dir & Direction.NORTH) {
            this.destination[1] += MOVEMENT_DISTANCE;
        } else if (dir & Direction.SOUTH) {
            this.destination[1] -= MOVEMENT_DISTANCE;
        }
            
        if (dir & Direction.EAST) {
            this.destination[0] += MOVEMENT_DISTANCE;
        } else if (dir & Direction.WEST) {
            this.destination[0] -= MOVEMENT_DISTANCE;
        }
    };

    /**
     * Sets our actors "close enough" direction, and updates the avatar
     * 
     * @param dir a Direction constant (ex: Direction.NORTH)
     */
    Actor.prototype.setDirection = function(dir) {
        this.direction = dir;
        this.recalculateAvatarRow();
    };

    // @todo move to utils!
    Actor.prototype.directionFromVector = function(vec) {
        var dir = Direction.NONE;
        
        if (vec[1] > 0) {
            dir |= Direction.NORTH;
        } else if (vec[1] < 0) {
            dir |= Direction.SOUTH;
        }
        
        if (vec[0] > 0) {
            dir |= Direction.EAST;
        } else if (vec[0] < 0) {
            dir |= Direction.WEST;
        }
            
        return dir;
    };

    Actor.prototype.say = function(message) {
        this.fire('say', message);
    };

    return Actor;
});