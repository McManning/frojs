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
    // Resources exposed to the global context

    // Public modules
    var World = require('World'),
        Timer = require('Timer'),
        utils = require('Utility');

        // Note: 'utils' naming is intentional since 
        // it's an object literal, not a constructor.

    // Entity types
    var Entity = require('entity/Entity'),
        Actor = require('entity/Actor'),
        Prop = require('entity/Prop'),
        RemotePlayer = require('entity/RemotePlayer'),
        Sound = require('entity/Sound');

    // Resource types
    var Animation = require('resource/Animation'),
        FontImage = require('resource/FontImage'),
        Image = require('resource/Image'),
        Json = require('resource/Json'),
        Shader = require('resource/Shader'),
        SoundResource = require('resource/Sound');

    // Expose modules
    return {
        World: World,
        Timer: Timer,
        utils: utils,
        entities: {
            Entity: Entity,
            Actor: Actor,
            Prop: Prop,
            RemotePlayer: RemotePlayer,
            Sound: Sound
        },
        resources: {
            Animation: Animation,
            FontImage: FontImage,
            Image: Image,
            Json: Json,
            Shader: Shader,
            Sound: SoundResource
        },
        plugins: {
            // Added to externally
        }
    };
});
