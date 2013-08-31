
/*
jQuery Plugin wrapper for the fro Engine.

Initially, this wasn't going to happen. But, it could be doable to write the loader code and setup values into a plugin.
This way loader code wouldn't need to be repeated by the end user, and instead we could just attach this jQ plugin to a
canvas element.

Unfortunately, for now, fro won't be able to play nice with more than one instance. But that could be a later thought as
we re-evaluate the way in which we reference objects. Maybe a more decoupled event-driven method could be found, so that
we can completely stop referencing the world as an entity, or something.
	(ie: Entity fires a "kill me" event, and the world picks it up and adds to the kill queue)
	Meanwhile, certain things might be able to become singletons (resource management, sharing resources between multiple
	instances of fro would be lovely)
*/

;(function($, window, document, undefined) {
	
	$.fn.frojs = function(options) {
		
		options = $.extend({}, $.fn.frojs.options, options);
		
		// Initialise for each object we created this plugin on
		return this.each(function() {
			
			var ele = $(this);
			
			// @todo block initialisation for more than one instance of fro
			// until we have the ability to run multiples at once
		
			// @todo world JSON validation code of some sort
	
			$.fn.frojs._wrapCanvas(ele, options);
			
			options.canvas = ele[0];
			
			fro.initialise(options);

			// Load in all the plugins and let them bind to objects/events
			$.fn.frojs._initPlugins(ele, options);
			
			$.fn.frojs._updatePreloaderStatus(ele, 'Retrieving World JSON', 0, 1);
			
			// Load our world data from Sybolt
			fro.resources.load('world_json', options.server, 'json')
				.bind('onload', function() {

					console.log(this.json);
				
					// Load the JSON 
					options.world = this.json;
					
					$.fn.frojs._preload(ele, options);
				})
				.bind('onerror', function() {
					
					// Loader error
					$.fn.frojs._setPreloaderError(ele,
						'Error retrieving world JSON'
					);
				});

		});
	};
	
	$.fn.frojs._preload = function(ele, options) {
		
		// If we defined a list of resources to preload, initialize a loader
		if ('preload' in options.world) {
			
			$.fn.frojs._updatePreloaderStatus(ele, 'Preloading', '--', '--');
			
			// Preload required resources for this instance
			fro.resources.preload(options.world.preload)
				.bind('preload.status', function(resource) {

					$.fn.frojs._updatePreloaderStatus(ele, 
						'Preloading', 
						fro.resources.completedPreload, 
						fro.resources.totalPreload
					);
				})
				.bind('preload.error', function(resource) {
				
					$.fn.frojs._setPreloaderError(ele,
						'Error on ' + resource.id + '(' + resource.url + ')'
					);
				})
				.bind('preload.complete', function() {
				
					$.fn.frojs._run(ele, options);
				});
				
		} else { // Just run
			
			$.fn.frojs._updatePreloaderStatus(ele, 'Generating World', 1, 1);
			$.fn.frojs._run(ele, options);
		}
	};
	
	$.fn.frojs._run = function(ele, options) {

		// Load up the world itself!
		try {
			fro.world.initialise(options.world);
		} catch (e) {
			$.fn.frojs._setPreloaderError(ele, e);
			return;
		}
		
		// If everything initialised properly, connect to our network
		if ('network' in options.world) {
			fro.network.connect(options.world.network.server);
		}
		
		$('.frojs-preloader').css('display', 'none');
		
		// Populate our nav
		$('#frojs-nickname').val(fro.world.player.nick);
		//$('#frojs-avatar').val(fro.world.player.avatar.url);
		
		// If we have a chatbox, display it
		$('.frojs-chatbox').css('display', 'block');
		
		// Start the renderer
		fro.run();
	};
	
	$.fn.frojs._initPlugins = function(ele, options) {
	
		if ('plugins' in options) {
			for (var p in options.plugins) {
				if (p in fro.plugins) {
					fro.plugins[p].initialise(options.plugins[p]);
				} else {
					// Plugin does not exist, throw an error
					throw 'Plugin "' + p + '" is not properly loaded!';
				}
			}
		}
	}
	
	$.fn.frojs._updatePreloaderStatus = function(ele, message, current, total) {
		
		var container = ele.parent().find('.frojs-preloader');
		
		container
			.find('.preloader-status')
				.html(message);
		
		container
			.find('.preloader-progress')
				.html(current.toString() + ' / ' + total.toString());
				
		// Update progress bar
		if (!isNaN(current) && !isNaN(total)) {
			var percent = current / total * 100;
			
			container
				.find('.progress > .bar, .progress > .overlay') // @todo might be wrong selector for .overlay
					.css('width', percent.toString() + '%');
		}
	};
	
	$.fn.frojs._setPreloaderError = function(ele, message) {
		
		var container = ele.parent().find('.frojs-preloader');

		container
			.addClass('preload-error')
			.find('.preloader-status')
				.html(message);
	};
	
	$.fn.frojs.loadNavigationUrl = function(url) {
		$.ajax({
			url: url,
			success: function(html) {
				$.fn.frojs._setNavigationContent(url, html);
			}
		});
	};
	
	$.fn.frojs._setNavigationContent = function(url, html) {
	
		var nav = $('#frojs-navigation');
		
		nav.html(html);
		nav.trigger('pagechange', url);
		
		// Override standard page change events to only change the
		// content of our navigation via AJAX
		nav.find('a').click(function(e) {

			if ($(this).attr('target') == undefined)
			{
				var url = $(this).attr('href');
			
				if (url != '#') {
					// Ajax post this form instead
					$.ajax({
						url: url,
						success: function(html) {
							$.fn.frojs._setNavigationContent(url, html);
						}
					});
				}
				
				e.preventDefault();
				return false;
			}
		});
		
	};
	
	$.fn.frojs._wrapCanvas = function(ele, options) {
		
		ele.wrap('<div id="frojs-content"/>');
		var contentDiv = ele.parent();
		
		contentDiv.wrap('<div class="frojs-container"/>');
		var containerDiv = contentDiv.parent();
		
		// Generate a navigation bar
		contentDiv.after(
			'<div id="frojs-navigation"></div>'
			
		);
		
		// Nav icon in content bar
		ele.after(
			'<div id="frojs-navigation-icon" class="icon-reorder"></div>'
		);
		
		// Generate a preloader bar, logo, and status icon 
		ele.before(
			'<div class="frojs-preloader">'
			+	'<div class="preloader-logo"></div>'
			+	'<div class="preloader-bar">'
			+		'<div class="preloader-info">'
			+			'<span class="preloader-status"></span>'
			+			'<span class="preloader-progress"></span>'
			+		'</div>'
			+		'<div class="progress progress-striped active">'
			+			'<div class="bar" style="width: 0%"></div>'
			+		'</div>'
			+		'<div class="progress progress-reflection progress-striped active">'
			+			'<div class="overlay" style="width: 0%"></div>'
			+			'<div class="bar" style="width: 0%"></div>'
			+		'</div>'
			+	'</div>'
			+'</div>'
		);
		
		// Generate an about link
	/*	ele.before(
			'<div class="frojs-about"><a href="#"><span>'
			+ '<strong>froJs</strong>'
			+ ' Build ' + fro.version
			+'</span></a></div>'
		);
		
		
		container.find('.frojs-about').mouseover(function() {
			$(this).find('a').css('display', 'block');
		}).mouseout(function() {
			$(this).find('a').css('display', 'none');
		});
	*/	
	
	};
	
	// Globally defined, overridable options
	// The user can override defaults as necessary
	// via $.fn.frojs.someKey = 'value';
	$.fn.frojs.options = {
	
		key : null,
		origin : location.href,
		
		server : 'http://api.sybolt.com/frojs',
		
		plugins : {},
		webGL : true,
	};
	
})(jQuery, window, document);
