/**
 * app.js — 精简合并后的原生 JavaScript
 * 替代: bootstrap.min.js, TweenMax.min.js, resizeable.js,
 *       xenon-toggle.js, xenon-custom.js, lozad.js
 * 零依赖，无需 jQuery
 */

;(function (window, document) {
  'use strict';

  /* =========================================================
   *  1. 工具函数
   * ========================================================= */

  function $(selector, root) {
    return (root || document).querySelector(selector);
  }

  function $$(selector, root) {
    return Array.from((root || document).querySelectorAll(selector));
  }

  function hasClass(el, cls) {
    return el && el.classList.contains(cls);
  }

  function addClass(el, cls) {
    el && cls.split(' ').forEach(function (c) { if (c) el.classList.add(c); });
  }

  function removeClass(el, cls) {
    el && cls.split(' ').forEach(function (c) { if (c) el.classList.remove(c); });
  }

  function toggleClass(el, cls) {
    el && cls.split(' ').forEach(function (c) { if (c) el.classList.toggle(c); });
  }

  /* =========================================================
   *  2. 响应式断点 (替代 resizeable.js)
   * ========================================================= */

  var breakpoints = {
    largescreen:  [991, Infinity],
    tabletscreen: [768, 990],
    devicescreen: [420, 767],
    sdevicescreen:[0, 419]
  };

  var lastBreakpoint = null;

  function getCurrentBreakpoint() {
    var w = window.innerWidth;
    for (var label in breakpoints) {
      var bp = breakpoints[label];
      if (w >= bp[0] && w <= bp[1]) return label;
    }
    return null;
  }

  // 全局保留兼容
  window.is   = function (label) { return getCurrentBreakpoint() === label; };
  window.isxs = function () { return window.is('devicescreen') || window.is('sdevicescreen'); };
  window.ismdxl = function () { return window.is('tabletscreen') || window.is('largescreen'); };

  /* =========================================================
   *  3. public_vars (替代 xenon-custom.js 初始化)
   * ========================================================= */

  var public_vars = window.public_vars = window.public_vars || {};

  function initPublicVars() {
    var body             = document.body;
    var pageContainer    = $('.page-container', body);
    if (!pageContainer) return;

    public_vars.$body           = body;
    public_vars.$pageContainer  = pageContainer;
    public_vars.$sidebarMenu    = $('.sidebar-menu', pageContainer);
    public_vars.$sidebarProfile = public_vars.$sidebarMenu ? $('.sidebar-user-info', public_vars.$sidebarMenu) : null;
    public_vars.$mainMenu       = public_vars.$sidebarMenu ? $('.main-menu', public_vars.$sidebarMenu) : null;
    public_vars.$mainContent    = $('.main-content', pageContainer);
    public_vars.$mainFooter     = $('footer.main-footer', body);
    public_vars.$userInfoMenu   = $('nav.navbar.user-info-navbar', body);
  }

  /* =========================================================
   *  4. ps_init / ps_destroy / ps_update (stub，因无 perfectScrollbar)
   * ========================================================= */

  window.ps_init    = function () {};
  window.ps_destroy = function () {};
  window.ps_update  = function () {};

  /* =========================================================
   *  5. 侧边栏菜单 (替代 xenon-custom.js 中的 setup_sidebar_menu)
   *     CSS: .main-menu ul { display:none }
   *     只有 .opened > ul 有 CSS display:block，
   *     .expanded 需要 JS 显式设置 display。
   * ========================================================= */

  var SM_DURATION = 200; // ms

  function sidebarMenuItemExpand(li, sub) {
    if (li._isBusy) return;
    // 侧边栏收起状态下不展开子菜单
    if (li.parentElement && hasClass(li.parentElement, 'main-menu') &&
      public_vars.$sidebarMenu && hasClass(public_vars.$sidebarMenu, 'collapsed')) return;

    li._isBusy = true;
    addClass(li, 'expanded');

    // 必须用 display:block，因为 CSS 默认 .main-menu ul { display:none }
    sub.style.display = 'block';
    var targetH = sub.scrollHeight;

    // 从 0 动画到目标高度
    sub.style.overflow = 'hidden';
    sub.style.height = '0px';
    sub.offsetHeight; // force reflow
    sub.style.transition = 'height ' + SM_DURATION + 'ms ease';
    sub.style.height = targetH + 'px';

    function onEnd() {
      sub.removeEventListener('transitionend', onEnd);
      sub.style.transition = '';
      sub.style.overflow = '';
      sub.style.height = '';
      // 保持 display:block
      sub.style.display = 'block';
      li._isBusy = false;
    }
    sub.addEventListener('transitionend', onEnd);

    // 兜底：防止 transitionend 不触发
    setTimeout(function () {
      if (li._isBusy) onEnd();
    }, SM_DURATION + 50);
  }

  function sidebarMenuItemCollapse(li, sub) {
    if (li._isBusy) return;
    li._isBusy = true;
    removeClass(li, 'expanded');

    var curH = sub.offsetHeight;
    sub.style.overflow = 'hidden';
    sub.style.height = curH + 'px';
    sub.offsetHeight; // force reflow
    sub.style.transition = 'height ' + SM_DURATION + 'ms ease';
    sub.style.height = '0px';

    function onEnd() {
      sub.removeEventListener('transitionend', onEnd);
      sub.style.transition = '';
      sub.style.overflow = '';
      sub.style.height = '';
      sub.style.display = 'none';
      li._isBusy = false;
      removeClass(li, 'opened');
      // 收起嵌套子菜单
      $$('li.expanded', li).forEach(function (nestedLi) {
        var nestedUl = nestedLi.querySelector(':scope > ul');
        if (nestedUl) {
          nestedUl.style.cssText = '';
          nestedUl.style.display = 'none';
        }
        removeClass(nestedLi, 'expanded');
      });
    }
    sub.addEventListener('transitionend', onEnd);

    // 兜底
    setTimeout(function () {
      if (li._isBusy) onEnd();
    }, SM_DURATION + 50);
  }

  function closeSiblings(li) {
    var parent = li.parentElement;
    if (!parent) return;
    Array.from(parent.children).forEach(function (sibling) {
      if (sibling === li || sibling.tagName !== 'LI') return;
      if (hasClass(sibling, 'expanded') || hasClass(sibling, 'opened')) {
        var sub = sibling.querySelector(':scope > ul');
        if (sub) sidebarMenuItemCollapse(sibling, sub);
      }
    });
  }

  function setupSidebarMenu() {
    var sm = public_vars.$sidebarMenu;
    if (!sm) return;
    var mainMenu = $('ul.main-menu', sm) || $('.main-menu', sm);
    if (!mainMenu) return;
    var toggleOthers = hasClass(sm, 'toggle-others');

    // 只处理直接含有 > ul 的 li
    $$('li', mainMenu).forEach(function (li) {
      var sub = li.querySelector(':scope > ul');
      if (!sub) return;

      addClass(li, 'has-sub');

      // 已有 active 或 HTML 中已有 expanded 的，初始化时显示子菜单
      if (hasClass(li, 'active') || hasClass(li, 'expanded')) {
        addClass(li, 'expanded');
        sub.style.display = 'block';
      }

      var a = li.querySelector(':scope > a');
      if (!a) return;
      a.addEventListener('click', function (ev) {
        ev.preventDefault();
        if (toggleOthers) closeSiblings(li);
        if (hasClass(li, 'expanded') || hasClass(li, 'opened'))
          sidebarMenuItemCollapse(li, sub);
        else
          sidebarMenuItemExpand(li, sub);
      });
    });

    // 平板时自动收起侧边栏
    if (window.is('largescreen') && !hasClass(sm, 'collapsed')) {
      window.addEventListener('resize', function () {
        if (window.is('tabletscreen')) {
          addClass(sm, 'collapsed');
        } else if (window.is('largescreen')) {
          removeClass(sm, 'collapsed');
        }
      });
    }
  }

  /* =========================================================
   *  6. 切换按钮 (替代 xenon-toggle.js)
   * ========================================================= */

  function setupToggles() {
    // Sidebar Toggle (桌面端 icon-bar)
    $$('a[data-toggle="sidebar"]').forEach(function (el) {
      el.addEventListener('click', function (ev) {
        ev.preventDefault();
        var sm = public_vars.$sidebarMenu;
        if (!sm) return;

        if (hasClass(sm, 'collapsed')) {
          removeClass(sm, 'collapsed');
          // 重新显示已 expanded 的子菜单
          $$('.has-sub.expanded > ul', sm).forEach(function (ul) {
            ul.style.display = 'block';
          });
        } else {
          addClass(sm, 'collapsed');
        }
      });
    });

    // Mobile Menu Toggle
    $$('a[data-toggle="mobile-menu"]').forEach(function (el) {
      el.addEventListener('click', function (ev) {
        ev.preventDefault();
        if (public_vars.$mainMenu) toggleClass(public_vars.$mainMenu, 'mobile-is-visible');
        if (public_vars.$sidebarProfile) toggleClass(public_vars.$sidebarProfile, 'mobile-is-visible');
      });
    });
  }

  /* =========================================================
   *  7. Tooltip (替代 Bootstrap tooltip)
   * ========================================================= */

  var activeTooltip = null;

  function createTooltip(el) {
    var title = el.getAttribute('data-original-title') || el.getAttribute('title') || '';
    if (!title) return;
    // 保存并清除 title 防止浏览器默认 tooltip
    if (el.getAttribute('title')) {
      el.setAttribute('data-original-title', el.getAttribute('title'));
      el.removeAttribute('title');
      title = el.getAttribute('data-original-title');
    }
    var placement = el.getAttribute('data-placement') || 'top';

    // 创建 tooltip DOM（兼容已有 CSS class）
    var tip = document.createElement('div');
    tip.className = 'tooltip ' + placement;
    tip.setAttribute('role', 'tooltip');
    tip.innerHTML = '<div class="tooltip-arrow"></div><div class="tooltip-inner"></div>';

    var inner = tip.querySelector('.tooltip-inner');
    inner.innerHTML = title;

    document.body.appendChild(tip);

    // 定位
    var rect = el.getBoundingClientRect();
    var tipW = tip.offsetWidth;
    var tipH = tip.offsetHeight;
    var scrollX = window.pageXOffset;
    var scrollY = window.pageYOffset;
    var top, left;

    switch (placement) {
      case 'bottom':
        top  = rect.bottom + scrollY;
        left = rect.left + scrollX + rect.width / 2 - tipW / 2;
        break;
      case 'left':
        top  = rect.top + scrollY + rect.height / 2 - tipH / 2;
        left = rect.left + scrollX - tipW;
        break;
      case 'right':
        top  = rect.top + scrollY + rect.height / 2 - tipH / 2;
        left = rect.right + scrollX;
        break;
      default: // top
        top  = rect.top + scrollY - tipH;
        left = rect.left + scrollX + rect.width / 2 - tipW / 2;
    }

    tip.style.top  = top + 'px';
    tip.style.left = left + 'px';

    // 显示动画
    tip.offsetHeight; // reflow
    addClass(tip, 'in');

    return tip;
  }

  function destroyTooltip() {
    if (activeTooltip && activeTooltip.parentNode) {
      activeTooltip.parentNode.removeChild(activeTooltip);
    }
    activeTooltip = null;
  }

  function setupTooltips() {
    $$('[data-toggle="tooltip"]').forEach(function (el) {
      // 初始化: 将 title 转存
      if (el.getAttribute('title') && !el.getAttribute('data-original-title')) {
        el.setAttribute('data-original-title', el.getAttribute('title'));
        el.removeAttribute('title');
      }

      el.addEventListener('mouseenter', function () {
        destroyTooltip();
        activeTooltip = createTooltip(el);
      });
      el.addEventListener('mouseleave', function () {
        destroyTooltip();
      });
    });
  }

  /* =========================================================
   *  8. 图片懒加载 (替代 lozad.js，全局 lozad() 接口兼容)
   * ========================================================= */

  function lozadLoad(element) {
    if (element.getAttribute('data-src')) {
      element.src = element.getAttribute('data-src');
    }
    if (element.getAttribute('data-srcset')) {
      element.setAttribute('srcset', element.getAttribute('data-srcset'));
    }
    if (element.getAttribute('data-background-image')) {
      element.style.backgroundImage = "url('" + element.getAttribute('data-background-image') + "')";
    }
  }

  function lozadFactory(selector) {
    selector = selector || '.lozad';
    var observer = null;

    if (window.IntersectionObserver) {
      observer = new IntersectionObserver(function (entries, obs) {
        entries.forEach(function (entry) {
          if (entry.isIntersecting || entry.intersectionRatio > 0) {
            obs.unobserve(entry.target);
            if (entry.target.getAttribute('data-loaded') !== 'true') {
              lozadLoad(entry.target);
              entry.target.setAttribute('data-loaded', 'true');
            }
          }
        });
      }, { rootMargin: '0px', threshold: 0 });
    }

    return {
      observe: function () {
        var elements = document.querySelectorAll(selector);
        for (var i = 0; i < elements.length; i++) {
          if (elements[i].getAttribute('data-loaded') === 'true') continue;
          if (observer) {
            observer.observe(elements[i]);
          } else {
            lozadLoad(elements[i]);
            elements[i].setAttribute('data-loaded', 'true');
          }
        }
      },
      triggerLoad: function (element) {
        if (element.getAttribute('data-loaded') === 'true') return;
        lozadLoad(element);
        element.setAttribute('data-loaded', 'true');
      },
      observer: observer
    };
  }

  // 全局兼容接口
  window.lozad = lozadFactory;

  /* =========================================================
   *  9. Go-to-top (替代 TweenMax 滚动)
   * ========================================================= */

  function setupGoTop() {
    document.body.addEventListener('click', function (ev) {
      var el = ev.target.closest('a[rel="go-top"]');
      if (!el) return;
      ev.preventDefault();
      window.scrollTo({ top: 0, behavior: 'smooth' });
    });
  }

  /* =========================================================
   * 10. Sticky Footer (替代 xenon-custom.js stickFooterToBottom)
   * ========================================================= */

  function stickFooterToBottom() {
    var footer = public_vars.$mainFooter;
    if (!footer || !hasClass(footer, 'sticky')) return;
    if (window.isxs()) {
      footer.style.marginTop = '';
      return;
    }
    var winH       = window.innerHeight;
    var footerH    = footer.offsetHeight;
    var footerTop  = footer.getBoundingClientRect().top + window.pageYOffset;
    var totalH     = footerTop + footerH;
    var diff       = winH - totalH;
    footer.style.marginTop = (diff > 0 ? diff : 0) + 'px';
  }

  /* =========================================================
   * 11. Resize handler (替代 resizeable.js trigger_resizable)
   * ========================================================= */

  var resizeTimer = 0;
  function onResize() {
    clearTimeout(resizeTimer);
    resizeTimer = setTimeout(function () {
      var bp = getCurrentBreakpoint();
      if (bp !== lastBreakpoint) {
        lastBreakpoint = bp;
        if (bp === 'tabletscreen' && public_vars.$sidebarMenu) {
          addClass(public_vars.$sidebarMenu, 'collapsed');
        }
      }
      stickFooterToBottom();
    }, 200);
  }

  /* =========================================================
   * 12. User Info 等高 (替代 xenon-custom.js)
   * ========================================================= */

  function setupUserInfoHeight() {
    var uim = public_vars.$userInfoMenu;
    if (!uim) return;
    var items = $$('.user-info-menu > li', uim);
    var h = uim.offsetHeight - 1;
    items.forEach(function (li) { li.style.minHeight = h + 'px'; });
  }

  /* =========================================================
   * 13. DOMContentLoaded 初始化
   * ========================================================= */

  document.addEventListener('DOMContentLoaded', function () {
    initPublicVars();
    setupSidebarMenu();
    setupToggles();
    setupTooltips();
    setupGoTop();
    setupUserInfoHeight();
    stickFooterToBottom();
    window.addEventListener('resize', onResize);
  });

})(window, document);
