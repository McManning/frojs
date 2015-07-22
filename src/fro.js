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

define(function(require) {

    // Expose modules
    return {
        VERSION: '0.1.0',

        // Expose object constructors
        World: require('World'),
        Timer: require('Timer'),
        utils: require('Utility'),
        enum: require('Enum'),
        // Note: utils/enum naming conventions are intentional since
        // they're object literals, not constructor.

        // Expose entity types
        entities: {
            Entity: require('entity/Entity'),
            Actor: require('entity/Actor'),
            Prop: require('entity/Prop'),
            RemoteActor: require('entity/RemoteActor'),
            Sound: require('entity/Sound')
        },

        // Expose resource types
        resources: {
            Animation: require('resource/Animation'),
            FontImage: require('resource/FontImage'),
            Image: require('resource/Image'),
            Json: require('resource/Json'),
            Shader: require('resource/Shader'),
            Sound: require('resource/Sound')
        },

        // Expose an empty container for external plugins
        plugins: {}
    };
});
