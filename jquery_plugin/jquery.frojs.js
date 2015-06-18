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
			fro.resources.load({
				id: 'server_config',
				type: 'json',
				url: options.server
			})
			.bind('onload', function() {

				fro.log.debug(this.getJson());
			
				// Load the JSON 
				options.world = this.getJson();
				
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

		$.fn.frojs._updatePreloaderStatus(ele, 'Preloading', '--', '--');
		
		// Preload required resources for this instance
		fro.resources
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
		
		// if we have plugins that also wish to preload, merge them into the world preload
		
		// @todo MOVE ALL OF THIS. OH MY GOD WHY IS THIS SO HACKED TOGETHER.
		
		var plugin;
		if ('plugins' in options) {
			for (var p in options.plugins) {
				if (p in fro.plugins) {
				
					plugin = fro.plugins[p];
				
					if (typeof plugin.preload == 'object') {
						if ('required' in plugin.preload) {
							options.world.preload.required = 
								options.world.preload.required.concat(plugin.preload.required);
						}
						
						if ('optional' in plugin.preload) {
							options.world.preload.optional =
								options.world.preload.optional.concat(plugin.preload.optional);
						}
					}
				}
			}
		}

		// If we defined a list of resources to preload, initialize a loader
		fro.resources.preload(options.world.preload);
	};
	
	$.fn.frojs._run = function(ele, options) {

		// Load up the world itself!
		try {
			fro.world.initialise(options.world);
		} catch (e) {
			// log the stack, just in case it wasn't earlier
			fro.log.error(e.stack);
			
			$.fn.frojs._setPreloaderError(ele, 'Exception while loading world: ' + e.message);
			return;
		}
		
		// If everything initialised properly, connect to our network
		if ('network' in options.world) {
			fro.network.connect(options.world.network.server);
		}
		
		$('.frojs-preloader').css('display', 'none');
		$('#frojs-help-overlay').css('display', 'block');
		
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
					throw new Error('Plugin "' + p + '" failed to load!');
				}
			}
		}
	};
	
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
	};
	
	$.fn.frojs._wrapCanvas = function(ele, options) {
		
		ele.wrap('<div id="frojs-content"/>');
		var contentDiv = ele.parent();
		
		contentDiv.wrap('<div class="frojs-container"/>');
		var containerDiv = contentDiv.parent();
		
		// Generate a navigation bar
		contentDiv.after(
			'<div id="frojs-navigation"></div>'
			+ '<div id="frojs-help-overlay"><div class="exit-button"></div></div>'
		);
		
		ele.before('<div id="frojs-notices"></div>');
		
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
	
		// Bind some futures to navigation
		$('#frojs-navigation').on('click', 'a', function(e) {
			
			// Override standard page change events to only change the
			// content of our navigation via AJAX
			var anchor = $(e.currentTarget);
		
			if (anchor.attr('target') == undefined)
			{
				var url = anchor.attr('href');
			
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
	
		$('#frojs-help-overlay > .exit-button').click(function() {
			
			$('#frojs-help-overlay').css('display', 'none');
			return false;
		});
	
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
