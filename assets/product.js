/* Product details page. Reads ?id= and looks the product up in window.SRG. */
(function () {
  var S = window.SRG, root = document.getElementById('product-root');
  var id = new URLSearchParams(location.search).get('id');
  var p = id ? S.byId(id) : null;

  if (!p) {
    document.title = 'Product not found | Shree Ram Garments';
    root.innerHTML = '<div class="text-center py-space-2xl"><h1 class="font-headline-lg text-headline-lg text-primary font-bold">Product not found</h1>' +
      '<p class="mt-2 text-on-surface-variant">This product may have been removed or the link is incorrect.</p>' +
      '<a href="shop.html" class="mt-space-lg inline-flex items-center justify-center min-h-[44px] px-6 rounded-lg bg-primary-container text-on-primary font-label-md text-label-md uppercase tracking-wider">Back to all products</a></div>';
    return;
  }
  var cat = S.categoryOf(p.category);
  document.title = p.name + ' | Shree Ram Garments';

  var related = S.PRODUCTS.filter(function (r) { return r.category === p.category && r.id !== p.id; }).slice(0, 4);
  var relatedHtml = related.map(function (r) {
    return '<a href="' + S.productUrl(r) + '" class="group block bg-surface-container-lowest rounded-xl overflow-hidden border border-secondary/15 hover:shadow-[0_8px_24px_-4px_rgba(112,15,28,0.12)] transition-shadow">' +
      '<div class="relative w-full aspect-[3/4] bg-surface-container overflow-hidden">' + S.imageHtml(r, 'group-hover:scale-105 transition-transform duration-500') + '</div>' +
      '<div class="p-3"><p class="font-headline-sm text-[15px] leading-snug text-primary font-semibold">' + S.esc(r.name) + '</p><p class="font-price-display text-price-display text-primary mt-1">' + S.formatPrice(r.price) + '</p></div></a>';
  }).join('');

  root.innerHTML =
    '<nav aria-label="Breadcrumb" class="font-body-sm text-body-sm text-on-surface-variant mb-space-md flex flex-wrap items-center gap-1">' +
      '<a class="hover:text-primary underline-offset-2 hover:underline" href="index.html">Home</a><span aria-hidden="true">/</span>' +
      '<a class="hover:text-primary underline-offset-2 hover:underline" href="shop.html">Shop</a><span aria-hidden="true">/</span>' +
      '<a class="hover:text-primary underline-offset-2 hover:underline" href="shop.html?cat=' + p.category + '">' + S.esc(cat.label) + '</a><span aria-hidden="true">/</span>' +
      '<span class="text-primary font-semibold" aria-current="page">' + S.esc(p.name) + '</span></nav>' +
    '<div class="grid grid-cols-1 md:grid-cols-2 gap-gutter-lg items-start">' +
      '<div class="relative w-full max-w-md mx-auto md:max-w-none aspect-[3/4] rounded-xl overflow-hidden bg-surface-container border border-secondary/20">' + S.imageHtml(p) +
        (p.badge ? '<span class="absolute top-3 left-3 px-2.5 py-0.5 rounded text-[11px] font-bold uppercase tracking-wider bg-secondary-container text-on-secondary-container">' + S.esc(p.badge) + '</span>' : '') + '</div>' +
      '<div class="flex flex-col gap-space-md">' +
        '<p class="font-label-sm text-label-sm text-secondary uppercase font-bold tracking-[0.2em]">' + S.esc(cat.label) + ' · ' + S.esc(p.sub) + '</p>' +
        '<h1 class="font-headline-xl-mobile md:font-headline-xl text-[32px] leading-[38px] md:text-[40px] md:leading-[48px] text-primary font-bold font-serif">' + S.esc(p.name) + '</h1>' +
        '<div><p class="font-headline-lg text-headline-lg text-primary font-bold">' + S.formatPrice(p.price) + '</p>' +
        '<p class="font-body-sm text-body-sm text-on-surface-variant mt-1">Demo price shown for preview. Final price, sizes and availability are confirmed on WhatsApp.</p></div>' +
        '<div class="h-px w-full bg-secondary/30"></div>' +
        '<p class="font-body-lg text-body-lg text-on-surface">' + S.esc(p.description) + '</p>' +
        '<div class="flex flex-col sm:flex-row gap-space-sm pt-space-xs">' +
          '<a href="' + S.waLink(p) + '" target="_blank" rel="noopener noreferrer" class="inline-flex items-center justify-center gap-2 min-h-[48px] px-6 rounded-lg bg-[#25D366] text-white hover:bg-[#1EBE5D] transition-colors font-label-lg text-label-lg font-bold">' +
            '<span class="material-symbols-outlined text-[22px]" aria-hidden="true">chat</span>Enquire on WhatsApp</a>' +
          '<a href="shop.html?cat=' + p.category + '" class="inline-flex items-center justify-center min-h-[48px] px-6 rounded-lg border border-primary-container text-primary-container hover:bg-surface-container transition-colors font-label-lg text-label-lg">More in ' + S.esc(cat.label) + '</a>' +
        '</div>' +
      '</div></div>' +
    (related.length ? '<section class="mt-space-2xl" aria-labelledby="rel-h"><div class="flex items-end justify-between mb-space-md pb-space-xs border-b border-secondary/20"><h2 id="rel-h" class="font-headline-lg-mobile text-headline-lg-mobile md:text-headline-lg text-primary font-bold">You May Also Like</h2>' +
      '<a class="font-label-md text-label-md text-primary hover:text-secondary font-semibold" href="shop.html?cat=' + p.category + '">View all →</a></div>' +
      '<div class="grid grid-cols-2 lg:grid-cols-4 gap-gutter">' + relatedHtml + '</div></section>' : '');
  S.attachImageFallback(root);
})();
