/* Homepage: fills product sections from the central product data (assets/products.js).
   To change which products appear, edit the data-ids lists in index.html. */
(function () {
  var S = window.SRG;
  document.querySelectorAll('[data-home-products]').forEach(function (el) {
    var ids = (el.getAttribute('data-ids') || '').split(',');
    el.innerHTML = ids.map(function (id) { var p = S.byId(id.trim()); return p ? S.cardHtml(p) : ''; }).join('');
    S.attachImageFallback(el);
  });
})();
