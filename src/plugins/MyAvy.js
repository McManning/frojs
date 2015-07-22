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
    'fro'
], function(fro) {

    // Shorthand things a bit
    var Actor = fro.entities.Actor;

    if (typeof(Actor) !== 'function') {
        throw Error('Missing Actor entity definition');
    }

    /**
     * Entry point for the MyAvy plugin.
     *
     * @param {object} context fro instance to bind the plugin
     * @param {object} options for this plugin
     */
    function Plugin(context, options) {
        /*
            enablePicker: true,
            pickerOptions: [
                'XXXXXX',
                'http://myavy.net/XXXXXX',
            ],
            enableUploads: true,
            enableUrls: true 
        */  
        this.context = context;

        this.enableUploads = options.enableUploads || true;
        this.enableUrls = options.enableUrls || true;
        this.enablePicker = options.enablePicker || false;
        this.pickerOptions = options.pickerOptions || [];

        // Ensure that there's picker options specified
        if (this.enablePicker && 
            (typeof this.pickerOptions !== 'array' ||
            this.pickerOptions.length < 1)) {

            throw Error(
                'MyAvy.pickerOptions must have at least ' +
                'one url if MyAvy.enablePicker is set.'
            );
        }

        // Generate dialog HTML based on our settings
        this.createDialogHtml();

        // Hook a listener to whenever our player changes avatars
        this.onChangeAvatar = this.onChangeAvatar.bind(this);
        context.player.bind('avatar', this.onChangeAvatar);
    }

    /**
     * Generate the html for our plugin dialog. 
     */
    Plugin.prototype.createDialogHtml = function() {

        // TODO: JQuery-it-up (or just DOM, honestly) and build
        // an interface to upload avatars. Actually, jQuery is 
        // easier due to $.ajax, but whichever. I can get around
        // it, or fallback if jQ isn't available on window.
    };

    /**
     * When the player actor's avatar changes, also update
     * the URI displayed, if it was changed to an avatar with
     * an associated metadata URI.
     */
    Plugin.prototype.onChangeAvatar = function(actor) {
        var avatar = actor.avatar;

        // TODO: Grab input, update it with the avatar if it
        // has an attached URI.
    };

    // Register plugin
    fro.plugins.MyAvy = Plugin;
    return Plugin;
});
