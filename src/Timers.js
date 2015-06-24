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

    function Timers() {

        this.intervals = {};
        this.nextId = 0;
        this.avgDeltaTime = 0;
        this.maxDeltaTime = 0;
        this.lastDeltaTime = 0;
    }

    Timers.prototype.run = function() {

        window.setInterval(this.runIntervals.bind(this), 30);
    };

    Timers.prototype.addTimeout = function(caller, callback, delay) {

        return this.addInterval(caller, callback, delay, true);
    };

    Timers.prototype.removeTimeout = function(id) {

        return this.removeInterval(id);
    };

    /**
     * Add a new interval to be ran once or until stopped. Will return
     * the unique ID of the new interval.
     *
     * addInterval callback prototype:
     *   function foo(id, delay, elapsed)
     *      Where ID is the unique ID assigned to this callback,
     *      delay is the requested delay between calls to this callback in milliseconds,
     *      and elapsed is the actual milliseconds between calls to this callback.
     * 
     * @return integer
     */
    Timers.prototype.addInterval = function(caller, callback, delay, runOnce) {
 
        if (runOnce === undefined) {
            runOnce = false;
        }
 
        if (delay === undefined) {
            delay = 1000;
        } else if (delay < 30) {
            throw new Error('Minimum for addInterval: 30ms. Requested ' + delay);
        }
        
        var now = Date.now();
        var id = ++this.nextId;
        
        var interval = {
                caller: caller,
                callback: callback,
                delay: delay,
                runOnce: runOnce,
                lastRun: now
            };
 
        this.intervals[id] = interval;
        return id;
    };
    
    Timers.prototype.removeInterval = function(id) {

        if (typeof id === 'function') { // (fn) 

            for (var i in this.intervals) {
                if (this.intervals.hasOwnProperty(i) &&
                    this.intervals[i].callback === id) {

                    delete this.intervals[i];
                    return;
                }
            }
        } else { // (id)
        
            if (id in this.intervals) {
                delete this.intervals[id];
            }
        }
    };
    
    Timers.prototype.runIntervals = function() {
 
        var now = Date.now();
 
        for (var id in this.intervals) {
            
            if (this.intervals.hasOwnProperty(id)) {
                var current = this.intervals[id];

                while (current.lastRun + current.delay < now) {

                    var elapsed = (now - current.lastRun);
                    current.lastRun += current.delay;
     
                    current.callback.apply(current.caller, [id, current.delay, elapsed]);
                    
                    if (current.runOnce) {
                        delete this.intervals[id];
                        break;
                    }
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
        this.avgDeltaTime = dt * 0.9 + this.lastDeltaTime * 0.1;
        this.lastDeltaTime = dt;
        
        // If this was a spike, record spike value
        if (dt > this.maxDeltaTime) {
            this.maxDeltaTime = dt;
        }
    };

    return Timers;
});
