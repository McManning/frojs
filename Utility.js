
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



