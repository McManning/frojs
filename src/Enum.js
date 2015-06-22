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
     * Common enumerations accessed throughout modules.
     */
    var Enum = {
        Direction : {
            NONE : 0,
            NORTH : 1,
            SOUTH : 2,
            EAST : 4,
            WEST: 8,
            
            NORTHEAST : 5,
            NORTHWEST : 9,
            SOUTHEAST : 6,
            SOUTHWEST : 10
        },

        Speed : {
            WALK : 4,
            RUN : 8
        },

        Action : {
            IDLE : 0,
            MOVE : 1,
            SIT : 2,
            JUMP : 3
        }
    };

    if (Object.freeze) {
        Object.freeze(Enum);
    }

    return Enum;
});
