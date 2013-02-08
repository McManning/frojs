
"use strict";

if (typeof KeyEvent == "undefined") {
    var KeyEvent = {
        DOM_VK_CANCEL: 3,
        DOM_VK_HELP: 6,
        DOM_VK_BACK_SPACE: 8,
        DOM_VK_TAB: 9,
        DOM_VK_CLEAR: 12,
        DOM_VK_RETURN: 13,
        DOM_VK_ENTER: 14,
        DOM_VK_SHIFT: 16,
        DOM_VK_CONTROL: 17,
        DOM_VK_ALT: 18,
        DOM_VK_PAUSE: 19,
        DOM_VK_CAPS_LOCK: 20,
        DOM_VK_ESCAPE: 27,
        DOM_VK_SPACE: 32,
        DOM_VK_PAGE_UP: 33,
        DOM_VK_PAGE_DOWN: 34,
        DOM_VK_END: 35,
        DOM_VK_HOME: 36,
        DOM_VK_LEFT: 37,
        DOM_VK_UP: 38,
        DOM_VK_RIGHT: 39,
        DOM_VK_DOWN: 40,
        DOM_VK_PRINTSCREEN: 44,
        DOM_VK_INSERT: 45,
        DOM_VK_DELETE: 46,
        DOM_VK_0: 48,
        DOM_VK_1: 49,
        DOM_VK_2: 50,
        DOM_VK_3: 51,
        DOM_VK_4: 52,
        DOM_VK_5: 53,
        DOM_VK_6: 54,
        DOM_VK_7: 55,
        DOM_VK_8: 56,
        DOM_VK_9: 57,
        DOM_VK_SEMICOLON: 59,
        DOM_VK_EQUALS: 61,
        DOM_VK_A: 65,
        DOM_VK_B: 66,
        DOM_VK_C: 67,
        DOM_VK_D: 68,
        DOM_VK_E: 69,
        DOM_VK_F: 70,
        DOM_VK_G: 71,
        DOM_VK_H: 72,
        DOM_VK_I: 73,
        DOM_VK_J: 74,
        DOM_VK_K: 75,
        DOM_VK_L: 76,
        DOM_VK_M: 77,
        DOM_VK_N: 78,
        DOM_VK_O: 79,
        DOM_VK_P: 80,
        DOM_VK_Q: 81,
        DOM_VK_R: 82,
        DOM_VK_S: 83,
        DOM_VK_T: 84,
        DOM_VK_U: 85,
        DOM_VK_V: 86,
        DOM_VK_W: 87,
        DOM_VK_X: 88,
        DOM_VK_Y: 89,
        DOM_VK_Z: 90,
        DOM_VK_CONTEXT_MENU: 93,
        DOM_VK_NUMPAD0: 96,
        DOM_VK_NUMPAD1: 97,
        DOM_VK_NUMPAD2: 98,
        DOM_VK_NUMPAD3: 99,
        DOM_VK_NUMPAD4: 100,
        DOM_VK_NUMPAD5: 101,
        DOM_VK_NUMPAD6: 102,
        DOM_VK_NUMPAD7: 103,
        DOM_VK_NUMPAD8: 104,
        DOM_VK_NUMPAD9: 105,
        DOM_VK_MULTIPLY: 106,
        DOM_VK_ADD: 107,
        DOM_VK_SEPARATOR: 108,
        DOM_VK_SUBTRACT: 109,
        DOM_VK_DECIMAL: 110,
        DOM_VK_DIVIDE: 111,
        DOM_VK_F1: 112,
        DOM_VK_F2: 113,
        DOM_VK_F3: 114,
        DOM_VK_F4: 115,
        DOM_VK_F5: 116,
        DOM_VK_F6: 117,
        DOM_VK_F7: 118,
        DOM_VK_F8: 119,
        DOM_VK_F9: 120,
        DOM_VK_F10: 121,
        DOM_VK_F11: 122,
        DOM_VK_F12: 123,
        DOM_VK_F13: 124,
        DOM_VK_F14: 125,
        DOM_VK_F15: 126,
        DOM_VK_F16: 127,
        DOM_VK_F17: 128,
        DOM_VK_F18: 129,
        DOM_VK_F19: 130,
        DOM_VK_F20: 131,
        DOM_VK_F21: 132,
        DOM_VK_F22: 133,
        DOM_VK_F23: 134,
        DOM_VK_F24: 135,
        DOM_VK_NUM_LOCK: 144,
        DOM_VK_SCROLL_LOCK: 145,
        DOM_VK_COMMA: 188,
        DOM_VK_PERIOD: 190,
        DOM_VK_SLASH: 191,
        DOM_VK_BACK_QUOTE: 192,
        DOM_VK_OPEN_BRACKET: 219,
        DOM_VK_BACK_SLASH: 220,
        DOM_VK_CLOSE_BRACKET: 221,
        DOM_VK_QUOTE: 222,
        DOM_VK_META: 224
    };
}

