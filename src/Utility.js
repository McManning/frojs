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

// Stuff that have no real home


define([
    'glMatrix'
], function(glMatrix) {

    var htmlEntityMap = {
        "&": "&amp;",
        "<": "&lt;",
        ">": "&gt;",
        '"': '&quot;',
        "'": '&#39;',
        "/": '&#x2F;'
    };

    return {
        rect: glMatrix.rect,
        vec3: glMatrix.vec3,
        mat3: glMatrix.mat3, 
        mat4: glMatrix.mat4,
        quat4: glMatrix.quat4,

        /**
         * Utility method to escape HTML content from strings (chat, nicknames, etc)
         */
        escape: function(string) {
            return String(string).replace(/[&<>"'\/]/g, function (s) {
                return htmlEntityMap[s];
            });
        },

        /**
         * Utilize a worker canvas to split a block of text into multiple 
         * lines and populate the input `text` array.
         * 
         * @author http://delphic.me.uk/webgltext.html
         * 
         * @param {context} ctx Canvas context rendering the string
         * @param {string} textToWrite Text to be broken up into multiple lines
         * @param {number} maxWidth Maximum width of a single line of text
         * @param {array} text Split lines will be dumped into this array
         * 
         * @return {integer} final width of the rendered text
         */
        createMultilineText : function(ctx, textToWrite, maxWidth, text) {
            textToWrite = textToWrite.replace("\n"," ");
            var currentText = textToWrite;
            var futureText;
            var subWidth = 0;
            var maxLineWidth = 0;
            
            var wordArray = textToWrite.split(" ");
            var wordsInCurrent, wordArrayLength;
            wordsInCurrent = wordArrayLength = wordArray.length;
            
            // Reduce currentText until it is less than maxWidth or is a single word
            // futureText var keeps track of text not yet written to a text line
            while (ctx.measureText(currentText).width > maxWidth && wordsInCurrent > 1) {
                wordsInCurrent--;
                
                currentText = futureText = "";
                for (var i = 0; i < wordArrayLength; i++) {
                    if (i < wordsInCurrent) {
                        currentText += wordArray[i];
                        if (i+1 < wordsInCurrent) { currentText += " "; }
                    }
                    else {
                        futureText += wordArray[i];
                        if(i+1 < wordArrayLength) { futureText += " "; }
                    }
                }
            }
            
            text.push(currentText); // Write this line of text to the array
            maxLineWidth = Math.ceil(ctx.measureText(currentText).width);
            
            // If there is any text left to be written call the function again
            if (futureText) {
                subWidth = this.createMultilineText(ctx, futureText, maxWidth, text);
                if (subWidth > maxLineWidth) { 
                    maxLineWidth = subWidth;
                }
            }
            
            // Return the maximum line width
            return maxLineWidth;
        },

        /**
         * Retrieve information about the browser, and webGL support.
         */
        getBrowserReport: function(showPlugins, gl) {

            var report = '';

            // Gather whatever useful information we can about the browser
            report += "\nBrowser Details\n";
            if (window.navigator)
            {
                report += "* appName: " + window.navigator.appName + "\n";
                report += "* appVersion: " + window.navigator.appVersion + "\n";
                report += "* platform: " + window.navigator.platform + "\n";
                report += "* vendor: " + window.navigator.vendor + "\n";
                report += "* cookieEnabled: " + window.navigator.cookieEnabled + "\n";

                if (window.navigator.plugins && showPlugins) {
                    report += "* Plugins\n";
                    
                    for (var i = 0; i < window.navigator.plugins.length; i++) {
                        var name = window.navigator.plugins[i].name;
                        var file = window.navigator.plugins[i].filename;
                        report += "** *" + name + "* - " + file + "\n";
                    }
                }
            } else {
                report += "* !window.navigator\n";
            }

            report += "\nWebSocket Details\n";
            if ('WebSocket' in window) {
                report += "* WebSocket object support\n";
            } else if ('MozWebSocket' in window) {
                report += "* MozWebSocket object support\n";
            } else {
                report += "* No WebSocket support\n";
            }
            
            // Gather whatever useful information we can about WebGL support
            report += "\nWebGL Details\n";
            
            if (!gl && !window.gl) {
                // Load a temporary GL canvas
                var canvas = document.createElement('canvas');
                
                if ('getContext' in canvas) {
                    gl = canvas.getContext('webgl');
                    
                    if (!gl) {
                        gl = canvas.getContext('experimental-webgl');
                    }
                }
            }

            // If we still can't get a GL context loaded, assume 
            // the browser doesn't support it. 
            if (!gl) {

                report += "* No support\n";
                
            } else {
                
                report += "* VERSION: " + gl.getParameter(gl.VERSION) + "\n";
                report += "* VENDOR: " + gl.getParameter(gl.VENDOR) + "\n";
                report += "* RENDERER: " + gl.getParameter(gl.RENDERER) + "\n";
                report += "* SHADING_LANGUAGE_VERSION: " + gl.getParameter(gl.SHADING_LANGUAGE_VERSION) + "\n";
                
                // If a shader is running, record what shader (in case of rendering issues)
                var program = gl.getParameter(gl.CURRENT_PROGRAM);
                if (program) {
                    report += "* CURRENT_PROGRAM Log: " + gl.getProgramInfoLog(gl.getParameter(gl.CURRENT_PROGRAM)) + "\n";
                }
            }
            
            return report;
        },

        /**
         * Simple shim for $.extend() to provide some inheritance for objects.
         *
         * @param {object} target to extend
         * @param {object} source object to retrieve properties from
         *
         * @return {object}
         */
        extend: function(target, source) {
            Object.keys(source).map(function (prop) {
                if (!target.hasOwnProperty(prop)) {
                    target[prop] = source[prop];
                }
            });
            return target;
        },

        /**
         * Fast string hashing.
         *
         * @param {string} s
         *
         * @return {string}
         */
        hash: function(s) {
            var i, c, hash = 0,
                strlen = s.length;

            if (strlen === 0) {
                return hash;
            }

            for (i = 0; i < strlen; ++i) {
                c = s.charCodeAt(i);
                hash = ((hash << 5) - hash) + c;
                hash = hash & hash; // Convert to 32bit integer
            }

            return hash;
        }
    };

});
