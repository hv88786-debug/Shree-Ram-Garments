/* =========================================================================
   Shree Ram Garments — shared data layer + helpers for the public pages
   -------------------------------------------------------------------------
   Products, categories, store settings, announcements and homepage content
   now come from Supabase (managed in /admin/). This file:
     - reads them through the public REST API using the PUBLIC anon key only
       (assets/config.js; the anon key is safe to expose, Row Level Security
       limits it to read-only access of active, public data),
     - exposes the same window.SRG helpers the pages already used,
     - falls back to the demo catalogue (assets/demo-data.js) ONLY when
       Supabase is not configured (e.g. opening the site locally before setup).

   Pages wait for  SRG.ready  (catalogue)  and may call  SRG.homepage() .
   ========================================================================= */
(function () {
  var cfg = window.SRG_CONFIG || {};
  var CONFIGURED = !!(cfg.supabaseUrl && cfg.supabaseAnonKey);
  var BASE = CONFIGURED ? String(cfg.supabaseUrl).replace(/\/+$/, '') + '/rest/v1/' : '';

  var DEFAULT_WA = '917976399389';
  var settings = {
    storeName: 'Shree Ram Garments & Sarees', logoUrl: '', whatsapp: DEFAULT_WA, address: '', hours: '',
    instagram: '', facebook: '', youtube: '', maps: ''
  };
  var CATEGORIES = [];
  var PRODUCTS = [];

  // ---------- helpers ----------
  function formatPrice(n) { return '₹' + Number(n).toLocaleString('en-IN'); }
  function esc(s) { return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]; }); }
  function categoryOf(id) {
    for (var i = 0; i < CATEGORIES.length; i++) if (CATEGORIES[i].id === id) return CATEGORIES[i];
    return { id: id, label: 'Collection', subs: [] };
  }
  function byId(id) {
    for (var i = 0; i < PRODUCTS.length; i++) if (PRODUCTS[i].id === id || PRODUCTS[i].uuid === id) return PRODUCTS[i];
  }
  function productUrl(p) { return 'product.html?id=' + encodeURIComponent(p.id); }
  function safeUrl(u) { return /^https?:\/\//i.test(u || '') ? u : ''; }

  // ---------- WhatsApp ----------
  function waNumber() { return String(settings.whatsapp || DEFAULT_WA).replace(/\D/g, '') || DEFAULT_WA; }
  function storeShortName() { return (settings.storeName || 'Shree Ram Garments').replace(/\s*&\s*Sarees\s*$/i, '').trim() || 'Shree Ram Garments'; }
  // sel = { size, color } (both optional)
  function waMessage(p, sel) {
    sel = sel || {};
    var lines = ['Hello ' + storeShortName() + '! I am interested in this product:', '*' + p.name + '*', 'Price: ' + formatPrice(p.price)];
    if (p.sku) lines.push('SKU: ' + p.sku);
    if (sel.size) lines.push('Size: ' + sel.size);
    if (sel.color) lines.push('Colour: ' + sel.color);
    if (/^https?:$/.test(location.protocol)) lines.push('Link: ' + location.origin + '/' + productUrl(p));
    lines.push(sel.size || sel.color ? 'Please confirm availability.' : 'Please share more details, available sizes and colours.');
    return lines.join('\n');
  }
  function waLink(p, sel) { return 'https://wa.me/' + waNumber() + '?text=' + encodeURIComponent(waMessage(p, sel)); }
  function waGeneralLink() {
    return 'https://wa.me/' + waNumber() + '?text=' + encodeURIComponent('Hello ' + storeShortName() + '! I would like to know more about your collection and available sizes. Please guide me.');
  }

  // ---------- rendering helpers ----------
  function placeholderHtml(p) {
    return '<div class="srg-ph absolute inset-0 flex flex-col items-center justify-center gap-2 text-center px-4 bg-gradient-to-b from-surface-container-low to-surface-container">' +
      '<span class="material-symbols-outlined text-[44px] text-secondary/70" aria-hidden="true">checkroom</span>' +
      '<span class="font-label-sm text-label-sm uppercase tracking-widest text-on-surface-variant">' + esc(p.sub || categoryOf(p.category).label) + '</span>' +
      '<span class="font-body-sm text-body-sm text-on-surface-variant/80">Photo coming soon</span></div>';
  }
  function imageHtml(p, extraClass, src) {
    var url = src || p.image;
    if (!url) return placeholderHtml(p);
    return '<img src="' + esc(url) + '" alt="' + esc(p.name) + '" loading="lazy" decoding="async" data-pid="' + esc(p.id) + '" class="absolute inset-0 w-full h-full object-cover ' + (extraClass || '') + '">';
  }
  // Swap any image that fails to load for the placeholder.
  function attachImageFallback(root) {
    root.addEventListener('error', function (e) {
      var img = e.target;
      if (!img || img.tagName !== 'IMG' || !img.dataset.pid) return;
      var p = byId(img.dataset.pid);
      if (!p) return;
      var wrap = document.createElement('div');
      wrap.innerHTML = placeholderHtml(p);
      img.replaceWith(wrap.firstChild);
    }, true);
  }

  function isTracked(p) { return p.variants && p.variants.length > 0; }
  function isSoldOut(p) { return isTracked(p) && !p.variants.some(function (v) { return v.inStock; }); }
  function discountPct(p) { return p.originalPrice && p.originalPrice > p.price ? Math.round((1 - p.price / p.originalPrice) * 100) : 0; }
  function priceHtml(p, cls) {
    return '<span class="' + (cls || '') + '">' + formatPrice(p.price) + '</span>' +
      (p.originalPrice && p.originalPrice > p.price ? ' <span class="line-through text-on-surface-variant/70 font-normal text-[0.85em] ml-1">' + formatPrice(p.originalPrice) + '</span>' : '');
  }

  var BADGE_CLS = { 'New Arrival': 'bg-secondary-container text-on-secondary-container', 'Bestseller': 'bg-primary-container text-on-primary' };
  var WA_ICON = '<svg viewBox="0 0 24 24" width="22" height="22" fill="currentColor" aria-hidden="true"><path d="M12.04 2a9.9 9.9 0 0 0-8.5 14.9L2 22l5.27-1.38A9.9 9.9 0 1 0 12.04 2Zm5.8 14.1c-.25.7-1.45 1.33-2 1.4-.52.07-1.17.1-1.9-.12a17.2 17.2 0 0 1-1.72-.64c-3.02-1.3-4.98-4.34-5.13-4.54-.15-.2-1.22-1.62-1.22-3.09 0-1.47.77-2.19 1.04-2.49.27-.3.6-.37.8-.37h.57c.18 0 .43-.07.67.51.25.6.84 2.07.91 2.22.07.15.12.32.02.52-.1.2-.15.32-.3.5-.15.17-.31.38-.44.51-.15.15-.3.31-.13.6.17.3.77 1.27 1.65 2.05 1.13 1.01 2.09 1.32 2.39 1.47.3.15.47.12.65-.07.17-.2.75-.87.95-1.17.2-.3.4-.25.67-.15.27.1 1.75.82 2.05.97.3.15.5.22.57.35.07.12.07.72-.18 1.42Z"/></svg>';

  // Shared product card (used by shop.js and home.js).
  function cardHtml(p) {
    var cat = categoryOf(p.category), url = productUrl(p), sold = isSoldOut(p);
    var kicker = esc(cat.label) + (p.sub ? ' · ' + esc(p.sub) : '');
    return '<article class="srg-card group flex flex-col bg-surface-container-lowest rounded-xl overflow-hidden border border-secondary/15 shadow-sm">' +
      '<a href="' + url + '" class="relative block w-full aspect-[3/4] overflow-hidden bg-surface-container" aria-label="View details: ' + esc(p.name) + '" tabindex="-1">' +
        imageHtml(p, 'srg-img') +
        (p.badge ? '<span class="absolute top-2 left-2 px-2 py-0.5 rounded text-[10px] sm:text-[11px] font-bold uppercase tracking-wider ' + (BADGE_CLS[p.badge] || 'bg-primary text-on-primary') + '">' + esc(p.badge) + '</span>' : '') +
        (sold ? '<span class="absolute bottom-2 left-2 px-2 py-0.5 rounded text-[10px] sm:text-[11px] font-bold uppercase tracking-wider bg-inverse-surface text-inverse-on-surface">Sold out</span>' : '') +
      '</a>' +
      '<div class="p-3 sm:p-4 flex flex-col flex-1 gap-2">' +
        '<p class="font-label-sm text-label-sm text-secondary uppercase font-bold tracking-wider leading-snug">' + kicker + '</p>' +
        '<h3 class="font-headline-sm text-[15px] sm:text-headline-sm leading-snug text-primary font-semibold"><a href="' + url + '" class="hover:text-secondary transition-colors">' + esc(p.name) + '</a></h3>' +
        '<p class="font-price-display text-price-display text-primary mt-auto pt-1">' + priceHtml(p) + '</p>' +
        '<div class="flex items-stretch gap-2">' +
          '<a href="' + url + '" class="flex-1 inline-flex items-center justify-center min-h-[44px] px-2 rounded-lg bg-primary-container text-on-primary hover:bg-primary transition-colors font-label-md text-label-md uppercase tracking-wider text-center">View Details</a>' +
          '<a href="' + waLink(p) + '" target="_blank" rel="noopener noreferrer" aria-label="Enquire about ' + esc(p.name) + ' on WhatsApp" title="WhatsApp Enquiry" class="inline-flex items-center justify-center w-11 min-h-[44px] rounded-lg bg-[#25D366] text-white hover:bg-[#1EBE5D] transition-colors">' + WA_ICON + '</a>' +
        '</div></div></article>';
  }

  // ---------- loading / error states ----------
  function skeletonCards(n) {
    var one = '<div class="rounded-xl overflow-hidden border border-secondary/15 bg-surface-container-lowest animate-pulse" aria-hidden="true">' +
      '<div class="aspect-[3/4] bg-surface-container"></div><div class="p-3 space-y-2"><div class="h-3 w-1/2 bg-surface-container rounded"></div><div class="h-4 w-4/5 bg-surface-container rounded"></div><div class="h-4 w-1/3 bg-surface-container rounded"></div><div class="h-11 bg-surface-container rounded-lg"></div></div></div>';
    var out = ''; for (var i = 0; i < n; i++) out += one; return out;
  }
  function errorHtml(msg) {
    return '<div class="col-span-full text-center py-space-2xl px-4" role="alert">' +
      '<span class="material-symbols-outlined text-[48px] text-secondary/60" aria-hidden="true">cloud_off</span>' +
      '<h2 class="font-headline-md text-headline-md text-primary mt-2">' + esc(msg || 'We could not load the collection') + '</h2>' +
      '<p class="text-on-surface-variant mt-1">Please check your internet connection and try again, or message us directly on WhatsApp.</p>' +
      '<div class="mt-space-md flex flex-wrap items-center justify-center gap-3">' +
      '<button type="button" data-srg-retry class="inline-flex items-center justify-center min-h-[44px] px-6 rounded-lg bg-primary-container text-on-primary font-label-md text-label-md uppercase tracking-wider">Try again</button>' +
      '<a href="' + waGeneralLink() + '" target="_blank" rel="noopener noreferrer" class="inline-flex items-center justify-center min-h-[44px] px-6 rounded-lg bg-[#25D366] text-white font-label-md text-label-md uppercase tracking-wider">WhatsApp us</a></div></div>';
  }

  // ---------- data loading ----------
  function rest(path) {
    var ctl = typeof AbortController === 'function' ? new AbortController() : null;
    var timer = ctl ? setTimeout(function () { ctl.abort(); }, 15000) : null;
    return fetch(BASE + path, {
      headers: { apikey: cfg.supabaseAnonKey, Authorization: 'Bearer ' + cfg.supabaseAnonKey, Accept: 'application/json' },
      signal: ctl ? ctl.signal : undefined
    }).then(function (r) {
      if (timer) clearTimeout(timer);
      if (!r.ok) throw new Error('Request failed (' + r.status + ')');
      return r.json();
    }, function (e) { if (timer) clearTimeout(timer); throw e; });
  }

  function mapProduct(r) {
    var imgs = (r.images || []).slice().sort(function (a, b) { return a.sort_order - b.sort_order; }).map(function (i) { return i.url; });
    var vars = (r.variants || []).slice().sort(function (a, b) { return a.sort_order - b.sort_order; }).map(function (v) {
      return { size: v.size || '', color: v.color || '', hex: v.color_hex || '', inStock: !!v.in_stock };
    });
    var cat = r.category || {};
    return {
      id: r.slug, uuid: r.id, sku: r.sku || '', name: r.name, category: cat.slug || '', sub: r.subcategory || '',
      price: Number(r.price), originalPrice: r.original_price == null ? null : Number(r.original_price),
      image: imgs[0] || null, images: imgs,
      badge: r.is_new_arrival ? 'New Arrival' : (r.is_featured ? 'Bestseller' : null),
      featured: !!r.is_featured, isNew: !!r.is_new_arrival,
      added: String(r.created_at || '').slice(0, 10), createdAt: r.created_at || '',
      description: r.description || '', variants: vars
    };
  }
  function mapDemoProduct(p) {
    return {
      id: p.id, uuid: p.id, sku: '', name: p.name, category: p.category, sub: p.sub, price: p.price, originalPrice: null,
      image: p.image, images: p.image ? [p.image] : [], badge: p.badge || null,
      featured: p.badge === 'Bestseller', isNew: p.badge === 'New Arrival', added: p.added, createdAt: p.added,
      description: p.description, variants: []
    };
  }
  function replaceAll(target, items) { target.length = 0; items.forEach(function (x) { target.push(x); }); }

  function loadDemo() {
    return new Promise(function (resolve, reject) {
      if (window.SRG_DEMO) return resolve(window.SRG_DEMO);
      var s = document.createElement('script');
      s.src = 'assets/demo-data.js';
      s.onload = function () { resolve(window.SRG_DEMO); };
      s.onerror = function () { reject(new Error('Demo data missing')); };
      document.head.appendChild(s);
    });
  }

  var readyPromise = null;
  function loadCatalog() {
    if (!CONFIGURED) {
      try { console.warn('[Shree Ram Garments] Supabase is not configured (assets/config.js) - showing demo products.'); } catch (e) { }
      return loadDemo().then(function (d) {
        replaceAll(CATEGORIES, d.CATEGORIES.map(function (c) { return { id: c.id, label: c.label, subs: c.subs.slice() }; }));
        replaceAll(PRODUCTS, d.PRODUCTS.map(mapDemoProduct));
      });
    }
    return Promise.all([
      rest('categories?select=slug,name,subcategories,sort_order&order=sort_order.asc,name.asc'),
      rest('products?select=id,slug,name,sku,description,subcategory,price,original_price,is_featured,is_new_arrival,created_at,' +
        'category:categories(slug,name),images:product_images(url,sort_order),variants:product_variants(size,color,color_hex,in_stock,sort_order)' +
        '&order=created_at.desc&limit=1000')
    ]).then(function (res) {
      replaceAll(CATEGORIES, res[0].map(function (c) { return { id: c.slug, label: c.name, subs: c.subcategories || [] }; }));
      replaceAll(PRODUCTS, res[1].map(mapProduct));
    });
  }
  // (Re)loads the catalogue. Pages call this again for the "Try again" button.
  function load() { readyPromise = loadCatalog(); api.ready = readyPromise; return readyPromise; }

  // Homepage text/images (single row). Resolves to null when unavailable.
  var homePromise = null;
  function homepage() {
    if (!CONFIGURED) return Promise.resolve(null);
    if (!homePromise) homePromise = rest('homepage_content?select=*&id=eq.1').then(function (r) { return r[0] || null; }).catch(function () { return null; });
    return homePromise;
  }

  // ---------- site "chrome": settings, announcements, footer, WhatsApp links ----------
  function $all(sel) { return Array.prototype.slice.call(document.querySelectorAll(sel)); }
  function setText(sel, text) { if (text) $all(sel).forEach(function (el) { el.textContent = text; }); }

  function applySettings() {
    var wa = waNumber();
    $all('a[href*="wa.me/"]').forEach(function (a) { a.href = a.getAttribute('href').replace(/wa\.me\/\d+/, 'wa.me/' + wa); });
    if (settings.storeName) {
      var name = settings.storeName, upper = name.toUpperCase();
      setText('[data-srg="store-name-footer"]', upper);
      $all('[data-srg="store-name-header"]').forEach(function (el) {
        var i = upper.indexOf(' & ');
        el.textContent = i > 0 ? upper.slice(0, i) : upper;
        if (i > 0) { var sp = document.createElement('span'); sp.className = 'hidden 2xl:inline'; sp.textContent = upper.slice(i); el.appendChild(sp); }
      });
    }
    $all('[data-srg="logo"]').forEach(function (img) { if (safeUrl(settings.logoUrl)) img.src = settings.logoUrl; });
    setText('[data-srg="address"]', settings.address);
    setText('[data-srg="hours"]', settings.hours);
    $all('[data-srg="maps"]').forEach(function (a) { if (safeUrl(settings.maps)) a.href = settings.maps; });
    var socials = [['instagram', 'Instagram', 'photo_camera'], ['facebook', 'Facebook', 'thumb_up'], ['youtube', 'YouTube', 'smart_display']]
      .filter(function (s) { return safeUrl(settings[s[0]]); });
    $all('[data-srg="socials"]').forEach(function (box) {
      if (!socials.length) return;
      box.innerHTML = socials.map(function (s) {
        return '<a href="' + esc(settings[s[0]]) + '" target="_blank" rel="noopener noreferrer" class="inline-flex items-center gap-1 text-secondary-fixed font-label-md text-label-md hover:underline">' +
          '<span class="material-symbols-outlined text-[16px]" aria-hidden="true">' + s[2] + '</span>' + s[1] + '</a>';
      }).join('');
      box.classList.remove('hidden');
    });
  }

  function applyAnnouncements(list) {
    if (!list || !list.length) return;
    var els = $all('[data-srg="announcement"]');
    if (!els.length) return;
    var i = 0;
    function show() {
      var a = list[i % list.length];
      els.forEach(function (el) {
        if (a.link_url && /^(https?:\/\/|\/|[a-z0-9_-]+\.html)/i.test(a.link_url)) {
          el.innerHTML = '<a class="underline underline-offset-2" href="' + esc(a.link_url) + '">' + esc(a.message) + '</a>';
        } else { el.textContent = a.message; }
      });
    }
    show();
    var reduce = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (list.length > 1 && !reduce) setInterval(function () { i++; show(); }, 6000);
  }

  function loadChrome() {
    if (!CONFIGURED) return Promise.resolve();
    return Promise.all([
      rest('store_settings?select=store_name,logo_url,whatsapp_number,address,opening_hours,instagram_url,facebook_url,youtube_url,maps_url&id=eq.1').catch(function () { return null; }),
      rest('announcements?select=message,link_url,sort_order&order=sort_order.asc,created_at.desc&limit=5').catch(function () { return null; })
    ]).then(function (res) {
      var s = res[0] && res[0][0];
      if (s) {
        settings.storeName = s.store_name || settings.storeName; settings.logoUrl = s.logo_url || '';
        settings.whatsapp = s.whatsapp_number || DEFAULT_WA; settings.address = s.address || ''; settings.hours = s.opening_hours || '';
        settings.instagram = s.instagram_url || ''; settings.facebook = s.facebook_url || ''; settings.youtube = s.youtube_url || ''; settings.maps = s.maps_url || '';
      }
      applySettings();
      applyAnnouncements(res[1]);
      api.settingsApplied = true;
      document.dispatchEvent(new CustomEvent('srg:settings'));
    });
  }

  var api = {
    CONFIGURED: CONFIGURED, CATEGORIES: CATEGORIES, PRODUCTS: PRODUCTS, settings: settings,
    formatPrice: formatPrice, categoryOf: categoryOf, byId: byId, productUrl: productUrl,
    waMessage: waMessage, waLink: waLink, waGeneralLink: waGeneralLink, esc: esc,
    imageHtml: imageHtml, cardHtml: cardHtml, placeholderHtml: placeholderHtml, attachImageFallback: attachImageFallback,
    isTracked: isTracked, isSoldOut: isSoldOut, discountPct: discountPct, priceHtml: priceHtml,
    skeletonCards: skeletonCards, errorHtml: errorHtml, load: load, homepage: homepage, safeUrl: safeUrl,
    ready: null, settingsApplied: false
  };
  Object.defineProperty(api, 'WHATSAPP_NUMBER', { get: waNumber });
  window.SRG = api;

  load();
  // Chrome (settings / announcements) never blocks the page: static HTML text is the fallback.
  var run = function () { loadChrome().catch(function () { }); };
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', run); else run();
})();