/** 
 * Manager for application input, will translate keyboard/mouse events
 * to the GL canvas into hookable events 
 */
fro.input = $.extend({
	
	initialise : function(canvas) {
		
		// State management for inputs
		this.pressedKeys = new Array();
		this.cursorPosition = vec3.create();
		
		// Allow the canvas to detect focus/blur events
		$(canvas).attr('tabindex', -1);
		
		canvas.onmousedown = this.onMouseDown;
		
		canvas.onfocus = this.onCanvasFocus;
		canvas.onblur = this.onCanvasBlur;

		document.onmouseup = this.onMouseUp;
		document.onmousemove = this.onMouseMove;
		
		// @todo window versus document?
		window.onkeydown = this.onKeyDown;
		window.onkeyup = this.onKeyUp;

		window.onfocus = this.onWindowFocus;
		window.onblur = this.onWindowBlur;

		this.canvasFocus = false;
	},
	
	onKeyDown : function(e) {
		e = e || window.event;

		fro.input.pressedKeys[e.keyCode] = true;
		
		fro.input.fire('keydown', e);
		
		// Override pageup/pagedown events
		if (e.keyCode == KeyEvent.DOM_VK_PAGE_UP 
			|| e.keyCode == KeyEvent.DOM_VK_PAGE_DOWN) {
			
			return false;
		}
	},

	onKeyUp : function(e) {
		e = e || window.event;

		fro.input.pressedKeys[e.keyCode] = false;
		
		fro.input.fire('keyup', e);
	},

	onMouseDown : function(e) {
		e = e || window.event;
		fro.input.updateCursorPosition(e);
		
		fro.input.fire('mousedown', e);
	},

	onMouseUp : function(e) {
		e = e || window.event;
		fro.input.updateCursorPosition(e);
		
		fro.input.fire('mouseup', e);
	},
	
	onMouseMove : function(e) {
		e = e || window.event;
		
		// Since this is a frequent event, it won't be fired to listeners just yet
		// Instead, they should set up timers and query when needed.
		fro.input.updateCursorPosition(e);
	},
	
	updateCursorPosition : function(e) {
		var pos = this.cursorPosition;
		
		// Recalculate cursor position and store
		if (e.pageX || e.pageY) {
			pos[0] = e.pageX;
			pos[1] = e.pageY;
		} else {
			pos[0] = e.clientX + document.body.scrollLeft + document.documentElement.scrollLeft; 
			pos[1] = e.clientY + document.body.scrollTop + document.documentElement.scrollTop; 
		}
		
		pos[0] -= gl.canvas.offsetLeft;
		pos[1] -= gl.canvas.offsetTop;
	},
	
	/**
	 * Canvas loses focus, kill inputs and certain events
	 */
	onCanvasBlur : function() {
		
		// Cancel any keypresses, since we won't pick up a keyup event 
		fro.input.pressedKeys.length = 0;
		fro.input.canvasFocus = false;
		
		fro.input.fire('canvasblur');
	},

	/**
	 * Canvas regained focus, reactivate inputs and certain events
	 */
	onCanvasFocus : function() {
	
		fro.input.canvasFocus = true;
		
		fro.input.fire('canvasfocus');
	},
	
	/**
	 * Window loses focus, kill inputs and certain events
	 */
	onWindowBlur : function() {
	
		// Cancel any keypresses, since we won't pick up a keyup event 
		fro.input.pressedKeys.length = 0;
		fro.input.canvasFocus = false;
		
		fro.input.fire('windowblur');
	},

	/**
	 * Window regained focus, reactivate inputs and certain events
	 */
	onWindowFocus : function() {
		fro.input.fire('windowfocus');
	},
	
	/** Returns true if the specified key is identified as being pressed */
	isKeyDown : function(keycode) {
		return (this.pressedKeys[keycode] == true);
	},
	
	/** Returns true if our canvas/GL context has input focus */
	hasFocus : function() {
		return this.canvasFocus;
	},
	
	/**
	 * Helper function to determine where exactly in the canvas the cursor is located
	 * @return vec3 result, from (0,0) to (gl.viewportWidth,gl.viewportHeight)
	 * @todo may return negatives, and points outside the canvas. Need to ensure cursor is IN the canvas!
	 */
	getCursorPosition : function(e) {
		return this.cursorPosition;
	},

}, EventHooks);



