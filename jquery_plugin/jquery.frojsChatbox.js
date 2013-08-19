
;(function($, window, document, undefined) {
	
	$.fn.frojsChatbox = function(options) {
		
		options = $.extend({}, $.fn.frojsChatbox.options, options);
		
		// Only allow this plugin to be initialised on one div
		if (this.length > 1) {
			$.error('Cannot initialise multiple instances of frojsChatbox');
		}
	
		return this.each(function() {
			
			var ele = $(this);
			
			$.fn.frojsChatbox._wrap(ele, options);
			
			ele.resizable({
				helper: "ui-resizable-helper", // @todo custom helper instead of override
				minHeight: options.minHeight,
				minWidth: options.minWidth,
				stop: function(event, ui) {
					$.fn.frojsChatbox._resize(ele);
				}
			}).draggable({
				containment : options.containment,
			});
			
			// Dock for a default state
			// @todo move to a method
			//ele.resizable('disable').draggable('disable');
			
			// Reroute focus events
			ele.find('.output-container').click(function(e) {
			
				ele.find('input').focus();
				return false;
			});

			ele.find('.scroll-pane').jScrollPane({
				contentWidth: '0px' // See http://stackoverflow.com/questions/4404944/how-do-i-disable-horizontal-scrollbar-in-jscrollpane-jquery
			});

			ele.find('input').keypress(function(e) {
				
				if (e.which == 13) { // hit enter
				
					var api = ele.find('.scroll-pane').data('jsp');
					api.getContentPane().append('<p>' + $(this).val() + '</p>');
					api.reinitialise();
					api.scrollToBottom();
					
					$(this).val('');
				}
			});
			
			$.fn.frojsChatbox._resize(ele);
			
			
			// Set initial position
			if (options.containment) {
				var parent = $(options.containment);
				var offset = parent.offset();
				
				//ele.css('left', offset.left + parent.width() - ele.width());
				//ele.css('top', offset.top - ele.height());
				
				ele.css('position', 'absolute');
				
				parent.prepend(ele);
			}
			
			
		});
	};
	
	$.fn.frojsChatbox._resize = function(ele) {

		// Note that the 3's are to fix the bottom line being hidden behind 
		// the bottom bar (because of border padding and all that)
		
		var height = (ele.height() - 63);
		ele.find('.output-container').css('height', height + 'px');
		ele.find('.background').css('height', (height + 3) + 'px');
		
		// refresh output content
		var api = ele.find('.scroll-pane').data('jsp');
		api.reinitialise();
		api.scrollToBottom();
	};
	
	$.fn.frojsChatbox._wrap = function(ele, options) {
		
		// Fill ele with content
		ele
			.addClass('ui-widget-content')
			.addClass('frojs-chatbox')
			.html(
				'<div class="background"></div>'
				+ '<div class="header"><div class="controls">'
				//+ '  <a class="dock" title="Undock" href="#"><i class="icon-lock icon-white"></i></a>'
				+ '</div></div>'
				+ '<div class="output-container"><div class="scroll-pane"></div></div>'
				+ '<div class="input-container-wrap"><div class="input-container">'
				+ '  <table><tr>'
				+ '    <td class="controls-left"><i class="icon-comments"></i></td>'
				+ '    <td class="input-td"><input type="text" placeholder="' + options.placeholder + '" /></td>'
				+ '    <td class="controls-right"><i class="icon-list"></i></td>'
				+ '  </tr></table>'
				+ '</div></div>'
			);
	};
	
	// Globally defined, overridable options
	// The user can override defaults as necessary
	// via $.fn.frojs.someKey = 'value';
	$.fn.frojsChatbox.options = {
	
		placeholder: 'Faceroll Enter to send',
		containment: false,
		minWidth: 200,
		minHeight: 100
	};
	
})(jQuery, window, document);

