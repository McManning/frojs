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
    'entity/Actor'
], function(EventHooks, Util, Actor) {

    function Network(context, options) {
        Util.extend(this, EventHooks); // Maybe?

        this.context = context;
        this.server = options.server || null;
        this.token = options.token || null;
        this.room = options.room || null;
        this.clientId = null; // Retrieved from the server

        // If we specified a server, start a SocketIO connection
        if (this.server) {

            // TODO: Check for socketIO support first

            this.socket = window.io(this.server);

            // bind handlers for socket events
            var binds = {
                connect: this.onConnect,
                disconnect: this.onDisconnect,
                error: this.onError,
                auth: this.onAuth
            };

            for (var evt in binds) {
                if (binds.hasOwnProperty(evt)) {
                    this.socket.on(evt, binds[evt].bind(this));
                }
            }
        }
    }

    Network.prototype.onConnect = function() {

        // connected, emit authentication
        this.socket.emit('auth', {
            token: this.token,
            room: this.room,
            name: 'Chase'
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
     * @param {object} data `error` payload
     */
    Network.prototype.onError = function(data) {
        // Payload: code, message, developerMessage

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
    };

    /**
     * 
     * 
     * @param {object} data `join` payload
     */
    Network.prototype.onJoin = function(data) {
        // Payload: id, name, avatar, position, action, direction
        var actor;

        if (data.id === this.clientId) {
            // Ourself is joining, so setup our Actor and link to Player
            
            // TODO: Resolve better. Do we want to create the actor if it
            // doesn't exist? Should we assume it exists? Should we verify
            // it's linked to context.player? Etc. 
            actor = this.context.find(data.id);
            if (!(actor instanceof Actor)) {
                throw new Error('Local actor does not exist');
            }

            actor.id = data.id;
            actor.setName(data.name);
            actor.setAvatar(data.avatar);
            actor.setPosition(data.position);
            actor.setAction(data.action);
            actor.setDirection(data.direction);

        } else {
            // It's a remote user. Setup and associate an Actor
            actor = this.context.find(data.id);

            // Remote doesn't exist, create a new Actor
            if (!actor) {
                actor = new Actor(this.context, {
                    id: data.id,
                    name: data.name,
                    avatar: data.avatar,
                    position: data.position,
                    action: data.action,
                    direction: data.direction
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

        actor.say(data.message);
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
    };


    return Network;
});
