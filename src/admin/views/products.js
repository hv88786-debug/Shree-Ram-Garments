import { supabase } from '../supabase.js';
import { html, mount, $, $$, icon, money, fmtDate, errMsg, errorState, skeletonRows, toast, confirmDialog, emptyState, debounce, raw, esc } from '../ui.js';
import { removeUnusedProductFiles } from '../images.js';

const PAGE = 12;
const SORTS = {
  newest: ['created_at', false, 'Newest first'], oldest: ['created_at', true, 'Oldest first'],
  name: ['name', true, 'Name A–Z'], 'price-asc': ['price', true, 'Price: low to high'], 'price-desc': ['price', false, 'Price: high to low'],
  'stock-asc': ['total_stock', true, 'Stock: low to high']
};
const STOCK_BADGE = {
  ok: ['badge-ok', 'In stock'], low: ['badge-warn', 'Low stock'], out: ['badge-bad', 'Out of stock'], untracked: ['badge-muted', 'Not tracked']
};

export async function render(ctx) {
  const { el } = ctx;
  const f = {
    q: ctx.params.get('q') || '', cat: ctx.params.get('cat') || '', status: ctx.params.get('status') || '',
    stock: ctx.params.get('stock') || '', flag: ctx.params.get('flag') || '',
    sort: SORTS[ctx.params.get('sort')] ? ctx.params.get('sort') : 'newest', page: Math.max(1, parseInt(ctx.params.get('page') || '1', 10) || 1)
  };
  let cats = [], seq = 0;

  const syncUrl = () => {
    const p = new URLSearchParams();
    Object.entries(f).forEach(([k, v]) => { if (v && !(k === 'sort' && v === 'newest') && !(k === 'page' && v === 1)) p.set(k, v); });
    history.replaceState(null, '', '#/products' + (p.toString() ? '?' + p : ''));
  };

  const { data: cdata, error: cerr } = await supabase.from('categories').select('id,name').order('sort_order');
  if (cerr) throw cerr; cats = cdata;
  if (!ctx.alive()) return;

  const sel = (name, value, options) => html`<select class="input" data-f="${name}" aria-label="${name}">${options.map(([v, l]) => html`<option value="${v}" ${v === value ? 'selected' : ''}>${l}</option>`)}</select>`;

  mount(el, html`
    <div class="flex flex-wrap items-end justify-between gap-3">
      <div><h1 class="text-[28px] font-semibold text-primary-container">Products</h1><p class="text-on-surface-variant" id="pl-sub">&nbsp;</p></div>
      <a class="btn-primary" href="#/products/new">${icon('add', 'text-[18px]')} Add product</a>
    </div>
    <div class="mt-4 card card-pad grid grid-cols-2 lg:grid-cols-6 gap-3 items-end">
      <div class="col-span-2 lg:col-span-2"><label class="label" for="pl-q">Search</label><input id="pl-q" type="search" class="input" placeholder="Name or SKU" value="${f.q}" autocomplete="off"></div>
      <div><label class="label">Category</label>${sel('cat', f.cat, [['', 'All categories'], ...cats.map((c) => [c.id, c.name])])}</div>
      <div><label class="label">Visibility</label>${sel('status', f.status, [['', 'All'], ['active', 'Visible'], ['inactive', 'Hidden']])}</div>
      <div><label class="label">Stock</label>${sel('stock', f.stock, [['', 'All'], ['ok', 'In stock'], ['low', 'Low stock'], ['out', 'Out of stock'], ['untracked', 'Not tracked']])}</div>
      <div><label class="label">Sort</label>${sel('sort', f.sort, Object.entries(SORTS).map(([k, v]) => [k, v[2]]))}</div>
      <div class="col-span-2 lg:col-span-6 flex flex-wrap items-center gap-2 -mt-1">
        <span class="label !mb-0 mr-1">Show only</span>
        ${[['', 'Everything'], ['featured', 'Featured'], ['new', 'New arrivals']].map(([v, l]) => html`<button type="button" data-flag="${v}" aria-pressed="${f.flag === v}" class="btn-sm ${f.flag === v ? 'btn-gold' : 'btn-ghost'}">${l}</button>`)}
        <button type="button" id="pl-clear" class="btn-sm btn-ghost ml-auto">${icon('filter_alt_off', 'text-[16px]')} Clear filters</button>
      </div>
    </div>
    <div id="pl-list" class="mt-4" aria-live="polite"></div>`);

  const list = $('#pl-list', el);

  async function load() {
    const my = ++seq;
    mount(list, skeletonRows(6));
    let q = supabase.from('admin_products_list').select('*', { count: 'exact' });
    const term = f.q.replace(/[%,()*\\"']/g, ' ').replace(/\s+/g, ' ').trim();
    if (term) q = q.or(`name.ilike.%${term}%,sku.ilike.%${term}%`);
    if (f.cat) q = q.eq('category_id', f.cat);
    if (f.status) q = q.eq('is_active', f.status === 'active');
    if (f.stock) q = q.eq('stock_status', f.stock);
    if (f.flag === 'featured') q = q.eq('is_featured', true);
    if (f.flag === 'new') q = q.eq('is_new_arrival', true);
    const [col, asc] = SORTS[f.sort];
    q = q.order(col, { ascending: asc }).order('id').range((f.page - 1) * PAGE, f.page * PAGE - 1);
    const { data, error, count } = await q;
    if (my !== seq || !ctx.alive()) return;
    if (error) { mount(list, errorState(errMsg(error))); $('[data-retry]', list).addEventListener('click', load); return; }
    // Page past the end after deleting the last item of a page.
    if (!data.length && f.page > 1 && count > 0) { f.page = Math.max(1, Math.ceil(count / PAGE)); return load(); }
    $('#pl-sub').textContent = `${count} product${count === 1 ? '' : 's'}${f.q || f.cat || f.status || f.stock || f.flag ? ' match your filters' : ' in total'}`;
    syncUrl();
    if (!data.length) {
      const filtered = f.q || f.cat || f.status || f.stock || f.flag;
      mount(list, html`<div class="card">${filtered ? emptyState('search_off', 'No products match', 'Try different filters or clear them.') : emptyState('checkroom', 'No products yet', 'Add your first product to show it on the website.', '<a class="btn-primary" href="#/products/new">Add product</a>')}</div>`);
      return;
    }
    const pages = Math.ceil(count / PAGE);
    mount(list, html`
      <div class="card overflow-hidden"><ul class="divide-y divide-[#efe6d6]">
        ${data.map((p) => {
          const [bc, bl] = STOCK_BADGE[p.stock_status] || STOCK_BADGE.untracked;
          return html`<li class="p-3 sm:p-4 flex flex-wrap sm:flex-nowrap items-center gap-3" data-id="${p.id}">
            <a href="#/products/${p.id}" class="w-14 h-[72px] rounded-md bg-surface-container overflow-hidden shrink-0 flex items-center justify-center" tabindex="-1" aria-hidden="true">
              ${p.image_url ? raw(`<img class="w-full h-full object-cover" alt="" loading="lazy" src="${esc(p.image_url)}">`) : icon('checkroom', 'text-secondary/60')}</a>
            <div class="min-w-0 flex-1 basis-[55%] sm:basis-0">
              <a href="#/products/${p.id}" class="font-semibold text-[15px] text-primary-container hover:underline line-clamp-2">${p.name}</a>
              <p class="text-[12px] text-on-surface-variant mt-0.5">${p.category_name}${p.sku ? ' · SKU ' + p.sku : ''} · Added ${fmtDate(p.created_at)}</p>
              <div class="mt-1.5 flex flex-wrap gap-1">
                <span class="${bc}">${bl}${p.stock_status === 'ok' || p.stock_status === 'low' ? ` · ${p.total_stock}` : ''}</span>
                ${p.is_featured ? html`<span class="badge-gold">Featured</span>` : ''}${p.is_new_arrival ? html`<span class="badge-gold">New</span>` : ''}
                ${p.is_active ? '' : html`<span class="badge-muted">Hidden</span>`}</div>
            </div>
            <div class="font-semibold text-right sm:w-28 shrink-0">${money(p.price)}${p.original_price ? html`<span class="block text-[12px] font-normal line-through text-on-surface-variant">${money(p.original_price)}</span>` : ''}</div>
            <div class="flex items-center gap-1 shrink-0 ml-auto">
              <button type="button" class="switch" role="switch" data-act="toggle" aria-checked="${p.is_active}" aria-label="Visible on website: ${p.name}" title="Visible on website"></button>
              <a class="btn-icon" href="#/products/${p.id}" aria-label="Edit ${p.name}" title="Edit">${icon('edit')}</a>
              <a class="btn-icon" href="#/products/new?from=${p.id}" aria-label="Duplicate ${p.name}" title="Duplicate">${icon('content_copy')}</a>
              <button type="button" class="btn-icon hover:!text-error" data-act="delete" aria-label="Delete ${p.name}" title="Delete">${icon('delete')}</button>
            </div></li>`;
        })}
      </ul></div>
      ${pages > 1 ? html`<nav class="mt-4 flex items-center justify-between" aria-label="Pagination">
        <button type="button" class="btn-ghost" data-page="${f.page - 1}" ${f.page <= 1 ? 'disabled' : ''}>${icon('chevron_left', 'text-[18px]')} Previous</button>
        <span class="text-on-surface-variant">Page ${f.page} of ${pages}</span>
        <button type="button" class="btn-ghost" data-page="${f.page + 1}" ${f.page >= pages ? 'disabled' : ''}>Next ${icon('chevron_right', 'text-[18px]')}</button></nav>` : ''}`);
    data.forEach(() => { });
    list._rows = Object.fromEntries(data.map((p) => [p.id, p]));
  }

  const reset = () => { f.page = 1; load(); };
  $('#pl-q', el).addEventListener('input', debounce((e) => { f.q = e.target.value; reset(); }, 350));
  $$('[data-f]', el).forEach((s) => s.addEventListener('change', () => { f[s.dataset.f] = s.value; reset(); }));
  $$('[data-flag]', el).forEach((b) => b.addEventListener('click', () => {
    f.flag = b.dataset.flag; $$('[data-flag]', el).forEach((x) => { const on = x.dataset.flag === f.flag; x.setAttribute('aria-pressed', on); x.className = 'btn-sm ' + (on ? 'btn-gold' : 'btn-ghost'); }); reset();
  }));
  $('#pl-clear', el).addEventListener('click', () => ctx.go('/products'));

  list.addEventListener('click', async (e) => {
    const pg = e.target.closest('[data-page]');
    if (pg && !pg.disabled) { f.page = Number(pg.dataset.page); load(); window.scrollTo({ top: 0 }); return; }
    const li = e.target.closest('li[data-id]'); if (!li) return;
    const p = list._rows[li.dataset.id];
    if (e.target.closest('[data-act="toggle"]')) {
      const { error } = await supabase.from('products').update({ is_active: !p.is_active }).eq('id', p.id);
      if (error) return toast(errMsg(error), 'error');
      toast(p.is_active ? `"${p.name}" is now hidden from the website.` : `"${p.name}" is now visible on the website.`);
      return load();
    }
    if (e.target.closest('[data-act="delete"]')) {
      const ok = await confirmDialog({
        title: `Delete "${p.name}"?`,
        message: 'This permanently removes the product, its photos and all its stock records. This cannot be undone.\n\nTip: if you only want to stop showing it, switch it to Hidden instead.',
        confirmText: 'Delete permanently', danger: true
      });
      if (!ok) return;
      const { data: imgs } = await supabase.from('product_images').select('storage_path').eq('product_id', p.id);
      const { error } = await supabase.from('products').delete().eq('id', p.id);
      if (error) return toast(errMsg(error), 'error');
      await removeUnusedProductFiles((imgs || []).map((i) => i.storage_path));
      toast('Product deleted.'); load();
    }
  });
  await load();
}
