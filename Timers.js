
"use strict";

/*
	addInterval callback prototype:
		function foo(id, delay, elapsed)
			Where ID is the unique ID assigned to this callback,
			delay is the requested delay between calls to this callback in milliseconds
			elapsed is the actual milliseconds between calls to this callback
*/

fro.timers = {

    initialise : function() {
        this.intervals = {};
		this.nextID = 0;
		
		// Records the average length of time it takes to process all active timers.
		// If this value exceeds a certain threshold, there will be significant lag 
		// within the application. 
		this.avgDeltaTime = 0; 
		this.maxDeltaTime = 0; // Records the maximum time spent during processing
		this.lastDeltaTime = 0;
		
		// @todo also record which timers were processed while changing maxDeltaTime?
		
        window.setInterval(this.runIntervals, 30);
    },
 
	addTimeout : function(caller, callback, delay) {
		return this.addInterval(caller, callback, delay, true);
	},
 
	removeTimeout : function(id) {
		return this.removeInterval(id);
	},
 
    addInterval : function(caller, callback, delay, runOnce) {
 
        if (runOnce == undefined) {
            runOnce = false;
		}
 
        if (delay == undefined) {
            delay = 1000;
		} else if (delay < 30) {
            throw 'Minimum for addInterval: 30ms. Requested ' + delay;
		}
		
        var now = Date.now();
		var id = ++this.nextID;
		
		var interval = {
				caller: caller,
				callback: callback,
				delay: delay,
				runOnce: runOnce,
				lastRun: now
			};
 
        this.intervals[id] = interval;
		return id;
    },
	
	removeInterval : function(id) {
		
		var intervals = this.intervals;
		
		if (typeof id == 'function') { // (fn)
			
			for (var i in intervals) {
				if (intervals[i].callback == id) {
					delete intervals[i];
					return;
				}
			}
		} else { // (id)
		
			if (id in intervals) {
				delete intervals[id];
			}
		}
	},
	
    runIntervals : function() {
 
        var now = Date.now();
 
        var intervals = fro.timers.intervals;
        for (var id in intervals) {
 
            var current = intervals[id];
			
			var counter = 0;
            while (current.lastRun + current.delay < now) {

                var elapsed = (now - current.lastRun);
                current.lastRun += current.delay;
 
                current.callback.apply(current.caller, [id, current.delay, elapsed]);
				
				if (current.runOnce) {
					delete intervals[id];
					break;
				}
            }
        }
		
		// fake busy sleep test 
		/*var date = new Date();
		var curDate = null;
		do { curDate = new Date(); }
		while (curDate-date < 20);
		*/
		
		// Do some statistics generating 
		var dt = Date.now() - now; // The amount of milliseconds passed
		
		// Take a smoothed average of the times 
		fro.timers.avgDeltaTime = dt * 0.9 + fro.timers.lastDeltaTime * 0.1;
		fro.timers.lastDeltaTime = dt;
		
		// If this was a spike, record spike value
		if (dt > fro.timers.maxDeltaTime)
			fro.timers.maxDeltaTime = dt;
			
    }
};
