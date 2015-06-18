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

fro.log = {
	
	// Log levels
	DEBUG : 0,
	NOTICE : 1,
	WARNING : 2,
	ERROR : 3,

	/**
	 *  
	 * @param target Indicates where our logs will be printed to.
	 *     Should be a jQuery selector
	 */
	initialise : function(options) {
	
		if ('logToConsole' in options) {
			this.logToConsole = options.logToConsole;
		}
		
		if ('logServer' in options) {
			this.logServer = options.logServer;
			this.upstreamBuffer = '';
			
			this.interval = window.setInterval(function() {
				fro.log.pushToServer();
			}, 5000, false);
		}
		
	},

	pushToServer : function() {

		if (this.upstreamBuffer.length > 0) {
			// We don't care what comes back, just send it up
			$.ajax({
				url: this.logServer,
				type: 'POST',
				data: { logs : this.upstreamBuffer }
			});
			
			this.upstreamBuffer = '';
		}
	},
	
	debug : function(message) {
		this._write(message, this.DEBUG);
	},
	
	notice : function(message) {
		this._write(message, this.NOTICE);
	},
	
	warning : function(message) {
		this._write(message, this.WARNING);
	},
	
	error : function(message) {
		this._write(message, this.ERROR);
	},

	getLevelString : function(level) {
		switch (level) {
			case this.DEBUG: return 'DBG';
			case this.NOTICE: return 'LOG';
			case this.WARNING: return 'WARN';
			case this.ERROR: return 'ERR';
			default: return '';
		}
	},
	
	_write : function(message, level) {

		// if it's an object without a custom toString(), lazily print fields instead
		if (typeof message == 'object' && message.toString() == '[object Object]') {
			var output = 'Object Properties\n';
			for (var property in message) {
				output += '    ' + property + ': ' + message[property] + '\n';
			}
			message = output;
		}
	
		var msg = '[' + this.getLevelString(level) + '] ' + message.toString();
		
		// If we send important logs to the server, queue them up
		if (level >= this.WARNING && this.logServer) {
			this.upstreamBuffer += msg.toString() + '\n';
		}
		
		if (this.logToConsole) {
			console.log(msg);
		}
	}
}
