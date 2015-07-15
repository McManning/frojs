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

define([
    'Utility'
], function(Util) {
    var vec3 = Util.vec3;
    
    /**
     * Common enumerations accessed throughout modules.
     */
    var Enum = {
        Direction : {
            // Numerics match keypad keys.
            NONE : 0,
            NORTH : 8,
            SOUTH : 2,
            EAST : 6,
            WEST: 4,
            
            NORTHEAST : 9,
            NORTHWEST : 7,
            SOUTHEAST : 3,
            SOUTHWEST : 1,

            /**
             * Converts an Enum.Direction to a character that could be serialized.
             *
             * @param {Enum.Direction} direction to convert
             *
             * @return {string}
             */
            toChar : function(direction) {
                 if (direction > 0 && direction < 10) {
                    return direction.toString();
                } else {
                    return '0';
                }
            },

            /**
             * Returns a direction if the character can be translated to 
             * a direction constant. If it cannot, will return Direction.NONE
             *
             * @return {Enum.Direction}
             */
            fromChar : function(ch) {
                var direction = parseInt(ch);
                if (direction > 0 && direction < 10) {
                    return direction;
                } else {
                    return this.NONE;
                }
            },

            /**
             * Returns a normalized vec3 of this direction.
             *
             * @param {Enum.Direction} direction
             *
             * @return {vec3}
             */
            toVec3 : function(direction) {
                var v = [0, 0];

                switch (direction) {
                    case this.NORTH: v = [0, 1]; break;
                    case this.NORTHEAST: v = [1, 1]; break;
                    case this.NORTHWEST: v = [-1, 1]; break;
                    case this.SOUTH: v = [0, -1]; break;
                    case this.SOUTHEAST: v = [1, -1]; break;
                    case this.SOUTHWEST: v = [-1, -1]; break;
                    case this.EAST: v = [1, 0]; break;
                    case this.WEST: v = [-1, 0]; break;
                }

                v[2] = 0;
                return vec3.create(v);
            },

            /**
             * Returns a direction from any arbitrary vec3.
             *
             * @param {vec3} vec
             *
             * @return {Enum.Direction}
             */
            fromVec3 : function(vec) {
                var normal = vec3.create(),
                    dir = this.NONE;

                vec3.normalize(vec, normal);

                if (normal[1] > 0) {
                    if (normal[0] > 0) {
                        dir = Enum.Direction.NORTHEAST;
                    } else if (normal[0] < 0) {
                        dir = Enum.Direction.NORTHWEST;
                    } else {
                        dir = Enum.Direction.NORTH;
                    }
                } else if (normal[1] < 0) {
                    if (normal[0] > 0) {
                        dir = Enum.Direction.SOUTHEAST;
                    } else if (normal[0] < 0) {
                        dir = Enum.Direction.SOUTHWEST;
                    } else {
                        dir = Enum.Direction.SOUTH;
                    }
                } else if (normal[0] > 0) {
                    dir = Enum.Direction.EAST;
                } else if (normal[0] < 0) {
                    dir = Enum.Direction.WEST;
                }

                return dir;
            }
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
