import { supabase } from '../supabase.js';
import { html, mount, $, $$, icon, errMsg, errorState, skeletonRows, toast, withBusy, confirmDialog, openModal, esc, raw, toLocalInput, fromLocalInput, fmtDateTime, switchBtn, debounce, money } from '../ui.js';
import { ACCEPT, uploadImage, removeFiles, pathFromUrl } from '../images.js';

export async function render(ctx) {
  const { el } = ctx;
  mount(el, html`<h1 class="text-[28px] font-semibold text-primary-container">Homepage</h1><div class="mt-6">${skeletonRows(5)}</div>`);
  const [hp, an] = await Promise.all([
    supabase.from('homepage_content').select('*').eq('id', 1).maybeSingle(),
    supabase.from('announcements').select('*').order('sort_order').order('created_at', { ascending: false })
  ]);
  if (hp.error) throw hp.error; if (an.error) throw an.error;
  if (!ctx.alive()) return;
  if (!hp.data) { mount(el, errorState('Homepage content row is missing. Run the schema migration (see SETUP.md).')); return; }
  const h = hp.data; let announcements = an.data;
  let heroImg = h.hero_image_url || '', promoImg = h.promo_image_url || '';
  const origHero = heroImg, origPromo = promoImg;
  let dirty = false; ctx.setDirtyCheck(() => dirty);

  const field = (id, label, value, max, extra = '') => html`<div><label class="label" for="${id}">${label}</label><input id="${id}" class="input" maxlength="${max}" value="${value}" ${raw(extra)}></div>`;
  const imgPicker = (key, label, hint) => html`<div><span class="label">${label}</span>
    <div class="flex flex-wrap items-center gap-4"><div id="${key}-prev" class="w-40 h-24 rounded-lg border border-[#e8dece] bg-surface-container overflow-hidden flex items-center justify-center"></div>
      <div><label class="btn-ghost cursor-pointer">${icon('upload', 'text-[18px]')} Upload image<input type="file" class="sr-only" data-up="${key}" accept="${ACCEPT}"></label><p class="hint">${hint}</p></div></div>
    <p class="field-error hidden" data-err="${key}"></p></div>`;

  mount(el, html`
    <h1 class="text-[28px] font-semibold text-primary-container">Homepage</h1>
    <p class="text-on-surface-variant">Edit what customers see on the first page. Layout and colours stay as designed.</p>
    <div class="mt-4 space-y-4">

      <form id="hero" class="card card-pad space-y-4" novalidate aria-labelledby="hero-h">
        <h2 id="hero-h" class="text-[18px] font-semibold text-primary-container">Hero banner</h2>
        ${imgPicker('hero', 'Banner image', 'Wide landscape photo, at least 1600px wide looks best. JPG/PNG/WebP, max 5 MB.')}
        ${field('h-badge', 'Small label above the title', h.hero_badge, 80)}
        <div class="grid sm:grid-cols-2 gap-4">${field('h-title', 'Title (first line)', h.hero_title, 120)}${field('h-accent', 'Title (gold italic line)', h.hero_title_accent, 80)}</div>
        ${field('h-sub', 'Short sentence under the title (optional)', h.hero_subtitle, 240)}
        <div><button class="btn-primary" type="submit">Save hero banner</button></div>
      </form>

      <form id="promo" class="card card-pad space-y-4" novalidate aria-labelledby="promo-h">
        <div class="flex items-center justify-between gap-3"><h2 id="promo-h" class="text-[18px] font-semibold text-primary-container">Promotional banner</h2>
          <span class="flex items-center gap-2"><span class="font-semibold text-[13px]">Show on homepage</span>${switchBtn('promo_is_active', h.promo_is_active, 'Show promotional banner')}</span></div>
        ${imgPicker('promo', 'Banner photo', 'Landscape (4:3) photo.')}
        ${field('p-badge', 'Small label', h.promo_badge, 80)}
        <div class="grid sm:grid-cols-2 gap-4">${field('p-head', 'Heading', h.promo_heading, 120)}${field('p-accent', 'Heading (gold italic part)', h.promo_heading_accent, 80)}</div>
        <div><label class="label" for="p-body">Text</label><textarea id="p-body" class="input" rows="3" maxlength="500">${h.promo_body}</textarea></div>
        <div class="grid sm:grid-cols-2 gap-4">
          <div><label class="label" for="p-start">Show from (optional)</label><input id="p-start" type="datetime-local" class="input" value="${toLocalInput(h.promo_starts_at)}"></div>
          <div><label class="label" for="p-end">Hide after (optional)</label><input id="p-end" type="datetime-local" class="input" value="${toLocalInput(h.promo_ends_at)}"><p class="field-error hidden" data-err="sched"></p></div></div>
        <p class="hint">Leave the dates empty to show the banner all the time. Times are in your local time.</p>
        <div><button class="btn-primary" type="submit">Save promotional banner</button></div>
      </form>

      <section class="card card-pad" aria-labelledby="an-h">
        <div class="flex items-center justify-between gap-3"><div><h2 id="an-h" class="text-[18px] font-semibold text-primary-container">Top announcement bar</h2>
          <p class="hint !mt-0">The slim maroon strip at the top of every page. If several are live they rotate.</p></div>
          <button type="button" class="btn-gold btn-sm" id="an-add">${icon('add', 'text-[16px]')} Add</button></div>
        <ul id="an-list" class="mt-3 divide-y divide-[#efe6d6]"></ul>
      </section>

      <div class="grid lg:grid-cols-2 gap-4">
        <section class="card card-pad" id="panel-featured" aria-labelledby="ft-h"></section>
        <section class="card card-pad" id="panel-new" aria-labelledby="nw-h"></section>
      </div>
    </div>`);

  // ---- images ----
  const prev = (key, url) => { $(`#${key}-prev`, el).innerHTML = url ? `<img src="${esc(url)}" alt="" class="w-full h-full object-cover">` : '<span class="material-symbols-outlined text-secondary/60 text-[32px]">image</span>'; };
  prev('hero', heroImg); prev('promo', promoImg);
  $$('[data-up]', el).forEach((inp) => inp.addEventListener('change', async (e) => {
    const key = inp.dataset.up, file = e.target.files[0]; e.target.value = ''; if (!file) return;
    const errEl = $(`[data-err="${key}"]`, el); errEl.classList.add('hidden');
    try {
      const r = await uploadImage(file, 'site/' + key, { maxSide: 2000 });
      if (key === 'hero') heroImg = r.url; else promoImg = r.url;
      prev(key, r.url); dirty = true; toast('Image uploaded - click Save to apply.');
    } catch (ex) { errEl.textContent = errMsg(ex); errEl.classList.remove('hidden'); }
  }));
  el.addEventListener('input', (e) => { if (e.target.closest('form')) dirty = true; });
  $('[data-switch="promo_is_active"]', el).addEventListener('click', (e) => { const b = e.currentTarget; b.setAttribute('aria-checked', String(b.getAttribute('aria-checked') !== 'true')); dirty = true; });

  const val = (id) => $(id, el).value.trim();
  async function saveContent(btn, patch, cleanup) {
    await withBusy(btn, async () => {
      const { error } = await supabase.from('homepage_content').update(patch).eq('id', 1);
      if (error) return toast(errMsg(error), 'error');
      cleanup && cleanup(); dirty = false; toast('Saved. The homepage is updated.');
    });
  }
  $('#hero', el).addEventListener('submit', (e) => {
    e.preventDefault();
    if (!val('#h-title')) return toast('The hero title cannot be empty.', 'error');
    saveContent($('button[type=submit]', e.target), { hero_image_url: heroImg || null, hero_badge: val('#h-badge'), hero_title: val('#h-title'), hero_title_accent: val('#h-accent'), hero_subtitle: val('#h-sub') },
      () => { if (origHero && origHero !== heroImg) removeFiles([pathFromUrl(origHero)]); });
  });
  $('#promo', el).addEventListener('submit', (e) => {
    e.preventDefault();
    const s = fromLocalInput($('#p-start', el).value), en = fromLocalInput($('#p-end', el).value);
    const se = $('[data-err="sched"]', el); const bad = s && en && new Date(en) <= new Date(s);
    se.textContent = bad ? 'The end time must be after the start time.' : ''; se.classList.toggle('hidden', !bad); if (bad) return;
    saveContent($('button[type=submit]', e.target), {
      promo_is_active: $('[data-switch="promo_is_active"]', el).getAttribute('aria-checked') === 'true', promo_starts_at: s, promo_ends_at: en,
      promo_image_url: promoImg || null, promo_badge: val('#p-badge'), promo_heading: val('#p-head'), promo_heading_accent: val('#p-accent'), promo_body: val('#p-body')
    }, () => { if (origPromo && origPromo !== promoImg) removeFiles([pathFromUrl(origPromo)]); });
  });

  // ---- announcements ----
  function paintAnn() {
    const now = Date.now();
    $('#an-list', el).innerHTML = announcements.length ? announcements.map((a) => {
      const live = a.is_active && (!a.starts_at || Date.parse(a.starts_at) <= now) && (!a.ends_at || Date.parse(a.ends_at) > now);
      const state = !a.is_active ? '<span class="badge-muted">Off</span>' : live ? '<span class="badge-ok">Live</span>' : a.starts_at && Date.parse(a.starts_at) > now ? '<span class="badge-warn">Scheduled</span>' : '<span class="badge-muted">Expired</span>';
      return `<li class="py-3 flex flex-wrap items-center gap-3" data-id="${esc(a.id)}"><div class="min-w-0 flex-1 basis-56"><p class="font-semibold">${esc(a.message)}</p>
        <p class="text-[12px] text-on-surface-variant">${a.starts_at ? 'From ' + esc(fmtDateTime(a.starts_at)) : 'No start'} · ${a.ends_at ? 'until ' + esc(fmtDateTime(a.ends_at)) : 'no end'}${a.link_url ? ' · link: ' + esc(a.link_url) : ''}</p></div>
        ${state}<button type="button" class="btn-icon" data-a="edit" aria-label="Edit announcement"><span class="material-symbols-outlined">edit</span></button>
        <button type="button" class="btn-icon hover:!text-error" data-a="del" aria-label="Delete announcement"><span class="material-symbols-outlined">delete</span></button></li>`;
    }).join('') : '<li class="py-6 text-center text-on-surface-variant">No announcements. The default text from the website is shown.</li>';
  }
  async function reloadAnn() { const r = await supabase.from('announcements').select('*').order('sort_order').order('created_at', { ascending: false }); if (r.error) return toast(errMsg(r.error), 'error'); announcements = r.data; paintAnn(); }
  function annForm(a) {
    const m = openModal(html`<form class="p-5 sm:p-6 space-y-4" novalidate>
      <h2 class="text-[20px] font-semibold text-primary-container">${a ? 'Edit announcement' : 'New announcement'}</h2>
      <div><label class="label" for="a-msg">Message *</label><input id="a-msg" class="input" maxlength="160" value="${a ? a.message : ''}" placeholder="Diwali Collection Now Live" autofocus></div>
      <div><label class="label" for="a-link">Link (optional)</label><input id="a-link" class="input" value="${a ? a.link_url || '' : ''}" placeholder="shop.html?sort=newest"><p class="hint">A page like shop.html or a full https:// link.</p></div>
      <div class="grid sm:grid-cols-2 gap-4"><div><label class="label" for="a-s">Show from</label><input id="a-s" type="datetime-local" class="input" value="${a ? toLocalInput(a.starts_at) : ''}"></div>
        <div><label class="label" for="a-e">Hide after</label><input id="a-e" type="datetime-local" class="input" value="${a ? toLocalInput(a.ends_at) : ''}"></div></div>
      <div class="flex items-center gap-3">${switchBtn('on', a ? a.is_active : true, 'Active')}<span class="font-semibold">Active</span></div>
      <p class="field-error hidden" id="a-err" role="alert"></p>
      <div class="flex flex-col-reverse sm:flex-row sm:justify-end gap-2"><button type="button" class="btn-ghost" data-close>Cancel</button><button type="submit" class="btn-primary">Save</button></div></form>`, { title: 'Announcement' });
    const f = m.el; $('[data-close]', f).addEventListener('click', () => m.close());
    $('[data-switch]', f).addEventListener('click', (e) => e.currentTarget.setAttribute('aria-checked', String(e.currentTarget.getAttribute('aria-checked') !== 'true')));
    $('form', f).addEventListener('submit', async (e) => {
      e.preventDefault(); const err = $('#a-err', f);
      const msg = $('#a-msg', f).value.trim(), link = $('#a-link', f).value.trim(), s = fromLocalInput($('#a-s', f).value), en = fromLocalInput($('#a-e', f).value);
      const bad = !msg ? 'Please enter the message.' : link && !/^(https?:\/\/|\/|[a-z0-9_-]+\.html)/i.test(link) ? 'The link must start with https:// or be a page like shop.html.' : s && en && new Date(en) <= new Date(s) ? 'The end time must be after the start time.' : '';
      err.textContent = bad; err.classList.toggle('hidden', !bad); if (bad) return;
      const row = { message: msg, link_url: link || null, starts_at: s, ends_at: en, is_active: $('[data-switch]', f).getAttribute('aria-checked') === 'true' };
      await withBusy($('button[type=submit]', f), async () => {
        const r = a ? await supabase.from('announcements').update(row).eq('id', a.id) : await supabase.from('announcements').insert({ ...row, sort_order: announcements.length + 1 });
        if (r.error) { err.textContent = errMsg(r.error); err.classList.remove('hidden'); return; }
        m.close(); toast('Announcement saved.'); reloadAnn();
      });
    });
  }
  $('#an-add', el).addEventListener('click', () => annForm(null));
  $('#an-list', el).addEventListener('click', async (e) => {
    const li = e.target.closest('li[data-id]'), b = e.target.closest('[data-a]'); if (!li || !b) return;
    const a = announcements.find((x) => x.id === li.dataset.id);
    if (b.dataset.a === 'edit') return annForm(a);
    if (!(await confirmDialog({ title: 'Delete this announcement?', message: a.message, confirmText: 'Delete', danger: true }))) return;
    const { error } = await supabase.from('announcements').delete().eq('id', a.id);
    if (error) return toast(errMsg(error), 'error'); toast('Announcement deleted.'); reloadAnn();
  });
  paintAnn();

  // ---- featured / new-arrival product panels ----
  function flagPanel(sel, col, hid, title, blurb) {
    const box = $(sel, el); let items = [];
    box.innerHTML = `<h2 id="${hid}" class="text-[18px] font-semibold text-primary-container">${title}</h2><p class="hint !mt-0">${blurb}</p>
      <ul class="mt-3 divide-y divide-[#efe6d6]" data-cur></ul>
      <div class="mt-3"><label class="label" for="${hid}-q">Add a product</label><input id="${hid}-q" type="search" class="input" placeholder="Search by name or SKU" autocomplete="off"></div>
      <ul class="mt-2 divide-y divide-[#efe6d6]" data-res></ul>`;
    const cur = $('[data-cur]', box), res = $('[data-res]', box);
    const row = (p, btn) => `<li class="py-2 flex items-center gap-3" data-id="${esc(p.id)}"><span class="w-9 h-11 rounded bg-surface-container overflow-hidden shrink-0 flex items-center justify-center">${p.image_url ? `<img class="w-full h-full object-cover" alt="" src="${esc(p.image_url)}">` : '<span class="material-symbols-outlined text-secondary/60 text-[18px]">checkroom</span>'}</span>
      <span class="min-w-0 flex-1"><span class="block font-semibold truncate">${esc(p.name)}</span><span class="block text-[12px] text-on-surface-variant">${esc(money(p.price))}${p.is_active ? '' : ' · hidden'}</span></span>${btn}</li>`;
    async function refresh() {
      const r = await supabase.from('admin_products_list').select('id,name,price,image_url,is_active').eq(col, true).order('created_at', { ascending: false });
      if (r.error) { cur.innerHTML = `<li class="py-3 text-error">${esc(errMsg(r.error))}</li>`; return; }
      items = r.data;
      cur.innerHTML = items.length ? items.map((p) => row(p, `<button type="button" class="btn-sm btn-ghost" data-rm>Remove</button>`)).join('') : '<li class="py-4 text-on-surface-variant text-center">Nothing selected yet.</li>';
    }
    async function setFlag(id, on) { const { error } = await supabase.from('products').update({ [col]: on }).eq('id', id); if (error) return toast(errMsg(error), 'error'); await refresh(); search(); }
    async function search() {
      const term = $('input', box).value.replace(/[%,()*\\"']/g, ' ').trim(); if (!term) { res.innerHTML = ''; return; }
      const r = await supabase.from('admin_products_list').select('id,name,price,image_url,is_active').eq(col, false).or(`name.ilike.%${term}%,sku.ilike.%${term}%`).order('name').limit(6);
      res.innerHTML = r.error ? `<li class="py-2 text-error">${esc(errMsg(r.error))}</li>` : r.data.length ? r.data.map((p) => row(p, `<button type="button" class="btn-sm btn-gold" data-add>Add</button>`)).join('') : '<li class="py-2 text-on-surface-variant">No matching products.</li>';
    }
    $('input', box).addEventListener('input', debounce(search, 300));
    box.addEventListener('click', (e) => { const li = e.target.closest('li[data-id]'); if (!li) return; if (e.target.closest('[data-rm]')) setFlag(li.dataset.id, false); if (e.target.closest('[data-add]')) setFlag(li.dataset.id, true); });
    return refresh();
  }
  await Promise.all([
    flagPanel('#panel-featured', 'is_featured', 'ft-h', 'Popular Picks (featured)', 'Newest 4 featured products appear on the homepage with a "Bestseller" tag.'),
    flagPanel('#panel-new', 'is_new_arrival', 'nw-h', 'New Arrivals', 'Newest 4 products marked as new arrivals appear on the homepage.')
  ]);
}
