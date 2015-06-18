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

"use strict";

/**
 * Shamelessly borrowed from http://delphic.me.uk/webgltext.html
 * 
 * @param context ctx Canvas context rendering the string
 * @param string textToWrite Text to be broken up into multiple lines
 * @param number maxWidth Maximum width of a single line of text
 * @param array text Split lines will be dumped into this array
 * 
 * @return final width of the rendered text
 */
function createMultilineText(ctx, textToWrite, maxWidth, text) {
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
		var linebreak = false;
		
		currentText = futureText = "";
		for(var i = 0; i < wordArrayLength; i++) {
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
	maxLineWidth = ctx.measureText(currentText).width;
	
	// If there is any text left to be written call the function again
	if(futureText) {
		subWidth = createMultilineText(ctx, futureText, maxWidth, text);
		if (subWidth > maxLineWidth) { 
			maxLineWidth = subWidth;
		}
	}
	
	// Return the maximum line width
	return maxLineWidth;
}

var _htmlEntityMap = {
	"&": "&amp;",
	"<": "&lt;",
	">": "&gt;",
	'"': '&quot;',
	"'": '&#39;',
	"/": '&#x2F;'
};

/**
 * Utility method to escape HTML content from strings (chat, nicknames, etc)
 */
function escapeHtml(string) {

	return String(string).replace(/[&<>"'\/]/g, function (s) {
	  return _htmlEntityMap[s];
	});
}

/**
 * Retrieve information about the browser, and webGL support.
 */
function getBrowserReport(showPlugins, gl) {

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
}
