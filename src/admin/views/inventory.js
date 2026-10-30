import { supabase } from '../supabase.js';
import { html, mount, $, $$, icon, errMsg, errorState, skeletonRows, toast, emptyState, debounce, raw, esc } from '../ui.js';

const PAGE = 25;

export async function render(ctx) {
  const { el } = ctx;
  const f = { q: ctx.params.get('q') || '', cat: '', status: ctx.params.get('status') || '', page: 1 };
  let seq = 0, threshold = 5;
  const [cr, sr] = await Promise.all([
    supabase.from('categories').select('id,name').order('sort_order'),
    supabase.from('admin_settings').select('low_stock_threshold').eq('id', 1).maybeSingle()
  ]);
  if (cr.error) throw cr.error;
  threshold = (sr.data && sr.data.low_stock_threshold) ?? 5;
  if (!ctx.alive()) return;

  mount(el, html`
    <div><h1 class="text-[28px] font-semibold text-primary-container">Inventory</h1>
      <p class="text-on-surface-variant">Update stock for each size and colour. Changes save automatically. Low stock means ${threshold} or fewer (<a class="underline font-semibold" href="#/settings">change</a>).</p></div>
    <div class="mt-4 card card-pad grid grid-cols-2 lg:grid-cols-4 gap-3 items-end">
      <div class="col-span-2"><label class="label" for="iv-q">Search</label><input id="iv-q" type="search" class="input" placeholder="Product name or SKU" value="${f.q}" autocomplete="off"></div>
      <div><label class="label" for="iv-cat">Category</label><select id="iv-cat" class="input"><option value="">All</option>${cr.data.map((c) => html`<option value="${c.id}">${c.name}</option>`)}</select></div>
      <div><label class="label" for="iv-st">Show</label><select id="iv-st" class="input">
        ${[['', 'All variants'], ['low', 'Low stock'], ['out', 'Out of stock'], ['ok', 'Healthy stock']].map(([v, l]) => html`<option value="${v}" ${v === f.status ? 'selected' : ''}>${l}</option>`)}</select></div>
    </div>
    <div id="iv-list" class="mt-4" aria-live="polite"></div>`);
  const list = $('#iv-list', el);

  async function load() {
    const my = ++seq; mount(list, skeletonRows(6));
    let q = supabase.from('admin_inventory').select('*', { count: 'exact' });
    const term = f.q.replace(/[%,()*\\"']/g, ' ').replace(/\s+/g, ' ').trim();
    if (term) q = q.or(`product_name.ilike.%${term}%,sku.ilike.%${term}%`);
    if (f.cat) q = q.eq('category_id', f.cat);
    if (f.status === 'low') q = q.eq('is_low', true);
    if (f.status === 'out') q = q.eq('is_out', true);
    if (f.status === 'ok') q = q.eq('is_low', false).eq('is_out', false);
    q = q.order('product_name').order('size').order('color').range((f.page - 1) * PAGE, f.page * PAGE - 1);
    const { data, error, count } = await q;
    if (my !== seq || !ctx.alive()) return;
    if (error) { mount(list, errorState(errMsg(error))); $('[data-retry]', list).addEventListener('click', load); return; }
    if (!data.length && f.page > 1 && count > 0) { f.page = Math.ceil(count / PAGE); return load(); }
    if (!data.length) { mount(list, html`<div class="card">${emptyState('inventory_2', f.q || f.cat || f.status ? 'Nothing matches' : 'No stock to track yet', f.q || f.cat || f.status ? 'Try different filters.' : 'Add sizes and colours to a product and its stock will appear here.', f.q || f.cat || f.status ? '' : '<a class="btn-primary" href="#/products">Go to products</a>')}</div>`); return; }
    const pages = Math.ceil(count / PAGE);
    mount(list, html`
      <div class="card overflow-hidden"><ul class="divide-y divide-[#efe6d6]">
        ${data.map((v) => {
          const label = [v.size, v.color].filter(Boolean).join(' / ') || 'Default';
          return html`<li class="p-3 sm:p-4 flex flex-wrap items-center gap-3" data-vid="${v.variant_id}">
            <span class="w-10 h-12 rounded bg-surface-container overflow-hidden shrink-0 flex items-center justify-center">${v.image_url ? raw(`<img class="w-full h-full object-cover" alt="" loading="lazy" src="${esc(v.image_url)}">`) : icon('checkroom', 'text-secondary/60 text-[20px]')}</span>
            <div class="min-w-0 flex-1 basis-40">
              <a class="font-semibold hover:underline block truncate" href="#/products/${v.product_id}">${v.product_name}</a>
              <p class="text-[12px] text-on-surface-variant">${label}${v.sku ? ' · ' + v.sku : ''}${v.product_active ? '' : ' · hidden product'}</p></div>
            <span data-badge>${v.is_out ? html`<span class="badge-bad">Out of stock</span>` : v.is_low ? html`<span class="badge-warn">Low</span>` : html`<span class="badge-ok">OK</span>`}</span>
            <div class="flex items-center gap-1">
              <button type="button" class="btn-ghost btn-sm !w-9 !px-0" data-step="-1" aria-label="Decrease stock of ${v.product_name} ${label}">−</button>
              <input type="number" min="0" max="100000" step="1" inputmode="numeric" class="input !w-20 !min-h-[36px] text-center font-semibold" value="${v.stock}" data-orig="${v.stock}" aria-label="Stock of ${v.product_name} ${label}">
              <button type="button" class="btn-ghost btn-sm !w-9 !px-0" data-step="1" aria-label="Increase stock of ${v.product_name} ${label}">+</button>
              <button type="button" class="btn-sm btn-ghost" data-zero title="Mark out of stock">Set 0</button>
              <span class="w-5 text-[#1b6b3a]" data-state aria-live="polite"></span>
            </div></li>`;
        })}
      </ul></div>
      ${pages > 1 ? html`<nav class="mt-4 flex items-center justify-between" aria-label="Pagination">
        <button type="button" class="btn-ghost" data-page="${f.page - 1}" ${f.page <= 1 ? 'disabled' : ''}>Previous</button><span class="text-on-surface-variant">Page ${f.page} of ${pages} · ${count} variants</span>
        <button type="button" class="btn-ghost" data-page="${f.page + 1}" ${f.page >= pages ? 'disabled' : ''}>Next</button></nav>` : html`<p class="mt-3 text-on-surface-variant text-center">${count} variant${count === 1 ? '' : 's'}</p>`}`);
  }

  const reset = () => { f.page = 1; load(); };
  $('#iv-q', el).addEventListener('input', debounce((e) => { f.q = e.target.value; reset(); }, 350));
  $('#iv-cat', el).addEventListener('change', (e) => { f.cat = e.target.value; reset(); });
  $('#iv-st', el).addEventListener('change', (e) => { f.status = e.target.value; reset(); });

  async function save(li, input, value) {
    value = Math.max(0, Math.min(100000, Math.round(Number(value) || 0)));
    input.value = value;
    if (String(value) === input.dataset.orig) return;
    const state = $('[data-state]', li);
    input.disabled = true;
    const { error } = await supabase.from('product_variants').update({ stock: value }).eq('id', li.dataset.vid);
    input.disabled = false;
    if (error) { input.value = input.dataset.orig; toast(errMsg(error), 'error'); return; }
    input.dataset.orig = String(value);
    $('[data-badge]', li).innerHTML = value === 0 ? '<span class="badge-bad">Out of stock</span>' : value <= threshold ? '<span class="badge-warn">Low</span>' : '<span class="badge-ok">OK</span>';
    state.innerHTML = '<span class="material-symbols-outlined text-[18px]" aria-label="Saved">check</span>';
    setTimeout(() => { state.innerHTML = ''; }, 1800);
  }
  list.addEventListener('change', (e) => { const i = e.target.closest('input[data-orig]'); if (i) save(i.closest('li'), i, i.value); });
  list.addEventListener('keydown', (e) => { if (e.key === 'Enter' && e.target.matches('input[data-orig]')) e.target.blur(); });
  list.addEventListener('click', (e) => {
    const pg = e.target.closest('[data-page]'); if (pg && !pg.disabled) { f.page = Number(pg.dataset.page); load(); window.scrollTo({ top: 0 }); return; }
    const li = e.target.closest('li[data-vid]'); if (!li) return;
    const input = $('input[data-orig]', li);
    const step = e.target.closest('[data-step]');
    if (step) return save(li, input, Number(input.value) + Number(step.dataset.step));
    if (e.target.closest('[data-zero]')) save(li, input, 0);
  });
  await load();
}
