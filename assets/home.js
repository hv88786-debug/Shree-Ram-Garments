/* Homepage: fills "Popular Picks" (featured) and "New Arrivals" from the catalogue,
   and applies hero / promo-banner content managed in the admin panel.
   Loading, empty and error states are handled here; static HTML is the fallback. */
(function () {
  var S = window.SRG;
  var grids = [].slice.call(document.querySelectorAll('[data-home-products]'));
  var LIMIT = 4;

  function newestFirst(a, b) { return a.createdAt < b.createdAt ? 1 : a.createdAt > b.createdAt ? -1 : 0; }

  function renderProducts() {
    var sorted = S.PRODUCTS.slice().sort(newestFirst);
    grids.forEach(function (el) {
      var kind = el.getAttribute('data-home-products');
      var list = sorted.filter(function (p) { return kind === 'featured' ? p.featured : p.isNew; }).slice(0, LIMIT);
      var section = el.closest('section');
      if (!list.length) { if (section) section.classList.add('hidden'); return; }
      if (section) section.classList.remove('hidden');
      el.innerHTML = list.map(S.cardHtml).join('');
      S.attachImageFallback(el);
    });
  }
  function showError() {
    grids.forEach(function (el) {
      var section = el.closest('section'); if (section) section.classList.remove('hidden');
      el.innerHTML = S.errorHtml('We could not load our products');
    });
  }
  function start() {
    grids.forEach(function (el) { el.innerHTML = S.skeletonCards(LIMIT); });
    S.ready.then(renderProducts, showError);
  }
  document.addEventListener('click', function (e) {
    if (e.target.closest('[data-srg-retry]')) { S.load(); start(); }
  });
  start();

  // ---- Hero + promo banner content ----
  function $(sel) { return document.querySelector('[data-srg="' + sel + '"]'); }
  function txt(sel, v) { var el = $(sel); if (el && v) el.textContent = v; }
  S.homepage().then(function (h) {
    if (!h) return;
    var img = $('hero-img');
    if (img && S.safeUrl(h.hero_image_url) && img.getAttribute('src') !== h.hero_image_url) img.src = h.hero_image_url;
    txt('hero-badge', h.hero_badge); txt('hero-title', h.hero_title); txt('hero-accent', h.hero_title_accent);
    var sub = $('hero-subtitle'); if (sub) { sub.textContent = h.hero_subtitle || ''; sub.classList.toggle('hidden', !h.hero_subtitle); }

    var promo = document.getElementById('promo-banner');
    if (promo) {
      var now = Date.now();
      var live = h.promo_is_active !== false &&
        (!h.promo_starts_at || Date.parse(h.promo_starts_at) <= now) &&
        (!h.promo_ends_at || Date.parse(h.promo_ends_at) > now);
      promo.classList.toggle('hidden', !live);
      txt('promo-badge', h.promo_badge); txt('promo-heading', h.promo_heading); txt('promo-accent', h.promo_heading_accent); txt('promo-body', h.promo_body);
      var pi = $('promo-img'); if (pi && S.safeUrl(h.promo_image_url) && pi.getAttribute('src') !== h.promo_image_url) pi.src = h.promo_image_url;
    }
  });
})();
