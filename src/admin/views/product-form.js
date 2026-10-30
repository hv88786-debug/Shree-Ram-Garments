import { supabase } from '../supabase.js';
import { html, mount, $, $$, icon, money, errMsg, errorState, skeletonRows, toast, confirmDialog, raw, esc, withBusy, switchBtn } from '../ui.js';
import { ACCEPT, uploadImage, removeFiles, removeUnusedProductFiles } from '../images.js';

const K = (s, c) => `${s}\u0001${c}`;
const SIZE_PRESETS = ['S', 'M', 'L', 'XL', 'XXL', 'Free Size'];
const MAX_IMAGES = 10;

export async function render(ctx) {
  const { el } = ctx;
  const id = ctx.args[0], fromId = ctx.params.get('from');
  mount(el, html`<h1 class="text-[28px] font-semibold text-primary-container">${id ? 'Edit product' : 'Add product'}</h1><div class="mt-6">${skeletonRows(5)}</div>`);

  const [catRes, setRes] = await Promise.all([
    supabase.from('categories').select('id,name,subcategories').order('sort_order'),
    supabase.from('admin_settings').select('low_stock_threshold').eq('id', 1).maybeSingle()
  ]);
  if (catRes.error) throw catRes.error;
  const cats = catRes.data, threshold = (setRes.data && setRes.data.low_stock_threshold) ?? 5;
  if (!cats.length) {
    mount(el, html`<div class="card card-pad text-center"><h1 class="text-[22px] font-semibold text-primary-container">Create a category first</h1><p class="mt-2 text-on-surface-variant">Every product belongs to a category.</p><a class="btn-primary mt-4" href="#/categories">Go to categories</a></div>`); return;
  }

  // ---- state ----
  const S = { id: null, name: '', sku: '', description: '', category_id: cats[0].id, subcategory: '', price: '', original_price: '', is_featured: false, is_new_arrival: false, is_active: true, images: [], sizes: [], colors: [], stock: {}, single: false };
  let initialPaths = [];
  const srcId = id || fromId;
  if (srcId) {
    const [p, v, im] = await Promise.all([
      supabase.from('products').select('*').eq('id', srcId).maybeSingle(),
      supabase.from('product_variants').select('size,color,color_hex,stock,sort_order').eq('product_id', srcId).order('sort_order'),
      supabase.from('product_images').select('url,storage_path,sort_order').eq('product_id', srcId).order('sort_order')
    ]);
    for (const r of [p, v, im]) if (r.error) throw r.error;
    if (!p.data) { mount(el, html`<div class="card card-pad text-center"><h1 class="text-[22px] font-semibold text-primary-container">Product not found</h1><a class="btn-primary mt-4" href="#/products">Back to products</a></div>`); return; }
    const d = p.data, copy = !id;
    Object.assign(S, { id: copy ? null : d.id, name: copy ? d.name + ' (Copy)' : d.name, sku: copy ? '' : d.sku || '', description: d.description, category_id: d.category_id, subcategory: d.subcategory, price: d.price, original_price: d.original_price ?? '', is_featured: d.is_featured, is_new_arrival: d.is_new_arrival, is_active: copy ? false : d.is_active });
    S.images = im.data.map((i) => ({ url: i.url, storage_path: i.storage_path }));
    if (!copy) initialPaths = S.images.map((i) => i.storage_path).filter(Boolean);
    const hasSize = v.data.some((x) => x.size), hasColor = v.data.some((x) => x.color);
    S.sizes = [...new Set(v.data.map((x) => x.size).filter(Boolean))];
    const seen = new Map(); v.data.forEach((x) => { if (x.color && !seen.has(x.color)) seen.set(x.color, x.color_hex || ''); });
    S.colors = [...seen].map(([name, hex]) => ({ name, hex }));
    S.single = !hasSize && !hasColor && v.data.length > 0;
    v.data.forEach((x) => { S.stock[K(x.size, x.color)] = copy ? 0 : x.stock; });
  }
  if (!ctx.alive()) return;

  let dirty = false; const touch = () => { dirty = true; };
  ctx.setDirtyCheck(() => dirty);

  const catOpts = cats.map((c) => html`<option value="${c.id}" ${c.id === S.category_id ? 'selected' : ''}>${c.name}</option>`);
  mount(el, html`
    <div class="flex flex-wrap items-center gap-3">
      <a class="btn-icon" href="#/products" aria-label="Back to products">${icon('arrow_back')}</a>
      <h1 class="text-[28px] font-semibold text-primary-container">${id ? 'Edit product' : fromId ? 'Duplicate product' : 'Add product'}</h1>
    </div>
    ${fromId ? html`<p class="mt-2 text-[13px] rounded-lg bg-[#fff1d0] text-[#7a5200] px-3 py-2">This is a copy. It starts hidden with stock set to 0 and no SKU - review it, then save.</p>` : ''}
    <form id="pf" class="mt-4 grid lg:grid-cols-3 gap-4 items-start" novalidate>
      <div class="lg:col-span-2 space-y-4">
        <section class="card card-pad space-y-4" aria-labelledby="s-basic">
          <h2 id="s-basic" class="text-[18px] font-semibold text-primary-container">Basic details</h2>
          <div><label class="label" for="f-name">Product name *</label><input id="f-name" class="input" maxlength="160" value="${S.name}" autocomplete="off"><p class="field-error hidden" data-err="name"></p></div>
          <div class="grid sm:grid-cols-2 gap-4">
            <div><label class="label" for="f-sku">SKU</label><input id="f-sku" class="input" maxlength="60" value="${S.sku}" placeholder="e.g. KRT-001" autocomplete="off"><p class="field-error hidden" data-err="sku"></p></div>
            <div><label class="label" for="f-cat">Category *</label><select id="f-cat" class="input">${catOpts}</select></div>
          </div>
          <div><label class="label" for="f-sub">Type (optional)</label><input id="f-sub" class="input" list="sub-list" maxlength="80" value="${S.subcategory}" placeholder="e.g. Kurtis"><datalist id="sub-list"></datalist><p class="hint">Pick a suggestion or type your own. Used by the "Type" filter on the shop page.</p></div>
          <div><label class="label" for="f-desc">Description</label><textarea id="f-desc" class="input" rows="5" maxlength="4000">${S.description}</textarea><p class="hint"><span id="desc-count">0</span>/4000</p></div>
        </section>

        <section class="card card-pad space-y-4" aria-labelledby="s-price">
          <h2 id="s-price" class="text-[18px] font-semibold text-primary-container">Pricing</h2>
          <div class="grid sm:grid-cols-2 gap-4">
            <div><label class="label" for="f-price">Selling price (₹) *</label><input id="f-price" class="input" inputmode="decimal" value="${S.price}" placeholder="999"><p class="field-error hidden" data-err="price"></p></div>
            <div><label class="label" for="f-orig">Original price (₹)</label><input id="f-orig" class="input" inputmode="decimal" value="${S.original_price}" placeholder="optional - shown struck through"><p class="field-error hidden" data-err="original_price"></p></div>
          </div>
          <p class="hint" id="disc"></p>
        </section>

        <section class="card card-pad space-y-3" aria-labelledby="s-img">
          <div class="flex items-center justify-between"><h2 id="s-img" class="text-[18px] font-semibold text-primary-container">Photos</h2><span class="hint !mt-0"><span id="img-count">0</span>/${MAX_IMAGES}</span></div>
          <label id="drop" class="block border-2 border-dashed border-[#d9cbb3] rounded-xl p-6 text-center cursor-pointer hover:bg-surface-container-low focus-within:border-primary-container">
            ${icon('add_photo_alternate', 'text-[36px] text-secondary')}
            <span class="block font-semibold mt-1">Tap to add photos or drop them here</span>
            <span class="block hint">JPG, PNG or WebP · up to 5 MB each · the first photo is the cover</span>
            <input id="f-files" type="file" class="sr-only" accept="${ACCEPT}" multiple>
          </label>
          <p class="field-error hidden" data-err="images"></p>
          <ul id="imgs" class="grid grid-cols-3 sm:grid-cols-4 gap-3"></ul>
        </section>

        <section class="card card-pad space-y-4" aria-labelledby="s-var">
          <div><h2 id="s-var" class="text-[18px] font-semibold text-primary-container">Sizes, colours & stock</h2>
            <p class="hint">Add sizes and/or colours, then enter how many pieces you have of each combination. Leave both empty if you do not track stock.</p></div>
          <div><label class="label" for="f-size">Sizes</label>
            <div class="flex gap-2"><input id="f-size" class="input" maxlength="40" placeholder="Type a size, press Enter" enterkeyhint="done"><button type="button" class="btn-ghost" id="add-size">Add</button></div>
            <div class="mt-2 flex flex-wrap gap-1.5" id="size-presets">${SIZE_PRESETS.map((s) => html`<button type="button" class="btn-sm btn-ghost" data-preset="${s}">+ ${s}</button>`)}</div>
            <div class="mt-2 flex flex-wrap gap-1.5" id="size-chips"></div></div>
          <div><label class="label" for="f-color">Colours</label>
            <div class="flex gap-2"><input id="f-color" class="input" maxlength="40" placeholder="Type a colour, press Enter" enterkeyhint="done">
              <input id="f-hex" type="color" value="#cccccc" class="h-10 w-12 p-1 rounded-lg border border-[#d9cbb3] bg-white" aria-label="Colour swatch (optional)" title="Swatch colour (optional)">
              <button type="button" class="btn-ghost" id="add-color">Add</button></div>
            <div class="mt-2 flex flex-wrap gap-1.5" id="color-chips"></div></div>
          <p class="field-error hidden" data-err="variants"></p>
          <div id="matrix"></div>
        </section>
      </div>

      <aside class="space-y-4 lg:sticky lg:top-4">
        <section class="card card-pad space-y-4" aria-labelledby="s-vis">
          <h2 id="s-vis" class="text-[18px] font-semibold text-primary-container">Visibility</h2>
          ${[['is_active', 'Visible on website', 'Hidden products are not shown to customers.'], ['is_featured', 'Featured (Popular Picks)', 'Shown on the homepage with a "Bestseller" tag.'], ['is_new_arrival', 'New arrival', 'Shown in New Arrivals on the homepage.']].map(([k, t, d]) => html`
            <div class="flex items-start gap-3">${switchBtn(k, S[k], t)}<div><p class="font-semibold">${t}</p><p class="hint !mt-0">${d}</p></div></div>`)}
        </section>
        <section class="card card-pad flex flex-col gap-2">
          <button type="submit" class="btn-primary" id="save">${icon('save', 'text-[18px]')} ${id ? 'Save changes' : 'Save product'}</button>
          <a class="btn-ghost" href="#/products" id="cancel">Cancel</a>
          ${id ? html`<a class="btn-ghost" href="#/products/new?from=${id}">${icon('content_copy', 'text-[18px]')} Duplicate</a>
            <button type="button" class="btn-danger" id="del">${icon('delete', 'text-[18px]')} Delete product</button>` : ''}
        </section>
      </aside>
    </form>`);

  // ---- simple field bindings ----
  const bind = (sel, key) => $(sel, el).addEventListener('input', (e) => { S[key] = e.target.value; touch(); });
  bind('#f-name', 'name'); bind('#f-sku', 'sku'); bind('#f-sub', 'subcategory'); bind('#f-desc', 'description'); bind('#f-price', 'price'); bind('#f-orig', 'original_price');
  $('#f-cat', el).addEventListener('change', (e) => { S.category_id = e.target.value; touch(); paintSubs(); });
  $$('[data-switch]', el).forEach((b) => b.addEventListener('click', () => { S[b.dataset.switch] = b.getAttribute('aria-checked') !== 'true'; b.setAttribute('aria-checked', String(S[b.dataset.switch])); touch(); }));
  function paintSubs() { const c = cats.find((x) => x.id === S.category_id); $('#sub-list', el).innerHTML = (c ? c.subcategories : []).map((s) => `<option value="${esc(s)}">`).join(''); }
  function paintMeta() {
    $('#desc-count', el).textContent = S.description.length;
    const p = parseFloat(S.price), o = parseFloat(S.original_price);
    $('#disc', el).textContent = p >= 0 && o > p ? `Customers see ${Math.round((1 - p / o) * 100)}% off (${money(o)} → ${money(p)}).` : '';
    $('#img-count', el).textContent = S.images.length;
  }
  ['#f-desc', '#f-price', '#f-orig'].forEach((s) => $(s, el).addEventListener('input', paintMeta));
  paintSubs(); paintMeta();

  // ---- images ----
  function paintImages() {
    $('#imgs', el).innerHTML = S.images.map((im, i) => `
      <li class="relative group rounded-lg overflow-hidden border border-[#e8dece] bg-surface-container aspect-[3/4]" data-i="${i}">
        <img src="${esc(im.url)}" alt="Photo ${i + 1}" class="w-full h-full object-cover" loading="lazy">
        ${i === 0 ? '<span class="absolute top-1 left-1 badge-gold">Cover</span>' : ''}
        <div class="absolute inset-x-0 bottom-0 flex justify-between bg-gradient-to-t from-black/70 to-transparent p-1">
          <span class="flex">
            <button type="button" class="btn-icon !w-8 !h-8 !text-white" data-img="left" aria-label="Move photo ${i + 1} earlier" ${i === 0 ? 'disabled' : ''}><span class="material-symbols-outlined text-[20px]">chevron_left</span></button>
            <button type="button" class="btn-icon !w-8 !h-8 !text-white" data-img="right" aria-label="Move photo ${i + 1} later" ${i === S.images.length - 1 ? 'disabled' : ''}><span class="material-symbols-outlined text-[20px]">chevron_right</span></button></span>
          <button type="button" class="btn-icon !w-8 !h-8 !text-white" data-img="remove" aria-label="Remove photo ${i + 1}"><span class="material-symbols-outlined text-[20px]">close</span></button>
        </div></li>`).join('') + (pending ? Array.from({ length: pending }, () => '<li class="skeleton aspect-[3/4] rounded-lg" aria-label="Uploading"></li>').join('') : '');
    paintMeta();
  }
  let pending = 0;
  const imgErr = (m) => { const e = $('[data-err="images"]', el); e.textContent = m; e.classList.toggle('hidden', !m); };
  async function addFiles(files) {
    imgErr('');
    const list = [...files]; const room = MAX_IMAGES - S.images.length - pending;
    if (list.length > room) imgErr(`You can add ${Math.max(room, 0)} more photo${room === 1 ? '' : 's'} (maximum ${MAX_IMAGES}).`);
    const batch = list.slice(0, Math.max(room, 0));
    pending += batch.length; paintImages();
    for (const f of batch) {
      try {
        const { url, path } = await uploadImage(f, 'products/' + (S.id || (S._tmp ||= crypto.randomUUID())));
        S.images.push({ url, storage_path: path, fresh: true }); touch();
      } catch (e) { imgErr(errMsg(e)); }
      pending--; paintImages();
    }
  }
  $('#f-files', el).addEventListener('change', (e) => { addFiles(e.target.files); e.target.value = ''; });
  const drop = $('#drop', el);
  ['dragover', 'dragenter'].forEach((t) => drop.addEventListener(t, (e) => { e.preventDefault(); drop.classList.add('bg-surface-container-low'); }));
  ['dragleave', 'drop'].forEach((t) => drop.addEventListener(t, () => drop.classList.remove('bg-surface-container-low')));
  drop.addEventListener('drop', (e) => { e.preventDefault(); addFiles(e.dataTransfer.files); });
  $('#imgs', el).addEventListener('click', async (e) => {
    const b = e.target.closest('[data-img]'); if (!b) return;
    const i = Number(b.closest('li').dataset.i), act = b.dataset.img;
    if (act === 'remove') {
      const [im] = S.images.splice(i, 1);
      if (im.fresh) removeFiles([im.storage_path]);   // never saved anywhere: delete the uploaded file right away
    } else { const j = act === 'left' ? i - 1 : i + 1; [S.images[i], S.images[j]] = [S.images[j], S.images[i]]; }
    touch(); paintImages();
  });
  paintImages();

  // ---- sizes / colours / stock matrix ----
  function paintChips() {
    $('#size-chips', el).innerHTML = S.sizes.map((s, i) => `<span class="chip">${esc(s)}<button type="button" class="btn-icon !w-7 !h-7" data-rm-size="${i}" aria-label="Remove size ${esc(s)}"><span class="material-symbols-outlined text-[18px]">close</span></button></span>`).join('');
    $('#color-chips', el).innerHTML = S.colors.map((c, i) => `<span class="chip">${c.hex ? `<span class="w-3.5 h-3.5 rounded-full border border-[#d9cbb3]" style="background:${esc(c.hex)}"></span>` : ''}${esc(c.name)}<button type="button" class="btn-icon !w-7 !h-7" data-rm-color="${i}" aria-label="Remove colour ${esc(c.name)}"><span class="material-symbols-outlined text-[18px]">close</span></button></span>`).join('');
    $$('[data-preset]', el).forEach((b) => { b.hidden = S.sizes.includes(b.dataset.preset); });
  }
  function combos() {
    const out = [];
    if (S.sizes.length && S.colors.length) S.sizes.forEach((s) => S.colors.forEach((c) => out.push([s, c.name, c.hex])));
    else if (S.sizes.length) S.sizes.forEach((s) => out.push([s, '', '']));
    else if (S.colors.length) S.colors.forEach((c) => out.push(['', c.name, c.hex]));
    else if (S.single) out.push(['', '', '']);
    return out;
  }
  const cellCls = (n) => (n === 0 ? 'border-error bg-error-container/40' : n <= threshold ? 'border-[#e0a100] bg-[#fff8e8]' : '');
  function paintMatrix() {
    const rows = combos(), box = $('#matrix', el);
    if (!rows.length) {
      box.innerHTML = `<label class="flex items-center gap-2 font-semibold"><input type="checkbox" id="single" ${S.single ? 'checked' : ''} class="w-4 h-4 accent-[#700f1c]"> Track a single stock count for this product (no sizes or colours)</label>`;
      return;
    }
    const total = rows.reduce((t, [s, c]) => t + (S.stock[K(s, c)] || 0), 0);
    box.innerHTML = `<div class="flex flex-wrap items-center justify-between gap-2 mb-2">
        <p class="font-semibold">${rows.length} combination${rows.length === 1 ? '' : 's'} · <span id="total">${total}</span> pieces in total</p>
        <span class="flex items-center gap-2"><label class="label !mb-0" for="fill">Set all to</label><input id="fill" type="number" min="0" max="100000" class="input !w-20 !min-h-[32px]" placeholder="0"><button type="button" class="btn-sm btn-ghost" id="fill-go">Apply</button></span></div>
      <div class="overflow-x-auto rounded-lg border border-[#efe6d6]"><table class="w-full min-w-[320px]"><thead><tr><th class="th">Size</th><th class="th">Colour</th><th class="th w-32">Stock</th></tr></thead><tbody>
      ${rows.map(([s, c, h]) => { const n = S.stock[K(s, c)] || 0; return `<tr><td class="td">${esc(s) || '<span class="text-on-surface-variant">—</span>'}</td><td class="td">${c ? `${h ? `<span class="inline-block w-3 h-3 rounded-full border border-[#d9cbb3] mr-1.5" style="background:${esc(h)}"></span>` : ''}${esc(c)}` : '<span class="text-on-surface-variant">—</span>'}</td>
        <td class="td"><input type="number" min="0" max="100000" step="1" inputmode="numeric" class="input !min-h-[36px] ${cellCls(n)}" data-k="${esc(K(s, c))}" value="${n}" aria-label="Stock for ${esc([s, c].filter(Boolean).join(' / ') || 'product')}"></td></tr>`; }).join('')}
      </tbody></table></div>
      <p class="hint">Amber = at or below ${threshold} (low stock), red = 0 (out of stock).</p>
      ${!S.sizes.length && !S.colors.length ? '<label class="mt-2 flex items-center gap-2 font-semibold"><input type="checkbox" id="single" checked class="w-4 h-4 accent-[#700f1c]"> Track a single stock count</label>' : ''}`;
  }
  const addSize = (v) => { v = v.trim(); if (v && !S.sizes.some((s) => s.toLowerCase() === v.toLowerCase())) { S.sizes.push(v); touch(); } paintChips(); paintMatrix(); };
  const addColor = () => {
    const n = $('#f-color', el).value.trim(); if (!n) return;
    if (!S.colors.some((c) => c.name.toLowerCase() === n.toLowerCase())) { const hx = $('#f-hex', el); S.colors.push({ name: n, hex: hx.dataset.used ? hx.value : '' }); touch(); }
    $('#f-color', el).value = ''; delete $('#f-hex', el).dataset.used; paintChips(); paintMatrix();
  };
  $('#f-hex', el).addEventListener('input', (e) => { e.target.dataset.used = '1'; });
  $('#add-size', el).addEventListener('click', () => { addSize($('#f-size', el).value); $('#f-size', el).value = ''; $('#f-size', el).focus(); });
  $('#f-size', el).addEventListener('keydown', (e) => { if (e.key === 'Enter' || e.key === ',') { e.preventDefault(); addSize(e.target.value.replace(/,/g, '')); e.target.value = ''; } });
  $('#add-color', el).addEventListener('click', addColor);
  $('#f-color', el).addEventListener('keydown', (e) => { if (e.key === 'Enter') { e.preventDefault(); addColor(); } });
  $('#size-presets', el).addEventListener('click', (e) => { const b = e.target.closest('[data-preset]'); if (b) addSize(b.dataset.preset); });
  el.addEventListener('click', (e) => {
    const rs = e.target.closest('[data-rm-size]'), rc = e.target.closest('[data-rm-color]');
    if (rs) { S.sizes.splice(Number(rs.dataset.rmSize), 1); touch(); paintChips(); paintMatrix(); }
    if (rc) { S.colors.splice(Number(rc.dataset.rmColor), 1); touch(); paintChips(); paintMatrix(); }
    if (e.target.id === 'fill-go') {
      const n = Math.max(0, Math.min(100000, parseInt($('#fill', el).value, 10) || 0));
      combos().forEach(([s, c]) => { S.stock[K(s, c)] = n; }); touch(); paintMatrix();
    }
  });
  $('#matrix', el).addEventListener('input', (e) => {
    const t = e.target; if (!t.dataset.k) return;
    const n = Math.max(0, Math.min(100000, parseInt(t.value, 10) || 0));
    S.stock[t.dataset.k] = n; touch();
    t.className = t.className.replace(/border-error bg-error-container\/40|border-\[#e0a100\] bg-\[#fff8e8\]/g, '').trim() + ' ' + cellCls(n);
    $('#total', el).textContent = combos().reduce((s, [a, b]) => s + (S.stock[K(a, b)] || 0), 0);
  });
  $('#matrix', el).addEventListener('change', (e) => { if (e.target.id === 'single') { S.single = e.target.checked; touch(); paintMatrix(); } });
  paintChips(); paintMatrix();

  // ---- validation + save ----
  const setErr = (k, m) => { const n = $(`[data-err="${k}"]`, el); if (n) { n.textContent = m || ''; n.classList.toggle('hidden', !m); } };
  function validate() {
    const errs = {};
    if (!S.name.trim()) errs.name = 'Please enter the product name.';
    else if (S.name.trim().length > 160) errs.name = 'Name is too long (max 160 characters).';
    if (S.sku.trim().length > 60) errs.sku = 'SKU is too long (max 60 characters).';
    const p = Number(S.price);
    if (String(S.price).trim() === '' || !Number.isFinite(p)) errs.price = 'Please enter the selling price.';
    else if (p < 0) errs.price = 'Price cannot be negative.';
    else if (p > 99999999) errs.price = 'Price is too large.';
    if (String(S.original_price).trim() !== '') {
      const o = Number(S.original_price);
      if (!Number.isFinite(o) || o < 0) errs.original_price = 'Enter a valid original price, or leave it empty.';
      else if (Number.isFinite(p) && o < p) errs.original_price = 'Original price must be equal to or higher than the selling price.';
    }
    if (combos().length > 300) errs.variants = 'Too many size/colour combinations (maximum 300).';
    if (pending) errs.images = 'Please wait for photos to finish uploading.';
    ['name', 'sku', 'price', 'original_price', 'variants', 'images'].forEach((k) => setErr(k, errs[k]));
    $$('[aria-invalid]', el).forEach((n) => n.removeAttribute('aria-invalid'));
    const field = { name: '#f-name', sku: '#f-sku', price: '#f-price', original_price: '#f-orig' };
    Object.keys(errs).forEach((k) => field[k] && $(field[k], el).setAttribute('aria-invalid', 'true'));
    const first = Object.keys(errs)[0];
    if (first) { const t = field[first] ? $(field[first], el) : $(`[data-err="${first}"]`, el); t.scrollIntoView({ block: 'center', behavior: 'smooth' }); if (field[first]) t.focus({ preventScroll: true }); }
    return !first;
  }

  $('#pf', el).addEventListener('submit', async (e) => {
    e.preventDefault();
    if (!validate()) return toast('Please fix the highlighted fields.', 'error');
    const payload = {
      id: S.id, name: S.name.trim(), sku: S.sku.trim(), description: S.description, category_id: S.category_id, subcategory: S.subcategory.trim(),
      price: Number(S.price), original_price: String(S.original_price).trim() === '' ? null : Number(S.original_price),
      is_featured: S.is_featured, is_new_arrival: S.is_new_arrival, is_active: S.is_active,
      variants: combos().map(([s, c, h]) => ({ size: s, color: c, color_hex: h || '', stock: S.stock[K(s, c)] || 0 })),
      images: S.images.map((i) => ({ url: i.url, storage_path: i.storage_path || '' }))
    };
    await withBusy($('#save', el), async () => {
      const { error } = await supabase.rpc('admin_save_product', { payload });
      if (error) { toast(errMsg(error), 'error'); if (/sku/i.test(error.message)) setErr('sku', 'That SKU is already used by another product.'); return; }
      const kept = new Set(S.images.map((i) => i.storage_path));
      await removeUnusedProductFiles(initialPaths.filter((p) => !kept.has(p)));
      dirty = false;
      toast(id ? 'Product saved.' : 'Product added.');
      ctx.go('/products');
    });
  });
  const del = $('#del', el);
  if (del) del.addEventListener('click', async () => {
    if (!(await confirmDialog({ title: `Delete "${S.name}"?`, message: 'This permanently removes the product, its photos and all its stock records. This cannot be undone.\n\nTip: you can switch it to Hidden instead.', confirmText: 'Delete permanently', danger: true }))) return;
    const { error } = await supabase.from('products').delete().eq('id', S.id);
    if (error) return toast(errMsg(error), 'error');
    await removeUnusedProductFiles(initialPaths); dirty = false; toast('Product deleted.'); ctx.go('/products');
  });
}
