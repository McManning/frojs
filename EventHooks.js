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

/**
 * A basic extension to bind event listeners to objects
 */
var EventHooks = {

	bind: function( evt, obj, fn ) {

		if (obj == null && fn == null) { // (evt)
			return this;
		} else if (typeof obj == 'function') { // (evt, fn)
			fn = obj;
			obj = this;
		} // otherwise, (evt, obj, fn)
		
		var namespaces = '';
		
		// Split multiple event bindings into multiple triggers
		var events = evt.split(',');
		
		for (var i in events) {
			
			// Clean up each bind
			evt = events[i].trim();

			// Check if the bind is namespaced
			if (evt.indexOf('.') >= 0) {
				namespaces = evt.split('.');
				evt = namespaces.shift();
				namespaces.sort();
				namespaces = namespaces.join('.');
			}
			
			if (this._events == undefined) {
				this._events = {};
				this._events[evt] = new Array();
				
			} else if (!(evt in this._events)) {
				this._events[evt] = new Array();
			}
			
			this._events[evt].push({
				callback: fn,
				obj: obj,
				namespaces: namespaces,
			});
		}
		
		return this;
	},
	
	unbind: function(evt, fn) {
		
		throw 'Needs refactoring';
		
		// @todo also allow (obj), (evt, obj) calls
		if (fn == null) { 
			if (typeof evt == 'function') { // (fn)
				fn = evt;
				evt = undefined;
			} else if (evt == null) { // ()
				evt = undefined;
				fn = undefined;
			} else { // (evt)
				fn = undefined;
			}
		}
		
		if (evt != undefined) {
			
			if (evt in this._events) {
				if (fn != undefined) {
					// Remove a specific function reference for this event

					var evts = this._events[evt];
					
					var len = evts.length;
					while (len--) {
						if (evts[len] == fn) {
							evts.splice(len, 1);
						}
					}
					
				} else { 
					// Remove all binds for this event
					
					delete this._events[evt];
				}
			}
			
		} else {
			
			if (fn != undefined) {
				// Remove a specific function from all events
				for (e in this._events) {
					var len = this._events[e].length;
					while (len--) {
						if (this._events[e][len] == fn) {
							this._events[e].splice(len, 1);
						}
					}
				}
				
			} else {
				// Remove all binds
				this._events = {};
			}
		}
		
		return this;
	},
	
	fire: function(evt, data) {
	
		var namespaces_re = null;
		
		if (evt.indexOf('.') >= 0) {
			var namespaces = evt.split('.');
			evt = namespaces.shift();
			
			if (namespaces.length > 0) {
				namespaces.sort();
				namespaces_re = new RegExp( "(^|\\.)"
								+ namespaces.join("\\.(?:.*\\.|)") 
								+ "(\\.|$)" );
			}
		}
		
		if (this._events != undefined) {
			if (evt in this._events) { 
				for (var e in this._events[evt]) {
					
					var fn = this._events[evt][e];
					
					if (!namespaces_re || namespaces_re.test( fn.namespaces )) {
						try {
							fn.callback.apply( fn.obj, [data] );
						} catch (e) {
							fro.log.error('Exception during event ' + evt + ': ' + e.stack);
						}
					}
				}
			}
		}
		
	}
	
};


function eventhooks_unit_tests() {
	
	EventHooks.bind('testevt', function() {
		console.log('testevt fired');
	})
	.bind('testevt.my_namespace', function() {
		console.log('testevt.my_namespace fired');
	})
	.bind('testevt.otherns.my_namespace', function() {
		console.log('testevt.otherns.my_namespace fired');
	})
	.bind('testevt.other.blah', function() {
		console.log('testevt.other.blah fired');
	})
	.bind('testevt.other', function() {
		console.log('testevt.other fired');
	})
	.bind('blah', function() {
		console.log('blah fired');
	});
	
	EventHooks.fire('testevt.my_namespace');
	console.log('------');
	EventHooks.fire('testevt');
	console.log('------');
	EventHooks.fire('blah');
	console.log('------');
    EventHooks.fire('other');
}
