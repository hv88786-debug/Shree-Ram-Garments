import { supabase } from '../supabase.js';
import { raw, html, mount, $, $$, icon, errMsg, errorState, skeletonRows, toast, confirmDialog, openModal, slugify, emptyState, withBusy, switchBtn } from '../ui.js';

const STANDARD = [
  ['men', "Men's Wear", ['Shirts', 'T-shirts', 'Jeans', 'Trousers', 'Casual Wear', 'Formal Wear']],
  ['women', "Women's Wear", ['Kurtis', 'Tops', 'Dresses', 'Jeans', 'Sarees', 'Suits']],
  ['kids', "Kids' Wear", ['T-shirts', 'Casual Outfits', 'Frocks', 'Festive Clothing']],
  ['ethnic', 'Ethnic Wear', ['Kurtas', 'Sherwanis', 'Sarees', 'Lehengas', 'Traditional Suits']],
  ['winter', 'Winter Wear', ['Sweaters', 'Hoodies', 'Sweatshirts', 'Jackets']]
];
const parseSubs = (t) => [...new Set(String(t).split(/[\n,]/).map((s) => s.trim()).filter(Boolean))].slice(0, 40);

export async function render(ctx) {
  const { el } = ctx;
  let rows = [];

  async function fetchRows() {
    const { data, error } = await supabase.from('categories').select('id,slug,name,subcategories,sort_order,is_active,products(count)').order('sort_order').order('name');
    if (error) throw error;
    rows = data.map((c) => ({ ...c, count: (c.products && c.products[0] && c.products[0].count) || 0 }));
  }

  function paint() {
    const missing = STANDARD.filter(([slug]) => !rows.some((r) => r.slug === slug));
    mount(el, html`
      <div class="flex flex-wrap items-end justify-between gap-3">
        <div><h1 class="text-[28px] font-semibold text-primary-container">Categories</h1>
          <p class="text-on-surface-variant">Shown on the website in this order. Hidden categories hide all their products.</p></div>
        <button type="button" class="btn-primary" id="cat-add">${icon('add', 'text-[18px]')} Add category</button>
      </div>
      ${missing.length ? html`<div class="mt-4 card card-pad flex flex-wrap items-center justify-between gap-3 bg-[#fff8e8]">
        <p class="text-[13px]"><strong>Standard categories missing:</strong> ${missing.map((m) => m[1]).join(', ')}.</p>
        <button type="button" class="btn-gold btn-sm" id="cat-std">Add them</button></div>` : ''}
      <div class="mt-4 card overflow-hidden">
        ${rows.length ? html`<ul class="divide-y divide-[#efe6d6]">${rows.map((c, i) => html`
          <li class="flex flex-wrap items-center gap-3 px-4 sm:px-5 py-3" data-id="${c.id}">
            <div class="flex flex-col">
              <button type="button" class="btn-icon !w-7 !h-6" data-act="up" ${i === 0 ? 'disabled' : ''} aria-label="Move ${c.name} up">${icon('keyboard_arrow_up')}</button>
              <button type="button" class="btn-icon !w-7 !h-6" data-act="down" ${i === rows.length - 1 ? 'disabled' : ''} aria-label="Move ${c.name} down">${icon('keyboard_arrow_down')}</button>
            </div>
            <div class="min-w-0 flex-1 basis-48">
              <p class="font-semibold text-[15px]">${c.name} ${c.is_active ? '' : html`<span class="badge-muted ml-1">Hidden</span>`}</p>
              <p class="text-[12px] text-on-surface-variant truncate">/${c.slug} · ${c.count} product${c.count === 1 ? '' : 's'}${c.subcategories.length ? ' · ' + c.subcategories.join(', ') : ''}</p>
            </div>
            <div class="flex items-center gap-1">
              ${switchBtn('active', c.is_active, `Show ${c.name} on website`)}
              <button type="button" class="btn-icon" data-act="edit" aria-label="Edit ${c.name}">${icon('edit')}</button>
              <button type="button" class="btn-icon ${c.count ? 'opacity-40' : 'hover:!text-error'}" data-act="delete" aria-label="Delete ${c.name}" ${raw(c.count ? 'aria-disabled="true"' : '')}>${icon('delete')}</button>
            </div>
          </li>`)}</ul>` : emptyState('category', 'No categories yet', 'Add your first category to start adding products.')}
      </div>`);
  }

  async function reload() { await fetchRows(); if (ctx.alive()) paint(); }

  function form(cat) {
    const isNew = !cat;
    const m = openModal(html`
      <form id="cat-form" class="p-5 sm:p-6 space-y-4" novalidate>
        <h2 class="text-[20px] font-semibold text-primary-container">${isNew ? 'Add category' : 'Edit category'}</h2>
        <div><label class="label" for="cf-name">Name *</label><input id="cf-name" class="input" maxlength="80" required value="${cat ? cat.name : ''}" autofocus></div>
        <div><label class="label" for="cf-slug">Web address name</label>
          <input id="cf-slug" class="input" maxlength="40" value="${cat ? cat.slug : ''}" ${isNew ? '' : 'readonly'} placeholder="auto from name">
          <p class="hint">${isNew ? 'Used in links such as shop.html?cat=… Letters, numbers and dashes only.' : 'Fixed after creation so existing website links keep working.'}</p></div>
        <div><label class="label" for="cf-subs">Types (one per line)</label>
          <textarea id="cf-subs" class="input" rows="5" placeholder="Shirts&#10;Jeans&#10;Trousers">${cat ? cat.subcategories.join('\n') : ''}</textarea>
          <p class="hint">These appear in the "Type" filter on the shop page.</p></div>
        <div class="flex items-center gap-3">${switchBtn('active', cat ? cat.is_active : true, 'Visible on website')}<span class="font-semibold">Visible on website</span></div>
        <p id="cf-err" class="field-error hidden" role="alert"></p>
        <div class="flex flex-col-reverse sm:flex-row sm:justify-end gap-2 pt-2">
          <button type="button" class="btn-ghost" data-close>Cancel</button><button type="submit" class="btn-primary">${isNew ? 'Add category' : 'Save changes'}</button></div>
      </form>`, { title: isNew ? 'Add category' : 'Edit category' });
    const f = m.el;
    $('[data-close]', f).addEventListener('click', () => m.close());
    $('[data-switch]', f).addEventListener('click', (e) => e.currentTarget.setAttribute('aria-checked', String(e.currentTarget.getAttribute('aria-checked') !== 'true')));
    $('#cf-name', f).addEventListener('input', () => { if (isNew && !$('#cf-slug', f).dataset.touched) $('#cf-slug', f).value = slugify($('#cf-name', f).value).slice(0, 40); });
    $('#cf-slug', f).addEventListener('input', (e) => { e.target.dataset.touched = '1'; });
    $('#cat-form', f).addEventListener('submit', async (e) => {
      e.preventDefault();
      const err = $('#cf-err', f); err.classList.add('hidden');
      const name = $('#cf-name', f).value.trim(), slug = slugify($('#cf-slug', f).value || name).slice(0, 40);
      const bad = !name ? 'Please enter a category name.' : !slug ? 'Please enter a web address name.' : '';
      if (bad) { err.textContent = bad; err.classList.remove('hidden'); return; }
      const payload = { name, subcategories: parseSubs($('#cf-subs', f).value), is_active: $('[data-switch]', f).getAttribute('aria-checked') === 'true' };
      await withBusy($('button[type=submit]', f), async () => {
        const res = isNew
          ? await supabase.from('categories').insert({ ...payload, slug, sort_order: (rows.reduce((mx, r) => Math.max(mx, r.sort_order), 0) || 0) + 1 })
          : await supabase.from('categories').update(payload).eq('id', cat.id);
        if (res.error) { err.textContent = /duplicate/i.test(res.error.message) ? 'A category with that web address name already exists.' : errMsg(res.error); err.classList.remove('hidden'); return; }
        m.close(); toast(isNew ? 'Category added.' : 'Category saved.'); await reload();
      });
    });
  }

  async function swap(i, j) {
    const a = rows[i], b = rows[j]; if (!a || !b) return;
    // Renumber the whole list so order values stay unique and gap-free.
    const order = rows.map((r) => r.id); [order[i], order[j]] = [order[j], order[i]];
    const results = await Promise.all(order.map((id, idx) => supabase.from('categories').update({ sort_order: idx + 1 }).eq('id', id)));
    const bad = results.find((r) => r.error); if (bad) throw bad.error;
  }

  el.addEventListener('click', async (e) => {
    if (e.target.closest('#cat-add')) return form(null);
    if (e.target.closest('#cat-std')) {
      const missing = STANDARD.filter(([slug]) => !rows.some((r) => r.slug === slug));
      let n = rows.reduce((mx, r) => Math.max(mx, r.sort_order), 0);
      const { error } = await supabase.from('categories').insert(missing.map(([slug, name, subs]) => ({ slug, name, subcategories: subs, sort_order: ++n })));
      if (error) return toast(errMsg(error), 'error');
      toast('Standard categories added.'); return reload();
    }
    const li = e.target.closest('li[data-id]'); if (!li) return;
    const i = rows.findIndex((r) => r.id === li.dataset.id), c = rows[i];
    try {
      if (e.target.closest('[data-act="edit"]')) return form(c);
      if (e.target.closest('[data-act="up"]')) { await swap(i, i - 1); return reload(); }
      if (e.target.closest('[data-act="down"]')) { await swap(i, i + 1); return reload(); }
      if (e.target.closest('[data-switch]')) {
        const { error } = await supabase.from('categories').update({ is_active: !c.is_active }).eq('id', c.id);
        if (error) throw error;
        toast(c.is_active ? `${c.name} is now hidden on the website.` : `${c.name} is now visible.`); return reload();
      }
      if (e.target.closest('[data-act="delete"]')) {
        if (c.count) return toast(`"${c.name}" still has ${c.count} product${c.count === 1 ? '' : 's'}. Move or delete them first - or hide the category instead.`, 'warn');
        if (!(await confirmDialog({ title: `Delete "${c.name}"?`, message: 'This category is empty and will be permanently removed.', confirmText: 'Delete category', danger: true }))) return;
        const { error } = await supabase.from('categories').delete().eq('id', c.id);
        if (error) throw error;
        toast('Category deleted.'); return reload();
      }
    } catch (ex) { toast(errMsg(ex), 'error'); }
  });

  mount(el, html`<h1 class="text-[28px] font-semibold text-primary-container">Categories</h1><div class="mt-6">${skeletonRows(4)}</div>`);
  try { await fetchRows(); } catch (e) {
    if (!ctx.alive()) return; mount(el, errorState(errMsg(e))); $('[data-retry]', el).addEventListener('click', () => ctx.retry()); return;
  }
  if (ctx.alive()) paint();
}
