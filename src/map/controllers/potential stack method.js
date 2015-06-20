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

/*
    Rather than using the original fro method of action buffers and exact-detailed movement patterns, 
    I will be implementing an estimation "that's about right" algorithm to reduce code complexity, and 
    (hopefully) reduce packet size. 
    
    The basic idea would be to send our current position to all clients every N seconds, creating at worse an N*2 
    second sync delay between all clients (N before send, another 0-N before actions are mirrored on remote clients).
    Worst case being N*2 because no matter what, movement patterns will be reduced to straight lines, unless of course
    the movement is already a straight line (thus N*2)
    
    The main issue to tackle is replicating obstacle avoidance. If a remote client moves around a solid object between
    those N seconds, and we send the position in front of and behind that object, other clients will show the remote
    actually walking THROUGH the solid object. Which, of course, is not a desired result.
    
    The proposed solution to this problem is as follows:
    
    An algorithm will be implemented to simplify a path as much as possible, keeping all obstacle avoidance points
    and removing all unnecessary movement (ex: Someone running in a circle, or making a wide arc around an object)
    
    Simplified, the algorithm is defined as:
    - Set our current position as origin
    - Each time our actor changes direction, push the coordinate onto a position stack
    - Every N seconds
        for each coordinate in the position stack:
            if there is a solid object between this coordinate and origin:
                send *previous* coordinate in the stack (index-1) to remote clients
                set *previous* coordinate in the stack as origin
            
            if there no next item in the position stack (at last item):
                send this coordinate in the stack to remote clients
                
        Set our current position as origin
        
    Pitfalls of this algorithm:
    - Movement "jerking", as local rendering of remote clients reach points faster than their remote counterparts,
        and have to wait (stop & stand) for the next set of coordinates sent over the network
    
*/

// @todo
Map_Player.prototype.processPositionStack = function() {

    var position = this.getPosition();

    // Process and optimize our position stack for sending over the network
    if (this.lastPosition[0] != position[0] || this.lastPosition[1] != position[1]) {

        var i, origin = this.lastPosition;
        
        for (i in this.positionStack) {
            
            // If there's no clear path between these two points, send previous middle-point
            if (FRO_Engine.world.pathBlocked(origin, this.positionStack[i])) {
                
                if (i < 1)
                    throw 'Somehow got index 0';
                
                this.sendPositionState(this.positionStack[i-1]);
                origin = this.positionStack[i-1];
            }
        
        }
        
        // Send the last position in the stack
        if (this.positionStack[i])
            this.sendPositionState(this.positionStack[i]);
        
        // @todo: Send the last position in the stack, or current position?
        // I'd assume current position, so we can also send current direction & action and leave
        // out those details in the unnecessary intermediate points. 
        
        // Clear the stack
        this.positionStack.length = 0; // @todo proper "clear"
        
        // Random debugging test
    /*    var line = new Map_Line('', {
            x: this.lastPosition[0],
            y: this.lastPosition[1],
            dx: position[0],
            dy: position[1],
            ttl: 1000,
            z: 0,
        });
        
        FRO_Engine.world.addRenderableObject(line);*/
        
        // Update last origin point to process the next stack
        //this.lastPosition = origin;
        vec3.set(position, this.lastPosition);

    }
    
}

/** 
 * Send a position state over the network to remote clients
 * @param vec3 position Point to send to clients
 * @param number direction Optional direction to set when reaching the position, 
 *   if not supplied, remote clients will assume a direction.
 * @param number action Optional action to set when reaching the position,
 *   if not supplied, remote clients will assume an action (which is usually standing)
 */
Map_Player.prototype.sendPositionState = function(position, direction, action) {

    console.log('NET SEND: ' + vec3.str(position) 
        + ' ' + ((direction != undefined) ? direction : 'nil') + 
        + ' ' + ((action != undefined) ? action : 'nil'));
}
