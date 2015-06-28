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
     * A self-correcting timer that can handle drift, as well as burst
     * processing when window.setTimeout does not execute at expected speeds
     * (e.g. the browser window is not focused).
     *
     * @param {function} callback when interval milliseconds have passed
     * @param {int} interval milliseconds between callbacks
     * @param {bool} lazy if true, will not perform burst calls when the 
     *                    browser does not respect setTimeout. Optional.
     */
    function Timer(callback, interval /*, lazy */) {

        this.callback = callback;
        this.interval = interval;
        //this.lazy = !!lazy;
        // TODO: Resolve laziness... 

        this.running = false;

        //this.actualRuns = 0;
    }

    Timer.prototype.tick = function() {
        if (!this.running) {
            return;
        }

        var now = Date.now();

        //console.log('plan   ' + (this.planned - this.lastRun));
        //console.log('drift  ' + (now - this.planned));
        //console.log('actual ' + (now - this.actual));

        this.callback(this, now - (this.planned - this.interval));

        //this.actualRuns++;

        // Check for catch-up
        this.lastRun = this.planned;
        this.planned += this.interval;

        while (this.planned < now) {
            
            //console.log('catch-up');

            // TODO: The delta passed in isn't actually 0. It could be
            // drift by a few milliseconds (or longer, depending on the callback)
            this.callback(this, 0);
            this.lastRun = this.planned;
            this.planned += this.interval;
            
            //this.actualRuns++;
        }

        //console.log(
        //    'actual ' + this.actualRuns + ' vs expected ' + 
        //    ((now - this.actual) / this.interval)
        //);

        // Note: binding this.run is done in each call, as we can't do this just
        // once. 
        this.timeout = window.setTimeout(this.tick.bind(this), this.planned - now);
    };

    /**
     * Start this timer after a stop(). The next time it 
     * fires will be now + this.interval milliseconds.
     */
    Timer.prototype.start = function() {
        this.running = true;
        this.planned = Date.now() + this.interval;
        this.lastRun = Date.now();
        //this.actual = Date.now();

        this.timeout = window.setTimeout(
            this.tick.bind(this), this.interval
        );
    };

    /**
     * Stop this timer from processing. A stopped timer
     * will not attempt to play catch-up after start(). 
     */
    Timer.prototype.stop = function() {
        if (this.running) {
            this.running = false;
            window.clearTimeout(this.timeout);
        }
    };

    return Timer;
});
