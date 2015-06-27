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
     * A timer that can run once, or multiple times. 
     *
     * @param {function} callback when interval milliseconds have passed
     * @param {int} interval milliseconds between callbacks
     * @param {bool} lazy if true, will not attempt to play "catch up" and call
     *                    the callback multiple times if the manager lags.
     * @param {bool} runOnce if true, timer will stop and detach itself from 
     *                       the manager once fired. Optional
     */
    function Timer(callback, interval, lazy, runOnce) {

        this.id = manager.getNextId();

        this.callback = callback;
        this.interval = interval;
        this.lazy = lazy;
        this.runOnce = runOnce || false;

        this.running = false;
        this.lastRun = Date.now();

        this.run.bind(this);

        window.setTimeout(this.run, this.interval);
    }

    Timer.prototype.run = function(now) {

        if (!this.running) {
            return;
        }

        var now = Date.now();

        this.callback(this, now - this.lastRun);
        this.lastRun = now;
        this.planned += this.interval;

        this.timeout = window.setTimeout(this.run, this.planned - now);
    };

    /**
     * Start this timer after a stop(). The next time it 
     * fires will be now + this.interval milliseconds.
     */
    Timer.prototype.start = function() {
        this.running = true;
        this.planned = Date.now() + this.interval;
        this.lastRun = Date.now();
        this.timeout = window.setTimeout(this.tick, this.interval);
    };

    /**
     * Stop this timer from processing. A stopped timer
     * will not attempt to play catch-up after start(). 
     */
    Timer.prototype.stop = function() {
        this.running = false;
        window.clearTimeout(this.timeout);
    };

    Timer.prototype.destroy = function() {
        manager.remove(this);
    };

    return Timer;
});
