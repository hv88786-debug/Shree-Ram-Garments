/* Shop page logic: filter, price range, sort, URL state. Reads window.SRG (products.js). */
(function () {
  var S = window.SRG;
  var wantSearchFocus = new URLSearchParams(location.search).get('focus') === 'search';
  var $ = function (id) { return document.getElementById(id); };
  var grid = $('product-grid'), countEl = $('result-count'), emptyEl = $('empty-state');
  var chipsEl = $('category-chips'), subSel = $('sub-select'), sortSel = $('sort-select');
  var minIn = $('min-price'), maxIn = $('max-price'), clearBtns = document.querySelectorAll('[data-clear]');
  var searchIn = $('search-input');
  var state = { cat: 'all', sub: '', sort: 'featured', min: '', max: '', q: '' };

  function readUrl() {
    var q = new URLSearchParams(location.search);
    var cat = q.get('cat');
    state.cat = (cat === 'all' || S.categoryOf(cat)) ? cat : 'all';
    state.sub = q.get('sub') || '';
    state.sort = ['featured', 'newest', 'price-asc', 'price-desc'].indexOf(q.get('sort')) > -1 ? q.get('sort') : 'featured';
    state.min = q.get('min') || ''; state.max = q.get('max') || ''; state.q = (q.get('q') || '').trim();
  }
  function writeUrl() {
    var q = new URLSearchParams();
    if (state.cat !== 'all') q.set('cat', state.cat);
    if (state.sub) q.set('sub', state.sub);
    if (state.sort !== 'featured') q.set('sort', state.sort);
    if (state.min !== '') q.set('min', state.min);
    if (state.max !== '') q.set('max', state.max);
    if (state.q) q.set('q', state.q);
    var s = q.toString();
    history.replaceState(null, '', location.pathname + (s ? '?' + s : ''));
  }

  function renderChips() {
    var items = [{ id: 'all', label: 'All Products' }].concat(S.CATEGORIES);
    chipsEl.innerHTML = items.map(function (c) {
      var on = c.id === state.cat;
      return '<button type="button" data-cat="' + c.id + '" aria-pressed="' + on + '" class="shrink-0 px-4 py-2.5 min-h-[44px] rounded-full border font-label-md text-label-md uppercase tracking-wider transition-colors ' +
        (on ? 'bg-primary-container text-on-primary border-primary-container' : 'bg-surface-container-lowest text-primary border-secondary/40 hover:border-primary') + '">' + c.label + '</button>';
    }).join('');
  }
  function renderSubs() {
    var cat = S.categoryOf(state.cat);
    if (!cat) { subSel.innerHTML = '<option value="">All types</option>'; subSel.disabled = true; subSel.value = ''; return; }
    subSel.disabled = false;
    subSel.innerHTML = '<option value="">All types</option>' + cat.subs.map(function (s) {
      return '<option value="' + S.esc(s) + '">' + S.esc(s) + '</option>';
    }).join('');
    subSel.value = state.sub;
  }

  function filtered() {
    var min = state.min === '' ? 0 : Number(state.min), max = state.max === '' ? Infinity : Number(state.max);
    var list = S.PRODUCTS.filter(function (p) {
      var terms = state.q.toLowerCase().split(/\s+/).filter(Boolean);
      var hay = (p.name + ' ' + p.sub + ' ' + S.categoryOf(p.category).label + ' ' + p.description).toLowerCase();
      return terms.every(function (t) { return hay.indexOf(t) > -1; }) && (state.cat === 'all' || p.category === state.cat) && (!state.sub || p.sub === state.sub) && p.price >= min && p.price <= max;
    });
    if (state.sort === 'price-asc') list.sort(function (a, b) { return a.price - b.price; });
    else if (state.sort === 'price-desc') list.sort(function (a, b) { return b.price - a.price; });
    else if (state.sort === 'newest') list.sort(function (a, b) { return b.added < a.added ? -1 : b.added > a.added ? 1 : 0; });
    return list;
  }

  function render() {
    var list = filtered();
    grid.innerHTML = list.map(S.cardHtml).join('');
    countEl.textContent = 'Showing ' + list.length + (list.length === 1 ? ' product' : ' products') + (list.length !== S.PRODUCTS.length ? ' of ' + S.PRODUCTS.length : '');
    emptyEl.classList.toggle('hidden', list.length > 0);
    grid.classList.toggle('hidden', list.length === 0);
    var active = state.cat !== 'all' || state.sub || state.sort !== 'featured' || state.min !== '' || state.max !== '' || state.q;
    clearBtns.forEach(function (b) { if (b.id === 'clear-filters') b.classList.toggle('hidden', !active); });
    writeUrl();
  }
  function syncControls() { renderChips(); renderSubs(); sortSel.value = state.sort; minIn.value = state.min; maxIn.value = state.max; searchIn.value = state.q; }

  chipsEl.addEventListener('click', function (e) {
    var b = e.target.closest('button[data-cat]'); if (!b) return;
    state.cat = b.dataset.cat; state.sub = '';
    renderChips(); renderSubs(); render();
    var nb = chipsEl.querySelector('[data-cat="' + state.cat + '"]'); if (nb) nb.focus({ preventScroll: true });
  });
  subSel.addEventListener('change', function () { state.sub = subSel.value; render(); });
  sortSel.addEventListener('change', function () { state.sort = sortSel.value; render(); });
  function priceChange() {
    state.min = minIn.value.trim(); state.max = maxIn.value.trim();
    var lo = state.min === '' ? null : Number(state.min), hi = state.max === '' ? null : Number(state.max);
    var bad = lo !== null && hi !== null && lo > hi;
    $('price-error').classList.toggle('hidden', !bad);
    render();
  }
  searchIn.addEventListener('input', function () { state.q = searchIn.value.trim(); render(); });
  minIn.addEventListener('input', priceChange); maxIn.addEventListener('input', priceChange);
  clearBtns.forEach(function (b) {
    b.addEventListener('click', function () {
      state = { cat: 'all', sub: '', sort: 'featured', min: '', max: '', q: '' };
      $('price-error').classList.add('hidden'); syncControls(); render();
    });
  });

  S.attachImageFallback(grid);
  readUrl(); syncControls(); render();
  if (wantSearchFocus) searchIn.focus();
  window.addEventListener('popstate', function () { readUrl(); syncControls(); render(); });
})();
