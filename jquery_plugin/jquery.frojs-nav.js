
;(function($, window, document, undefined) {
	
	$.fn.frojsnav = function(options) {
		options = $.extend({}, $.fn.frojs.options, options);
	};

	$.fn.frojsnav._wrapCanvas = function(ele, options) {
		
		
		var container = ele.parent();
		
		ele.before(
			'<div class="frojs-navigation-icon"></div>'
			'<div class="frojs-navigation">'
			+ 'Some content!'
			+'</div>'
		);
	};
	
	// Globally defined, overridable options
	// The user can override defaults as necessary
	$.fn.frojs.options = {
	
		
	};
		
})(jQuery, window, document);