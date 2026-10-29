/* Shared UX: sticky-header state, mobile menu polish, scroll reveal, same-page links.
   No dependencies. Uses IntersectionObserver (no scroll handlers) and respects
   prefers-reduced-motion. Loaded last on every page. */
(function () {
  'use strict';
  var d = document, root = d.documentElement;
  var reduce = !!(window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches);
  var hasIO = 'IntersectionObserver' in window;

  /* 1. Header: compact state after the first ~24px of scrolling.
        Header is position:fixed and <main> already reserves its space, so nothing jumps. */
  var header = d.querySelector('header.fixed');
  if (header) {
    var bar = header.firstElementChild;
    var measure = function () { root.style.setProperty('--topbar-h', (bar ? bar.offsetHeight : 0) + 'px'); };
    measure();
    var raf = 0;
    window.addEventListener('resize', function () {
      if (raf) return; raf = requestAnimationFrame(function () { raf = 0; measure(); });
    }, { passive: true });
    if (hasIO) {
      var sentinel = d.createElement('div');
      sentinel.setAttribute('aria-hidden', 'true');
      sentinel.style.cssText = 'position:absolute;top:0;left:0;width:1px;height:24px;pointer-events:none;visibility:hidden';
      d.body.insertBefore(sentinel, d.body.firstChild);
      new IntersectionObserver(function (en) {
        header.classList.toggle('srg-scrolled', !en[0].isIntersecting);
      }).observe(sentinel);
    }
  }

  /* 2. Mobile menu: close after choosing a link, on outside tap, and when resizing to desktop.
        (Open/close toggle itself lives in the inline script on each page.) */
  var btn = d.getElementById('menu-btn'), nav = d.getElementById('mobile-nav');
  if (btn && nav) {
    var isOpen = function () { return !nav.classList.contains('hidden'); };
    nav.addEventListener('click', function (e) { if (e.target.closest('a') && isOpen()) btn.click(); });
    d.addEventListener('click', function (e) {
      if (isOpen() && !nav.contains(e.target) && !btn.contains(e.target)) btn.click();
    });
    if (window.matchMedia) {
      var mq = window.matchMedia('(min-width: 1280px)');
      var onMq = function (m) { if (m.matches && isOpen()) btn.click(); };
      if (mq.addEventListener) mq.addEventListener('change', onMq); else if (mq.addListener) mq.addListener(onMq);
    }
  }

  /* 3. Links to the page you are already on: scroll smoothly to top instead of reloading. */
  var norm = function (p) { return p.replace(/index\.html$/, '').replace(/\.html$/, ''); };
  d.addEventListener('click', function (e) {
    var a = e.target.closest && e.target.closest('a[href]');
    if (!a || e.defaultPrevented || e.button || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
    if (a.target && a.target !== '_self') return;
    if (a.origin !== location.origin || a.hash || a.search || location.search || location.hash) return;
    if (norm(a.pathname) !== norm(location.pathname)) return;
    e.preventDefault();
    window.scrollTo({ top: 0, behavior: reduce ? 'auto' : 'smooth' });
  });

  /* 4. Section reveal. Only sections that start below the fold get the hidden state,
        so there is no flash and no animation on first paint. */
  if (!reduce && hasIO) {
    var vh = window.innerHeight || root.clientHeight;
    var all = [].slice.call(d.querySelectorAll('main section'));
    var targets = all.filter(function (el) {
      for (var p = el.parentElement; p && p !== d.body; p = p.parentElement) { if (all.indexOf(p) > -1) return false; }
      return el.getBoundingClientRect().top > vh * 0.92;
    });
    if (targets.length) {
      var io = new IntersectionObserver(function (entries) {
        entries.forEach(function (en) {
          if (en.isIntersecting) { en.target.classList.add('is-in'); io.unobserve(en.target); }
        });
      }, { rootMargin: '0px 0px -8% 0px', threshold: 0 });
      targets.forEach(function (el) { el.classList.add('srg-reveal'); });
      root.classList.add('srg-reveal-ready');
      targets.forEach(function (el) { io.observe(el); });
    }
  }
})();
