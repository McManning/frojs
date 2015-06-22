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

;(function(fro, undefined) {

    // Duration before we cancel an avatar load due to network issues
    var AVATAR_LOAD_TIMEOUT = (30*1000); // 30s timeout

    // Specify default metadata to load in case of error,
    // or the user has no avatar to load
    var DEFAULT_AVATAR = {
        "id": "myavy.default",
        "url": "myavy.default",
        
        "width": 32,
        "height": 64,
        /*"keyframes": {
            "move_2": {
                "loop": false,
                "frames": [0, 1000, 1, 1000, 0, 1000, 2, 1000]
            },
            "move_8": {
                "loop": false,
                "frames": [3, 1000, 4, 1000, 3, 1000, 5, 1000]
            },
            "move_4": {
                "loop": false,
                "frames": [6, 1000, 7, 1000, 6, 1000, 8, 1000]
            },
            "move_6": {
                "loop": false,
                "frames": [9, 1000, 10, 1000, 9, 1000, 11, 1000]
            },
            "stop_2": {
                "loop": false,
                "frames": [0, 1]
            },
            "stop_8": {
                "loop": false,
                "frames": [3, 1]
            },
            "stop_4": {
                "loop": false,
                "frames": [6, 1]
            },
            "stop_6": {
                "loop": false,
                "frames": [9, 1]
            },
            "act_2": {
                "loop": false,
                "frames": [12, 1]
            }
        }*/
        "keyframes": {
            "move_2": {
                "loop": false,
                "frames": [0, 1000, 1, 1000]
            },
            "move_8": {
                "loop": false,
                "frames": [3, 1000, 4, 1000]
            },
            "move_4": {
                "loop": false,
                "frames": [6, 1000, 7, 1000]
            },
            "move_6": {
                "loop": false,
                "frames": [9, 1000, 10, 1000]
            },
            "stop_2": {
                "loop": false,
                "frames": [2, 1]
            },
            "stop_8": {
                "loop": false,
                "frames": [5, 1]
            },
            "stop_4": {
                "loop": false,
                "frames": [7, 1]
            },
            "stop_6": {
                "loop": false,
                "frames": [10, 1]
            },
            "act_2": {
                "loop": false,
                "frames": [8, 1]
            }
        }
    };
    
    function _onError(entity, id, error) {
        
        // kill loader entity
        if (entity.avatarLoader) {
            entity.avatarLoader.destroy();
        }
        
        // notify system (if local, or debugging)
        fro.log.warning('Avatar load error: ' + error + ' for ' + id);
    }
    
    function _onReady(entity, id, avatar) {
        
        // kill loader entity
        if (entity.avatarLoader) {
            entity.avatarLoader.destroy();
        }
        
        // Finally set as our entity's avatar
        entity.applyAvatar(avatar);
    }
    
    function _onMetadata(entity, id, metadata) {
        
        var avatar = new Avatar();
        
        // Bind the new avatar ready/error events to notify this plugin
        avatar.bind('ready', function() {
        
            _onReady(entity, id, this);
        })
        .bind('error', function(error) {
            
            _onError(entity, id, error);
        });
        
        // Load the metadata into the avatar and let it take over
        avatar.load(id, metadata);
    }
    
    function _attachLoader(entity) {
        
        var pos = entity.getPosition();
        
        var props = {
            "image":"myavy.loader",
            
            "delay":150,
            "offset_y":5,
            "w":46,
            "h":40,
            "d":0,
            
            "x":pos[0],
            "y":pos[1],
            "z":1
        };
        
        var loader = fro.world.loadProp('myavy.loader.' + entity.eid, props);
        entity.avatarLoader = loader;
        
        // bind loader to move with our entity
        entity.bind('move.avatarLoader', function() {
            
            // @todo there is (definitely) a chance for multiple binds to be
            // attached to this entity, as we never unbind (since, it's broken...)
            if (this.avatarLoader) {
                this.avatarLoader.setPosition(this.getPosition());
            }
        })
        .bind('destroy.avatarLoader', function() {
            if (this.avatarLoader) {
                this.avatarLoader.destroy();
            }
        });

    }
    
    function _setAvatar(entity, url) {
    
        if (typeof url == 'object') {
            
            // assume this is a passed in metadata object, skip the download process
            _onMetadata(entity, url, url);
            
        } else {
            if (url.toString().indexOf('myavy.net') >= 0 
                || url.toString().indexOf('localhost') >= 0) {
                
                // attach a loader entity
                _attachLoader(entity);
                
                // Retrieve metadata from our source URL
                $.ajax({
                    url: url,
                    dataType: 'jsonp',
                    timeout: AVATAR_LOAD_TIMEOUT,
                    success: function(data) {
                        _onMetadata(entity, url, data);
                    },
                    error: function(xhr, status, error) {
                        // Either json parsing failed, or the server
                        // refused to respond to the request
                        _onError(entity, url, error);
                    }
                });

            } else if (url == 'default') {
                // Also handle requests for the default avatar
                // (@todo this should actually be an internal
                // plugin that deals with "unknown" urls)
                
                // Skip metadata load process and use the embedded object
                _onMetadata(entity, url, DEFAULT_AVATAR);
            }
        }
    }
    
    fro.plugins.myavy = {

        initialise : function(options) {
            
            //options = $.extend(this.options, options);
            
            fro.world.bind('new.entity', function(entity) {
                
                if (entity instanceof Map_Actor) {
                    entity.bind('avatar.set', function(id) {
                        _setAvatar(this, id);
                    });
                }
            })
        },
        
        preload : {
            "required" : [
                {
                    "id":"myavy.loader",
                    "type":"image",
                    "url":"/frojs/resources/img/avatar_load.png",
                    "width":46,
                    "height":40,
                    "shader":"default_shader",
                    "fitToTexture":false
                },
                {
                    "id":"myavy.default",
                    "type":"image",
                    "url":"/frojs/resources/img/default_avatar.png",
                    "width":32,
                    "height":64,
                    "shader":"default_shader",
                    "fitToTexture":false
                }
            ],
            "optional" : [
                // Resources that load during preload, but don't prevent the process
                // from finishing would go here.
            ]
        }
        
    };
    
})(fro);