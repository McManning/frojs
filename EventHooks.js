
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
						fn.callback.apply( fn.obj, [data] );
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
