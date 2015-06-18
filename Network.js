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

var PING_INTERVAL = 30*1000;

/**
 * Handles messages between clients and the server
 */
fro.network = $.extend({

	initialise : function() {
		this.connected = false;
	},
	
	/** 
	 * Creates a new WebSocket connection to our server, and sets up callbacks
	 */
	connect : function(host) {
		
		// "ws://sornax.com:50007/universe"
		var socket = new WebSocket(host);
		
		socket.onopen = function() {
			fro.network._onOpen();
		}
		
		socket.onclose = function(evt) {
			fro.network._onClose(evt);
		}
		
		socket.onerror = function(evt) {
			fro.network._onError(evt);
		}
		
		socket.onmessage = function(evt) {
			fro.network._onMessage(evt);
		}
		
		this.socket = socket;

		this.bind('ping', function(evt) {
		
			// Respond with a pong
			this.send({ id: 'pong' });
		
		}).bind('pong', function(evt) {
		
			// do nothing (for now, later it should flag a "we got it")
			fro.log.debug('PONG ' + evt.now);
			
		});
		
	},
	
	_onOpen : function() {
		
		this.connected = true;
		this.fire('open');
		
		// @todo only ping when necessary, and actually handle pings. 
		// For now, this is just here to keep Firefox from closing ws
		this.pingInterval = 
			fro.timers.addInterval(this, this.ping, PING_INTERVAL);
	},
	
	/**
	 * Validates message, converts JSON to an object, and sends to
	 *   event listeners, including entity event listeners if this packet
	 *   was configured for sending to entities
	 */
	_onMessage : function(evt) {
		
		var packet;
		
		fro.log.debug(evt.data);
		
		try {
			packet = JSON.parse(evt.data);
		} catch (e) {
			fro.log.warning('Invalid Message: ' + evt.data.toString());
			return;
		}
		
		// Fire again, this time as the new ID and data structure
		this.fire(packet.id, packet);
	},
	
	_onClose : function(evt) {
		
		// Notify listeners
		this.connected = false;
		this.fire('close', evt);
		
		this.socket = undefined;
		
		fro.log.warning('Socket closed');
		fro.log.debug(evt);
	},
	
	_onError : function(evt) {
		
		// Notify listeners
		this.connected = false;
		this.fire('error', evt);
		
		this.socket = undefined;
		
		fro.log.error('Socket Error');
		fro.log.debug(evt);
	},
	
	ping : function() {
		
		if (this.socket) {
			this.socket.send('{"id":"ping"}');
		}
	},
	
	/**
	 * Converts the input data to JSON and sends over our open socket
	 */
	send : function(packet) {
	
		if (this.socket) {
			if (typeof packet.id == 'string' && packet.id.length > 0) {
				
				var msg = JSON.stringify(packet);
				fro.log.debug(msg);
				
				this.socket.send(msg);
			
			} else {
				
				// @todo somehow track where this packet came from
				fro.log.error('Invalid Packet');
			}
		}
	},
	
	/**
	 * Converts the input data to JSON and sends via ajax to the defined host
	 */
	ajax : function(host, data) {
		
		var json = JSON.stringify(data);
		
		$.ajax({
			url: host,
			data: { json: json },
			success: function(data) {
			
				// Route ajax responses the same way as socket responses
				this._onMessage(data);
			},
			error: function(request, status, error) {
				
				// @todo notification
				fro.log.error('Request failed "' + error + '" for request ' + json);
			}
		});
		
	}
	
}, EventHooks);

