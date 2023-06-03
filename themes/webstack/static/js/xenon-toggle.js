/**
 *	Toggles
 *
 *	Non-animation
 */


;(function($, window, undefined)
{
	"use strict";

	$(document).ready(function()
	{
		// Sidebar Toggle
		$('a[data-toggle="sidebar"]').each(function(i, el)
		{
			$(el).on('click', function(ev)
			{
				ev.preventDefault();

				if(public_vars.$sidebarMenu.hasClass('collapsed'))
				{
					public_vars.$sidebarMenu.removeClass('collapsed');
					ps_init();
				}
				else
				{
					public_vars.$sidebarMenu.addClass('collapsed');
					ps_destroy();
				}

				$(window).trigger('xenon.resize');
			});
		});

		// Mobile Menu Trigger
		$('a[data-toggle="mobile-menu"]').on('click', function(ev)
		{
			ev.preventDefault();

			public_vars.$mainMenu.add(public_vars.$sidebarProfile).toggleClass('mobile-is-visible');
			ps_destroy();
		});

		// Mobile Menu Trigger for Horizontal Menu
		$('a[data-toggle="mobile-menu-horizontal"]').on('click', function(ev)
		{
			ev.preventDefault();

			public_vars.$horizontalMenu.toggleClass('mobile-is-visible');

		});



		// Mobile Menu Trigger for Sidebar & Horizontal Menu
		$('a[data-toggle="mobile-menu-both"]').on('click', function(ev)
		{
			ev.preventDefault();

			public_vars.$mainMenu.toggleClass('mobile-is-visible both-menus-visible');
			public_vars.$horizontalMenu.toggleClass('mobile-is-visible both-menus-visible');

		});

		// Mobile User Info Menu Trigger
		$('a[data-toggle="user-info-menu"]').on('click', function(ev)
		{
			ev.preventDefault();

			public_vars.$userInfoMenu.toggleClass('mobile-is-visible');

		});

		// Mobile User Info Menu Trigger for Horizontal Menu
		$('a[data-toggle="user-info-menu-horizontal"]').on('click', function(ev)
		{
			ev.preventDefault();

			public_vars.$userInfoMenuHor.find('.nav.nav-userinfo').toggleClass('mobile-is-visible');

		});

		$('[data-toggle="tooltip"]').each(function(i, el)
		{
			var $this = $(el),
				placement = attrDefault($this, 'placement', 'top'),
				trigger = attrDefault($this, 'trigger', 'hover'),
				tooltip_class = $this.get(0).className.match(/(tooltip-[a-z0-9]+)/i);

			$this.tooltip({
				placement: placement,
				html:true,
				trigger: trigger
			});

			if(tooltip_class)
			{
				$this.removeClass(tooltip_class[1]);

				$this.on('show.bs.tooltip', function(ev)
				{
					setTimeout(function()
					{
						var $tooltip = $this.next();
						$tooltip.addClass(tooltip_class[1]);

					}, 0);
				});
			}
		});

	});

})(jQuery, window);