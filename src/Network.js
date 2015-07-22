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
    'EventHooks',
    'Utility',
    'entity/Actor',
    'Player'
], function(EventHooks, Util, Actor, Player) {

    function Network(context, options) {
        Util.extend(this, EventHooks); // Maybe?

        // Lazily check for socket.io support
        if (!window.io) {
            throw Error('No socket.io support. :(');
        }

        if (!options.hasOwnProperty('server')) {
            throw Error('No server URI specified.');
        }

        this.context = context;
        this.server = options.server;
        this.token = options.token || null;
        this.room = options.room || null;
        this.clientId = null; // Retrieved from the server

        this.socket = window.io(this.server);

        // bind handlers for socket events
        var binds = {
            connect: this.onConnect,
            disconnect: this.onDisconnect,
            err: this.onErr,
            auth: this.onAuth,
            join: this.onJoin,
            leave: this.onLeave,
            say: this.onSay,
            move: this.onMove,
            name: this.onName,
            avatar: this.onAvatar
        };

        for (var evt in binds) {
            if (binds.hasOwnProperty(evt)) {
                this.socket.on(evt, binds[evt].bind(this));
            }
        }
    }

    /**
     * Wrapper around `socket.emit` for logging/overloading.
     *
     * @param {string} id 
     * @param {object} payload
     */
    Network.prototype.emit = function(id, payload) {

        this.socket.emit(id, payload);
    };

    Network.prototype.onConnect = function() {

        var player = this.context.player;

        // TODO: I don't like the way it accesses player here.
        // And I hacked in a save for avatarJson. Come up
        // with a better solution.

        // connected, emit authentication
        this.emit('auth', {
            token: this.token,
            room: this.room,
            name: player.name,
            avatar: player.avatarJson,
            state: player.getState()
        });
    };

    Network.prototype.onDisconnect = function() {

        this.clientId = null;
    };

    /**
     * Called when an error response is returned from the server.
     * In most cases, this occurs whenever the client sends a 
     * malformed message that cannot be accepted. 
     * 
     * @param {object} data `err` payload
     */
    Network.prototype.onErr = function(data) {
        // Payload: responseTo, message, developerMessage

        window.alert(data.message);
        console.log(data);
    };

    /**
     * Called when the server accepts our authentication.
     * Server provides us our unique client ID and actual 
     * room name. 
     * 
     * @param {object} data `auth` payload
     */
    Network.prototype.onAuth = function(data) {
        // Payload: id, room

        this.clientId = data.id;
        this.room = data.room;

        // Update our local player's entity ID to match
        this.context.player.id = data.id;
    };

    /**
     * 
     * 
     * @param {object} data `join` payload
     */
    Network.prototype.onJoin = function(data) {
        // Payload: id, name, avatar, position, action, direction

        if (data.id === this.clientId) {
            // Ourself is joining, so setup our Actor and link to Player
            
            // TODO: Resolve better. Do we want to create the actor if it
            // doesn't exist? Should we assume it exists? Should we verify
            // it's linked to context.player? Etc. 
            
            var player = this.context.player;

            if (!(player instanceof Player)) {
                throw new Error('Local Player instance does not exist');
            }

            /* TODO: Maybe set these? Or set if they differ
                from what we already have. (Because any could be
                overridden by the server, but we don't want to 
                trigger a reload if it's the same as what we have)
            actor.id = data.id;
            actor.setName(data.name);
            actor.setAvatar(data.avatar);
            actor.setPosition(data.position);
            actor.setAction(data.action);
            actor.setDirection(data.direction);
            */
            Actor.prototype.setName.call(player, data.name);
            Actor.prototype.setState.call(player, data.state);

        } else {
            // It's a remote user. Setup and associate an Actor
            var actor = this.context.find(data.id);

            // Remote doesn't exist, create a new Actor
            if (!actor) {
                // TODO: Support other things like template inheritance?
                actor = new Actor(this.context, {
                    id: data.id,
                    name: data.name,
                    avatar: data.avatar,
                    position: data.state.slice(0, 3),
                    direction: data.state[3],
                    action: data.state[4]
                });

                this.context.add(actor);
            } else {
                // TODO: What do we do here? They shouldn't re-send a join
                // if they already exist in our world. Update existing entity?
                throw new Error('Duplicate `join` for remote [' + data.id + ']');
            }
        }
    };

    /**
     * 
     * 
     * @param {object} data `leave` payload
     */
    Network.prototype.onLeave = function(data) {
        // Payload: id

        var actor = this.context.find(data.id);
        if (!(actor instanceof Actor)) {
            // TODO: Appropriate error handling
            throw new Error('No Actor associated with remote [' + data.id + ']');
        }

        actor.destroy();
    };

    /**
     * 
     * 
     * @param {object} data `say` payload
     */
    Network.prototype.onSay = function(data) {
        // Payload: id, message

        var actor = this.context.find(data.id);
        if (!(actor instanceof Actor)) {
            // TODO: Appropriate error handling
            throw new Error('No Actor associated with remote [' + data.id + ']');
        } 

        // Call the underlying Actor.say for the entity.
        // Primarily because Player.say doesn't set, but 
        // sends the request to the server (to get this response).
        Actor.prototype.say.call(actor, data.message);
    };

    /**
     * 
     * @param {object} data `move` payload
     */
    Network.prototype.onMove = function(data) {

        var actor = this.context.find(data.id);
        if (!(actor instanceof Actor)) {
            // TODO: Appropriate error handling
            throw new Error('No Actor associated with remote [' + data.id + ']');
        } 

        // TODO: I can add to the buffer, but I don't
        // have a way to apply verifications. I'll need
        // to work that back in somehow...

        // Call the underlying Actor.addToActionBuffer for the entity.
        // Primarily because Player.addToActionBuffer doesn't set, but 
        // sends the request to the server (to get this response).
        Actor.prototype.addToActionBuffer.call(actor, data.buffer);
    };
 
    /**
     * 
     * @param {object} data `name` payload
     */
    Network.prototype.onName = function(data) {

        var actor = this.context.find(data.id);
        if (!(actor instanceof Actor)) {
            // TODO: Appropriate error handling
            throw new Error('No Actor associated with remote [' + data.id + ']');
        } 

        // Call the underlying Actor.setName for the entity.
        // Primarily because Player.setName doesn't set, but 
        // sends the request to the server (to get this response).
        Actor.prototype.setName.call(actor, data.name);
    };

    /**
     * 
     * @param {object} data `avatar` payload
     */
    Network.prototype.onAvatar = function(data) {

        var actor = this.context.find(data.id);
        if (!(actor instanceof Actor)) {
            // TODO: Appropriate error handling
            throw new Error('No Actor associated with remote [' + data.id + ']');
        } 

        // Call the underlying Actor.setAvatar for the entity.
        // Primarily because Player.setAvatar doesn't set, but 
        // sends the request to the server (to get this response).
        Actor.prototype.setAvatar.call(actor, data.metadata);
    };

    return Network;
});
