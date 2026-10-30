/* Product details page. Reads ?id=<slug> and looks the product up in the shared catalogue.
   Shows a photo gallery, size / colour pickers (with out-of-stock states) and a WhatsApp
   enquiry link that carries name, price, SKU, selected size and selected colour. */
(function () {
  var S = window.SRG, root = document.getElementById('product-root');
  var id = new URLSearchParams(location.search).get('id');
  var BTN = 'inline-flex items-center justify-center min-h-[44px] px-6 rounded-lg bg-primary-container text-on-primary font-label-md text-label-md uppercase tracking-wider';

  function skeleton() {
    root.innerHTML = '<div class="grid grid-cols-1 md:grid-cols-2 gap-gutter-lg animate-pulse" aria-busy="true" aria-label="Loading product">' +
      '<div class="aspect-[3/4] rounded-xl bg-surface-container"></div><div class="space-y-4"><div class="h-3 w-1/3 bg-surface-container rounded"></div>' +
      '<div class="h-10 w-4/5 bg-surface-container rounded"></div><div class="h-8 w-1/4 bg-surface-container rounded"></div><div class="h-24 bg-surface-container rounded"></div></div></div>';
  }
  function notFound() {
    document.title = 'Product not found | Shree Ram Garments & Sarees';
    root.innerHTML = '<div class="text-center py-space-2xl"><h1 class="font-headline-lg text-headline-lg text-primary font-bold">Product not found</h1>' +
      '<p class="mt-2 text-on-surface-variant">This product may have been removed or the link is incorrect.</p>' +
      '<a href="shop.html" class="mt-space-lg ' + BTN + '">Back to all products</a></div>';
  }
  function failed() {
    root.innerHTML = '<div class="grid grid-cols-1">' + S.errorHtml('We could not load this product') + '</div>';
  }

  function uniq(list, key) {
    var seen = {}, out = [];
    list.forEach(function (v) { var k = v[key]; if (k && !seen[k]) { seen[k] = 1; out.push(v); } });
    return out;
  }

  function render(p) {
    var cat = S.categoryOf(p.category);
    document.title = p.name + ' | Shree Ram Garments & Sarees';
    var sel = { size: '', color: '' };
    var sizes = uniq(p.variants, 'size'), colors = uniq(p.variants, 'color');
    var related = S.PRODUCTS.filter(function (r) { return r.category === p.category && r.id !== p.id; }).slice(0, 4);
    var relatedHtml = related.map(function (r) {
      return '<a href="' + S.productUrl(r) + '" class="srg-card group block bg-surface-container-lowest rounded-xl overflow-hidden border border-secondary/15">' +
        '<div class="relative w-full aspect-[3/4] bg-surface-container overflow-hidden">' + S.imageHtml(r, 'srg-img') + '</div>' +
        '<div class="p-3"><p class="font-headline-sm text-[15px] leading-snug text-primary font-semibold">' + S.esc(r.name) + '</p><p class="font-price-display text-price-display text-primary mt-1">' + S.priceHtml(r) + '</p></div></a>';
    }).join('');

    var pct = S.discountPct(p);
    var thumbs = p.images.length > 1 ? '<div id="pd-thumbs" class="mt-3 flex gap-2 overflow-x-auto no-scrollbar" role="group" aria-label="Product photos">' +
      p.images.map(function (u, i) {
        return '<button type="button" data-i="' + i + '" aria-label="Show photo ' + (i + 1) + '" aria-pressed="' + (i === 0) + '" class="pd-thumb shrink-0 w-16 h-20 rounded-lg overflow-hidden border-2 ' + (i === 0 ? 'border-secondary' : 'border-transparent') + ' bg-surface-container">' +
          '<img src="' + S.esc(u) + '" alt="" class="w-full h-full object-cover" loading="lazy" decoding="async"></button>';
      }).join('') + '</div>' : '';

    root.innerHTML =
      '<nav aria-label="Breadcrumb" class="font-body-sm text-body-sm text-on-surface-variant mb-space-md flex flex-wrap items-center gap-1">' +
        '<a class="hover:text-primary underline-offset-2 hover:underline" href="index.html">Home</a><span aria-hidden="true">/</span>' +
        '<a class="hover:text-primary underline-offset-2 hover:underline" href="shop.html">Shop</a><span aria-hidden="true">/</span>' +
        '<a class="hover:text-primary underline-offset-2 hover:underline" href="shop.html?cat=' + encodeURIComponent(p.category) + '">' + S.esc(cat.label) + '</a><span aria-hidden="true">/</span>' +
        '<span class="text-primary font-semibold" aria-current="page">' + S.esc(p.name) + '</span></nav>' +
      '<div class="grid grid-cols-1 md:grid-cols-2 gap-gutter-lg items-start">' +
        '<div class="w-full max-w-md mx-auto md:max-w-none"><div id="pd-main" class="relative w-full aspect-[3/4] rounded-xl overflow-hidden bg-surface-container border border-secondary/20">' + S.imageHtml(p) +
          (p.badge ? '<span class="absolute top-3 left-3 px-2.5 py-0.5 rounded text-[11px] font-bold uppercase tracking-wider bg-secondary-container text-on-secondary-container">' + S.esc(p.badge) + '</span>' : '') + '</div>' + thumbs + '</div>' +
        '<div class="flex flex-col gap-space-md">' +
          '<p class="font-label-sm text-label-sm text-secondary uppercase font-bold tracking-[0.2em]">' + S.esc(cat.label) + (p.sub ? ' · ' + S.esc(p.sub) : '') + '</p>' +
          '<h1 class="font-headline-xl-mobile md:font-headline-xl text-[32px] leading-[38px] md:text-[40px] md:leading-[48px] text-primary font-bold font-serif">' + S.esc(p.name) + '</h1>' +
          '<div><p class="font-headline-lg text-headline-lg text-primary font-bold">' + S.priceHtml(p) +
            (pct ? ' <span class="align-middle ml-2 px-2 py-0.5 rounded bg-secondary-container text-on-secondary-container text-[12px] font-bold tracking-wide">' + pct + '% OFF</span>' : '') + '</p>' +
          '<p class="font-body-sm text-body-sm text-on-surface-variant mt-1">' + (S.CONFIGURED ? 'Final price, sizes and availability are confirmed on WhatsApp.' : 'Demo price shown for preview. Final price, sizes and availability are confirmed on WhatsApp.') + '</p>' +
          (p.sku ? '<p class="font-body-sm text-body-sm text-on-surface-variant mt-1">SKU: <span class="font-semibold text-on-surface">' + S.esc(p.sku) + '</span></p>' : '') + '</div>' +
          '<div id="pd-stock"></div>' +
          '<div class="h-px w-full bg-secondary/30"></div>' +
          (sizes.length ? '<div><p class="font-label-md text-label-md uppercase tracking-wider text-on-surface-variant mb-2">Size: <span id="pd-size-label" class="text-primary">Select</span></p><div id="pd-sizes" class="flex flex-wrap gap-2" role="group" aria-label="Choose size"></div></div>' : '') +
          (colors.length ? '<div><p class="font-label-md text-label-md uppercase tracking-wider text-on-surface-variant mb-2">Colour: <span id="pd-color-label" class="text-primary">Select</span></p><div id="pd-colors" class="flex flex-wrap gap-2" role="group" aria-label="Choose colour"></div></div>' : '') +
          (p.description ? '<p class="font-body-lg text-body-lg text-on-surface whitespace-pre-line">' + S.esc(p.description) + '</p>' : '') +
          '<div class="flex flex-col sm:flex-row gap-space-sm pt-space-xs">' +
            '<a id="pd-wa" href="' + S.waLink(p) + '" target="_blank" rel="noopener noreferrer" class="inline-flex items-center justify-center gap-2 min-h-[48px] px-6 rounded-lg bg-[#25D366] text-white hover:bg-[#1EBE5D] transition-colors font-label-lg text-label-lg font-bold">' +
              '<span class="material-symbols-outlined text-[22px]" aria-hidden="true">chat</span><span id="pd-wa-text">Enquire on WhatsApp</span></a>' +
            '<a href="shop.html?cat=' + encodeURIComponent(p.category) + '" class="inline-flex items-center justify-center min-h-[48px] px-6 rounded-lg border border-primary-container text-primary-container hover:bg-surface-container transition-colors font-label-lg text-label-lg">More in ' + S.esc(cat.label) + '</a>' +
          '</div>' +
        '</div></div>' +
      (related.length ? '<section class="mt-space-2xl" aria-labelledby="rel-h"><div class="flex items-end justify-between mb-space-md pb-space-xs border-b border-secondary/20"><h2 id="rel-h" class="font-headline-lg-mobile text-headline-lg-mobile md:text-headline-lg text-primary font-bold">You May Also Like</h2>' +
        '<a class="font-label-md text-label-md text-primary hover:text-secondary font-semibold" href="shop.html?cat=' + encodeURIComponent(p.category) + '">View all →</a></div>' +
        '<div class="grid grid-cols-2 lg:grid-cols-4 gap-gutter">' + relatedHtml + '</div></section>' : '');
    S.attachImageFallback(root);

    // ---- gallery ----
    var main = document.getElementById('pd-main');
    var thumbBox = document.getElementById('pd-thumbs');
    if (thumbBox) thumbBox.addEventListener('click', function (e) {
      var b = e.target.closest('.pd-thumb'); if (!b) return;
      var old = main.querySelector('img[data-pid], .srg-ph'); if (!old) return;
      var wrap = document.createElement('div'); wrap.innerHTML = S.imageHtml(p, '', p.images[Number(b.dataset.i)]);
      old.replaceWith(wrap.firstChild);
      thumbBox.querySelectorAll('.pd-thumb').forEach(function (t) {
        var on = t === b; t.setAttribute('aria-pressed', on); t.classList.toggle('border-secondary', on); t.classList.toggle('border-transparent', !on);
      });
    });

    // ---- variants ----
    function inStock(size, color) {
      return p.variants.some(function (v) { return v.inStock && (!size || v.size === size) && (!color || v.color === color); });
    }
    function chip(label, on, disabled, extra) {
      return '<button type="button" data-v="' + S.esc(label) + '" aria-pressed="' + on + '" ' + (disabled ? 'aria-disabled="true" title="Out of stock"' : '') +
        ' class="pd-chip min-h-[44px] min-w-[44px] px-4 rounded-lg border-2 font-label-md text-label-md ' +
        (on ? 'border-secondary bg-secondary-container text-on-secondary-container' : 'border-outline-variant bg-surface-container-lowest text-primary') +
        (disabled ? ' opacity-45 line-through cursor-not-allowed' : ' hover:border-primary') + '">' + extra + S.esc(label) + '</button>';
    }
    function paint() {
      var sBox = document.getElementById('pd-sizes'), cBox = document.getElementById('pd-colors');
      if (sBox) sBox.innerHTML = sizes.map(function (v) { return chip(v.size, sel.size === v.size, !inStock(v.size, sel.color), ''); }).join('');
      if (cBox) cBox.innerHTML = colors.map(function (v) {
        var dot = S.safeUrl && /^#[0-9a-f]{6}$/i.test(v.hex) ? '<span class="inline-block w-3.5 h-3.5 rounded-full border border-outline-variant mr-2 align-[-2px]" style="background:' + v.hex + '"></span>' : '';
        return chip(v.color, sel.color === v.color, !inStock(sel.size, v.color), dot);
      }).join('');
      var sl = document.getElementById('pd-size-label'); if (sl) sl.textContent = sel.size || 'Select';
      var cl = document.getElementById('pd-color-label'); if (cl) cl.textContent = sel.color || 'Select';
      var stock = document.getElementById('pd-stock');
      if (S.isTracked(p)) {
        var ok = inStock(sel.size, sel.color);
        stock.innerHTML = ok
          ? '<p class="inline-flex items-center gap-1 font-label-md text-label-md uppercase tracking-wider text-[#1b6b3a]"><span class="material-symbols-outlined text-[18px]" aria-hidden="true">check_circle</span>' + ((sel.size || sel.color) ? 'Available' : 'In stock') + '</p>'
          : '<p class="inline-flex items-center gap-1 font-label-md text-label-md uppercase tracking-wider text-error"><span class="material-symbols-outlined text-[18px]" aria-hidden="true">remove_circle</span>' + ((sel.size || sel.color) ? 'This combination is out of stock' : 'Currently out of stock') + '</p>';
      }
      var wa = document.getElementById('pd-wa');
      wa.href = S.waLink(p, sel);
      document.getElementById('pd-wa-text').textContent = S.isSoldOut(p) ? 'Ask about availability on WhatsApp' : 'Enquire on WhatsApp';
    }
    function pick(kind) {
      return function (e) {
        var b = e.target.closest('.pd-chip'); if (!b) return;
        if (b.getAttribute('aria-disabled') === 'true') return;
        var v = b.dataset.v; sel[kind] = sel[kind] === v ? '' : v;   // tap again to clear
        // drop a selection from the other group if the new combination is unavailable
        var other = kind === 'size' ? 'color' : 'size';
        if (sel[other] && !inStock(sel.size, sel.color)) sel[other] = '';
        paint();
      };
    }
    var sb = document.getElementById('pd-sizes'), cb = document.getElementById('pd-colors');
    if (sb) sb.addEventListener('click', pick('size'));
    if (cb) cb.addEventListener('click', pick('color'));
    paint();
  }

  function start() {
    skeleton();
    S.ready.then(function () {
      var p = id ? S.byId(id) : null;
      if (!p) return notFound();
      render(p);
    }, failed);
  }
  root.addEventListener('click', function (e) { if (e.target.closest('[data-srg-retry]')) { S.load(); start(); } });
  start();
})();
