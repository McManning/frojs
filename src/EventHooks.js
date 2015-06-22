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
define([], function() {

    /**
     * A basic extension to bind event listeners to objects
     */
    return {
        bind: function(evt, obj, fn) {

            if (obj === null && fn === null) { // (evt)
                return this;
            } else if (typeof obj === 'function') { // (evt, fn)
                fn = obj;
                obj = this;
            } // otherwise, (evt, obj, fn)
            
            var namespaces = '';
            
            // Split multiple event bindings into multiple triggers
            var events = evt.split(',');
            
            for (var i = 0; i < events.length; i++) {
                
                // Clean up each bind
                evt = events[i].trim();

                // Check if the bind is namespaced
                if (evt.indexOf('.') >= 0) {
                    namespaces = evt.split('.');
                    evt = namespaces.shift();
                    namespaces.sort();
                    namespaces = namespaces.join('.');
                }
                
                if (typeof this._events === 'undefined') {
                    this._events = {};
                    this._events[evt] = [];
                    
                } else if (!(evt in this._events)) {
                    this._events[evt] = [];
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
            
            // TODO: Refactor all of this actual logic, it's outdated.

            var len;

            // @todo also allow (obj), (evt, obj) calls
            if (fn === null) { 
                if (typeof evt === 'function') { // (fn)
                    fn = evt;
                    evt = undefined;
                } else if (evt === null) { // ()
                    evt = undefined;
                    fn = undefined;
                } else { // (evt)
                    fn = undefined;
                }
            }
            
            if (typeof evt !== 'undefined') {
                
                if (evt in this._events) {
                    if (typeof fn !== 'undefined') {
                        // Remove a specific function reference for this event

                        len = this._events[evt].length;
                        while (len--) {
                            if (this._events[evt][len] === fn) {
                                this._events[evt].splice(len, 1);
                            }
                        }
                        
                    } else { 
                        // Remove all binds for this event
                        delete this._events[evt];
                    }
                }
                
            } else {
                
                if (typeof fn !== 'undefined') {

                    // Remove a specific function from all events
                    for (var e in this._events) {
                        if (this._events.hasOwnProperty(e)) {
                            len = this._events[e].length;
                            // TODO: wrong. Nice splice during an forin. :/
                            while (len--) {
                                if (this._events[e][len] === fn) {
                                    this._events[e].splice(len, 1);
                                }
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
            
            if (~evt.indexOf('.')) {
                var namespaces = evt.split('.');
                evt = namespaces.shift();
                
                if (namespaces.length > 0) {
                    namespaces.sort();
                    namespaces_re = new RegExp( "(^|\\.)" +
                                    namespaces.join("\\.(?:.*\\.|)") +
                                    "(\\.|$)" );
                }
            }
            
            if (typeof this._events === 'undefined' || !(evt in this._events)) {
                return;
            }

            for (var e = 0; e < this._events[evt].length; e++) {
                var fn = this._events[evt][e];
                
                if (!namespaces_re || namespaces_re.test( fn.namespaces )) {
                    try {
                        fn.callback.apply( fn.obj, [data] );
                    } catch (exception) {
                        throw new Error('Exception during event [' + evt + ']: ' + exception.stack);
                    }
                }
            }
        }

    };

});
