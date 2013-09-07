
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
			
			this.interval = fro.timers.addInterval(this, function() {
			
				if (this.upstreamBuffer.length > 0) {
					// We don't care what comes back, just send it up
					$.ajax({
						url: this.logServer,
						type: 'POST',
						data: { logs : this.upstreamBuffer }
					});
					
					this.upstreamBuffer = '';
				}
				
			}, 5000, false);
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
		if (level >= this.WARNING && this.logServer) {
			this.upstreamBuffer += msg.toString() + '\n';
		}
		
		if (this.logToConsole) {
			console.log(message);
		}
	}
}
