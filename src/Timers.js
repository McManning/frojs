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

        var intervals = {},
            nextId = 0,
            avgDeltaTime = 0,
            maxDeltaTime = 0,
            lastDeltaTime = 0;

        this.run = function() {
            var self = this;
            window.setInterval(function() { self.runIntervals(); }, 30);
        };

        this.addTimeout = function(caller, callback, delay) {
            return this.addInterval(caller, callback, delay, true);
        };

        this.removeTimeout = function(id) {
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
        this.addInterval = function(caller, callback, delay, runOnce) {
     
            if (runOnce === undefined) {
                runOnce = false;
            }
     
            if (delay === undefined) {
                delay = 1000;
            } else if (delay < 30) {
                throw new Error('Minimum for addInterval: 30ms. Requested ' + delay);
            }
            
            var now = Date.now();
            var id = ++nextId;
            
            var interval = {
                    caller: caller,
                    callback: callback,
                    delay: delay,
                    runOnce: runOnce,
                    lastRun: now
                };
     
            intervals[id] = interval;
            return id;
        };
        
        this.removeInterval = function(id) {

            if (typeof id === 'function') { // (fn) 

                for (var i in intervals) {
                    if (intervals.hasOwnProperty(i) &&
                        intervals[i].callback === id) {

                        delete intervals[i];
                        return;
                    }
                }
            } else { // (id)
            
                if (id in intervals) {
                    delete intervals[id];
                }
            }
        };
        
        this.runIntervals = function() {
     
            var now = Date.now();
     
            for (var id in intervals) {
                
                if (intervals.hasOwnProperty(id)) {
                    var current = intervals[id];

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
            avgDeltaTime = dt * 0.9 + lastDeltaTime * 0.1;
            lastDeltaTime = dt;
            
            // If this was a spike, record spike value
            if (dt > maxDeltaTime) {
                maxDeltaTime = dt;
            }
        };
    }

    return Timers;
});
