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
    'Timer',
    'entity/Entity'
], function(Enum, Util, Timer, Entity) {
    var vec3 = Util.vec3,
        rect = Util.rect;

    var MOVEMENT_DISTANCE = 16;

    // TODO: Movement speed is too dependent on this value
    var THINK_INTERVAL_MS = 50; 

    function Actor(context, properties) {
        Entity.call(this, context, properties);
        
        this.isRenderable = true; // Add this entity to the render queue

        this.step = 0;
        this.action = properties.action || Enum.Action.IDLE;
        this.speed = properties.speed || Enum.Speed.WALK;
        this.direction = properties.direction || Enum.Direction.SOUTH;
        this.buffer = '';

        this.destination = vec3.create();
        this.directionNormal = vec3.create();
        
        this.setPosition(properties.position || [0, 0, 0]);
        this.setName(properties.name || '');
        
        // Create a think timer for this avatar
        this.onThink = this.onThink.bind(this);
        this.thinkTimer = new Timer(this.onThink, THINK_INTERVAL_MS);
        this.thinkTimer.start();

        if (properties.hasOwnProperty('avatar')) {
            this.loadAvatar(properties.avatar);
        }
    }

    Actor.prototype = Object.create(Entity.prototype);
    Actor.prototype.constructor = Actor;

    Actor.prototype.destroy = function() {
        if (this.thinkTimer) {
            this.thinkTimer.stop();
        }

        Entity.prototype.destroy.call(this);
    };

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
     * Load our avatar from JSON properties passed into the underlying
     * Animation resource. 
     * TODO: Better naming convention/pattern. load vs set is dumb.
     * 
     * @param {object} properties for an Animation
     */
    Actor.prototype.loadAvatar = function(properties) {
        var avatar = this.context.resources.load(properties);
        
        // If it needs to load external resources, hook for errors
        if (!avatar.isLoaded()) {
        
            // Bind and wait for the image to be loaded
            var self = this;
            avatar
                .bind('onload', function() {
                    self.setAvatar(avatar);
                })
                .bind('onerror', function() {
                    // TODO: do something, revert, load default, etc.
                    throw new Error('Failed to load prop image for [' + self.id + ']');
                });
        } else {
            // load in
            this.setAvatar(avatar);
        }
    };

    /**
     * Sets this.avatar to the new Animation object, and reconfigures
     * the actor's properties as appropriate (resize, animation reset, etc)
     *
     * @param {Animation} animation to use as an avatar
     */
    Actor.prototype.setAvatar = function(animation) {
        this.avatar = animation;
        
        this.offset[1] = this.avatar.height * 0.5;
        this.updateTranslation();
        
        this.recalculateAvatarRow();

        this.fire('avatar', this);
    };

    /**
     * Adds actions to our buffer to be processed by the actor.
     *
     * @param {string} buffer content to append to the current buffer
     */
    Actor.prototype.addToActionBuffer = function(buffer) {
        this.fire('add.buffer', buffer);    
        this.buffer += buffer;
    };

    /**
     * Send a `say` message to everyone. This triggers a `say` event
     * event that can be handled by all plugins as appropriate
     * (to create word bubbles, or dialog, etc).
     *
     * @param {string} message to send
     */
    Actor.prototype.say = function(message) {

        this.fire('say', {
            entity: this,
            message: message
        });
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
        
        var normal = Enum.Direction.toVec3(direction);
        vec3.scale(normal, MOVEMENT_DISTANCE);

        // Collision rectangle is a 16x16 (@todo generate into this.collisions?)
        // TODO: optimize rect creation
        var r = rect.create([
                    this.position[0] + normal[0] - 8,
                    this.position[1] + normal[1],
                    16, 16
                ]);
        
        return !(this.context.isRectBlocked(r, this));
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
        
        var pos = this.position;

        if (this.avatar) {
            r[0] = pos[0];
            r[1] = pos[1] + this.avatar.height * 0.5;
            r[2] = this.avatar.width;
            r[3] = this.avatar.height;
        } else {
            r[0] = pos[0];
            r[1] = pos[1];
            r[2] = 0;
            r[3] = 0;
        }
    };

    /**
     * Set the actor's position. Accepts either an (x,y) pair
     * or an (x,y,z) to also specify the z-order. This will
     * also stop any automatic walking to a destination. 
     *
     * @param {vec3} position
     */
    Actor.prototype.setPosition = function(position) {
        Entity.prototype.setPosition.call(this, position);

        vec3.set(this.position, this.destination);
        this.fire('move', this.position);
    };

    /** 
     * Set the actor's destination position that they will automatically
     * walk to. Accepts an (x,y) pair. TODO: Support z-order changing.
     *
     * @param {vec3} destination
     */
    Actor.prototype.setDestination = function(destination) {
        this.destination[0] = Math.floor(destination[0]);
        this.destination[1] = Math.floor(destination[1]);
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

    Actor.prototype.onThink = function() {

        // Check for new actions on our buffer
        if (!this.isMoving()) {
            this.processActionBuffer();
        }

        // If we were moving, or new data on the buffer made us
        // start moving, process the actual movement. 
        if (this.isMoving()) {
            // Stop autoplay for the avatar, we'll let stepping handle it.
            this.avatar.stop(); 

            this.processMovement();
        } else {

            // Go into an idle stance if not already
            if (this.action === Enum.Action.MOVE) {
                this.setAction(Enum.Action.IDLE);
                
                // Start autoplaying the avatar again, if it's animated
                this.avatar.play();
            }
        }
    };

    /**
     * Walks through the buffer and perform the next action.
     */
    Actor.prototype.processActionBuffer = function() {
        
        var c, recheck, eraseCount, dir;

        if (this.buffer) {
            do {
            
                c = this.buffer.charAt(0);
                dir = Enum.Direction.fromChar(c);
                recheck = false;
                eraseCount = 1;
            
                if (dir !== Enum.Direction.NONE) { // moving in direction
                    this.stepInDirection(dir);
                    
                } else if (c === 'w') { // change speed to walk

                    this.setSpeed(Enum.Speed.WALK);
                    recheck = true;
                    
                } else if (c === 'r') { // change speed to run

                    this.setSpeed(Enum.Speed.RUN);
                    recheck = true;
                    
                } else if (c === 's') { // sit + 1 char for direction
                    
                    if (this.buffer.length > 1) {
                        dir = Enum.Direction.fromChar(this.buffer.charAt(1));
                        this.setDirection(dir);
                        eraseCount++;
                    }

                    this.setAction(Enum.Action.SIT);
                    
                } else if (c === 't') { // stand/turn + 1 char for direction
                    
                    if (this.buffer.length > 1) {
                        dir = Enum.Direction.fromChar(this.buffer.charAt(1));
                        this.setDirection(dir);
                        eraseCount++;
                    }

                    this.setAction(Enum.Action.IDLE);
                }

                this.buffer = this.buffer.substr(eraseCount);

            } while (recheck && this.buffer);
        }
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

        if (this.action !== Enum.Action.MOVE) {
            this.setAction(Enum.Action.MOVE);
        }
        
        if (distance > 0) { // Move toward destination
        
            direction[0] = Math.ceil(direction[0]);
            direction[1] = Math.ceil(direction[1]);
        
            vec3.add(position, direction);
            Entity.prototype.setPosition.call(this, position);
            
        } else { // close enough, just set
            
            vec3.set(this.destination, position);
            Entity.prototype.setPosition.call(this, position);
        }
        
        // If our relative direction changed, make sure we reflect that
        var d = Enum.Direction.fromVec3(direction);

        if (d !== this.direction) {
            this.setDirection(d);
        }

        // Animate the step
        // TODO: better logic here to delay step animations to every-other distance
        if (this.step < 2) {
            this.step++;
        } else {
            this.step = 0;
            this.avatar.next(true);
            
            // Get the map to queue a resort of objects
            this.context.resort();
        }
        
        this.fire('move', this.position);
    };

    /** 
     * Determines what row to render based on a translation of our 
     * direction and current action.
     */
    Actor.prototype.recalculateAvatarRow = function() {
        var row;
        
        if (this.direction === Enum.Direction.NORTH ||
            this.direction === Enum.Direction.NORTHEAST ||
            this.direction === Enum.Direction.NORTHWEST) {

            row = 8;
        } else if (this.direction === Enum.Direction.SOUTH ||
            this.direction === Enum.Direction.SOUTHEAST ||
            this.direction === Enum.Direction.SOUTHWEST) {

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

        //console.log('row ' + frame + row + ' ' + Date.now());
        this.avatar.setKeyframe(frame + row);
    };

    Actor.prototype.stepInDirection = function(direction) {
        
        vec3.set(this.getPosition(), this.destination);
        
        var normal = Enum.Direction.toVec3(direction);
        vec3.add(this.destination, vec3.scale(normal, MOVEMENT_DISTANCE));
    };

    return Actor;
});
