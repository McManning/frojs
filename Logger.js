
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
	initialise : function(target) {
		this.target = target;
	},

	debug : function(message) {
		this._write(message, this.DEBUG);
	},
	
	notice : function(message) {
		this._write(message, this.NOTICE);
	},
	
	warning : function(message) {
		this._write(message, this.WARNING);
		//throw message;
	},
	
	error : function(message) {
		this._write(message, this.ERROR);
		//throw message;
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

		var msg = '[' + this.getLevelString(level) + '] ' + message.toString();
		
		// If we send important logs to the server, queue them up
		if (level >= this.WARNING && this.writeToServer) { // @todo implement server push
			this.queue.push(msg);
		}
		
		if (this.target) {
			this.target.append('<span class="log-level-' + level + '">' + msg + '</span>');
			this.target.scrollTop(this.target[0].scrollHeight);
		
		} else { // Fall back to console
			console.log(msg);
		}
		
		// @todo proper object printing
		if (typeof message != 'string')
			console.log(message);
	}
}
