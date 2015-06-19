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

/** 
 * Manager for all persistent settings
 *
 * Usage: 
 * In modules, call fro.settings.register('module.key', 'default value');
 * Then for retrieval, fro.settings.get('module.key')
 * And for setting, fro.settings.set('module.key', newValue)
 *     Both methods will throw exceptions if the setting has not previously been registered.
 *
 * Additionally, every time set() is called, fro.settings fires an event, named after the key
 * 
 * Example:
 *    fro.settings.bind('keymap.move_up', function(oldValue, newValue) {
 *        // Do 
 *    }
 */
var fro.settings = {
    
    COOKIE_STORAGE_DAYS : 365,
    STORAGE_KEY : 'frojs_settings',
    
    persistentSettings : [],
    dirty : false,
    loaded : false,
    canSave : true,
    storageMethod : 'cookies',
    
    /**
     * Returns a list of supported storage methods for the current machine
     */
    getSupportedMethods : function() {
        
        var supported = [];
        
        // Assume AJAX support is true
        supported.push('http');
        
        // Check for cookies support
        var cookieEnabled = (navigator.cookieEnabled);
        if (typeof navigator.cookieEnabled == "undefined" && !cookieEnabled) {
            document.cookie = "testcookie";
            cookieEnabled = (document.cookie.indexOf("testcookie") != -1);
        }
        
        if (cookieEnabled) {
            supported.push('cookies');
        }
        
        // Check for HTML5 localStorage
        try {
            if ('localStorage' in window && window['localStorage'] !== null) {
                supported.push('localStorage');
            }
        } catch (e) {
            // not supported, and exploded :(
        }
        
        return supported;
    },
    
    initialise : function(options) {
        
        // make sure the storage method is supported
        if (!(options.settingsStorage in this.getSupportedMethods())) {
            fro.log.error('[fro.settings] Storage method ' + options.settingsStorage 
                            + ' not supported. Settings will not be saved'
                        );
            
            this.canSave = false;
        }
        
        this.storageMethod = options.settingsStorage;
        
        this.load();
    },
    
    register : function(id, defaultValue) {
    
        if (typeof this.persistentSettings[id] == 'undefined') {
            this.persistentSettings[id] = defaultValue;
        }
    },
    
    get : function(id) {
        
        if (typeof this.persistentSettings[id] == 'undefined') {
            throw new Error('[fro.setting] ' + id + ' does not exist');
        }
        
        return this.persistentSettings[id];
    },
    
    set : function(id, newValue) {

        if (typeof this.persistentSettings[id] == 'undefined') {
            throw new Error('[fro.setting] ' + id + ' does not exist');
        }
        
        var oldValue = this.persistentSettings[id];
        this.persistentSettings[id] = newValue;
        
        this.dirty = true;
        
        // Fire set event with parameters: oldValue, newValue
        this.fire(id, oldValue, newValue);
    },
    
    /** 
     * Load all settings from our chosen persistent storage
     */
    load : function() {

        var json;
        
        // Flag a loading state, in case we need to do an async
        // call out to retrieve settings
        this.loaded = false;
        
        if (this.storageMethod == 'cookies') { // standard cookies

            var cookie = document.cookie;
            var start = cookie.indexOf(' ' + this.STORAGE_KEY + '=');
            
            if (start == -1) {
                start = cookie.indexOf(this.STORAGE_KEY + '=');
            }
            
            if (start == -1) {
                json = '[]';
            } else {
                start = cookie.indexOf("=", start) + 1;
                var end = cookie.indexOf(";", start);
                if (end == -1) {
                    end = cookie.length;
                }
                json = unescape(cookie.substring(start, end));
            }
        
        } else if (this.storageMethod == 'localStorage') { // HTML5 localStorage
            
            json = window.localStorage[this.STORAGE_KEY];
        
        } else if (this.storageMethod.indexOf('http') == 0) { // AJAX get from a server
            
            var self = this;
            $.ajax({
                type: "GET",
                url: this.storageMethod,
                dataType: 'json',
                success: function(data) {
                    self._loadSettingsFromJSON(data);
                    self.loaded = true;
                },
                error: function() {
                    // @todo verbosity
                    throw new Error('[fro.settings] Error while contacting ' + this.storageMethod);
                },
            });
            
            // Wait for ajax to finish
            return; 
        }
        
        this._loadSettingsFromJSON(json);
        this.loaded = true;
    },
    
    _loadSettingsFromJSON : function(json) {
        
        try {
            if (typeof json == 'string') {
                this.persistentSettings = JSON.parse(json);
            } else {
                this.persistentSettings = json;
            }
        } catch (e) {
            throw new Error('[fro.settings] Failed to parse JSON from storage method "' 
                    + this.storageMethod + '" - ' + e.toString());
        }
        
        this.fire('loaded');
    }
    
    /** 
     * Save all settings to our chosen persistent storage 
     */
    save : function() {
        
        // If we're trying to save to an unsupported method, skip out
        if (!this.canSave) return; 
    
        // serialize settings
        var json = JSON.stringify(this.persistentSettings);
        
        if (this.storageMethod == 'cookies') { // standard cookies
        
            var expires = new Date();
            expires.setDate(expires.getDate() + this.COOKIE_STORAGE_DAYS);
            
            var cookie = escape(json) + ((expires == null) ? '' : '; expires=' + expires.toUTCString());
            document.cookie = this.STORAGE_KEY + '=' + cookie;
        
        } else if (this.storageMethod == 'localStorage') { // HTML5 localStorage
            
            window.localStorage[this.STORAGE_KEY] = json;
            
        } else if (this.storageMethod.indexOf('http') == 0) { // AJAX posting to a server
            
            $.ajax({
                type: "POST",
                url: this.storageMethod,
                data: this.persistentSettings,
                dataType: 'json',
                success: function() {
                    // @todo something?
                    this.fire('saved');
                },
                error: function() {
                    // @todo something?
                },
            });
            
            return;
        }
        
        this.fire('saved');
    }
    
}




