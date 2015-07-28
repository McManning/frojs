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

    Plugin.prototype.createPickerHtml = function() {
        var MAX_AVATARS_PER_PAGE = 5;

        var html = 
            '<div class="myavy-picker">' +
                '<a href="#" class="back">Back</a>' +
                '<ul>';

        // Add thumbnails/links for each avatar in our options
        for (var i = 0; i < this.pickerOptions.length; i++) {
            if (i + 1 % MAX_AVATARS_PER_PAGE === 0) {
                // Start a new page
                html += '</ul><ul class="hide">';
            }

            // Add a thumbnail and link for the avatar
            // TODO: Both of those things here.
            html += '<li><a href="#"><img src="#" /></a></li>';
        }

        html += '</ul>';
        
        // If we had pages, add pagination buttons
        if (this.pickerOptions.length > MAX_AVATARS_PER_PAGE) {
            html += '<a href="#" class="prev-picker-page">Prev</a>' +
                    '<a href="#" class="next-picker-page">Next</a>';
        }

        html += '</div>';
        return html;
    };

    Plugin.prototype.createCurrentHtml = function() {

        var html = 
            '<div class="myavy-current">' +
                '<a href="#" class="back">Back</a>' +
                '<input class="current-avatar" readonly="readonly" />' +
            '</div>';

        return html;
    };

    Plugin.prototype.createUploaderHtml = function() {

        var html = 
            '<div class="myavy-uploader">' +
                '<a href="#" class="back">Back</a>' +
                '<form>' +
                    '<input name="upload" type="file" />' +
                    '<div class="upload-response"></div>' +
                    '<button type="submit">upload</button>' +
                '</form>' +
            '</div>';

        return html;
    };

    Plugin.prototype.createLoadUrlHtml = function() {

        var html = 
            '<div class="myavy-url hide">' +
                '<a href="#" class="back">Back</a>' +
                '<form>' +
                    '<input name="upload" type="file" />' +
                    '<div class="upload-response"></div>' +
                    '<button type="submit">upload</button>' +
                '</form>' +
            '</div>';

        return html;
    };

    Plugin.prototype.createMainMenuHtml = function() {

        var html = '<div class="myavy-options">';

        if (this.enablePicker) {
            html += '<a href="#" class="show-picker">Pick an avatar</a>';
        }

        if (this.enableUrls) {
            html += '<a href="#" class="show-url">Use Url</a>';
        }

        if (this.enableUploads) {
            html += '<a href="#" class="show-uploader">Upload</a>';
        }

        html += '<a href="#" class="show-current">View current avatar url</a>';

        html += '</div>';

        return html;
    };

    /**
     * Generate the html for our plugin dialog. 
     */
    Plugin.prototype.createDialogHtml = function() {

        var html = '<div class="myavy-dialog">';

        html += this.createMainMenuHtml();

        if (this.enablePicker) {
            html += this.createPickerHtml();
        }

        if (this.enableUploads) {
            html += this.createUploaderHtml();
        }

        if (this.enableUrls) {
            html += this.createLoadUrlHtml();
        }

        html += '</div>';

        return html;
    };

    /** 
     * Add jQuery event listeners to our various components
     */
    Plugin.prototype.bindEvents = function() {

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
