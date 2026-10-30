import { supabase } from '../supabase.js';
import { html, mount, $, icon, errMsg, errorState, skeletonRows, toast, withBusy, raw, esc } from '../ui.js';
import { ACCEPT, uploadImage, removeFiles, pathFromUrl } from '../images.js';

const isUrl = (v) => !v || /^https?:\/\/\S+$/i.test(v);

export async function render(ctx) {
  const { el } = ctx;
  mount(el, html`<h1 class="text-[28px] font-semibold text-primary-container">Store settings</h1><div class="mt-6">${skeletonRows(4)}</div>`);
  const [s, a] = await Promise.all([
    supabase.from('store_settings').select('*').eq('id', 1).maybeSingle(),
    supabase.from('admin_settings').select('*').eq('id', 1).maybeSingle()
  ]);
  if (s.error) throw s.error; if (a.error) throw a.error;
  if (!ctx.alive()) return;
  if (!s.data) { mount(el, errorState('Store settings row is missing. Run the schema migration (see SETUP.md).')); return; }
  const d = s.data; let logo = d.logo_url || ''; const oldLogo = logo;
  let dirty = false; ctx.setDirtyCheck(() => dirty);

  mount(el, html`
    <h1 class="text-[28px] font-semibold text-primary-container">Store settings</h1>
    <p class="text-on-surface-variant">These details appear across the public website and in WhatsApp enquiries.</p>
    <form id="st" class="mt-4 grid lg:grid-cols-3 gap-4 items-start" novalidate>
      <div class="lg:col-span-2 space-y-4">
        <section class="card card-pad space-y-4">
          <h2 class="text-[18px] font-semibold text-primary-container">Store</h2>
          <div><label class="label" for="s-name">Store name *</label><input id="s-name" class="input" maxlength="120" value="${d.store_name}"><p class="field-error hidden" data-err="name"></p></div>
          <div><span class="label">Logo</span>
            <div class="flex items-center gap-4"><div id="logo-prev" class="w-20 h-20 rounded-lg border border-[#e8dece] bg-surface-container flex items-center justify-center overflow-hidden"></div>
              <div><label class="btn-ghost cursor-pointer">${icon('upload', 'text-[18px]')} Upload logo<input id="s-logo" type="file" class="sr-only" accept="${ACCEPT}"></label>
                <button type="button" class="btn-sm btn-ghost ml-2" id="logo-rm">Remove</button><p class="hint">PNG with transparent background works best. Max 5 MB.</p></div></div>
            <p class="field-error hidden" data-err="logo"></p></div>
          <div><label class="label" for="s-wa">WhatsApp number *</label><input id="s-wa" class="input" inputmode="tel" value="${d.whatsapp_number}" placeholder="919876543210">
            <p class="hint">With country code, e.g. 91 followed by the 10-digit number. All "Enquire on WhatsApp" buttons use this number. <a id="wa-test" class="underline font-semibold" target="_blank" rel="noopener" href="#">Test link</a></p><p class="field-error hidden" data-err="wa"></p></div>
          <div><label class="label" for="s-addr">Address</label><textarea id="s-addr" class="input" rows="2" maxlength="500">${d.address}</textarea></div>
          <div><label class="label" for="s-hours">Opening hours</label><input id="s-hours" class="input" maxlength="200" value="${d.opening_hours}" placeholder="Monday – Sunday: 10:00 AM – 9:00 PM"></div>
        </section>
        <section class="card card-pad space-y-4">
          <h2 class="text-[18px] font-semibold text-primary-container">Links</h2>
          ${[['maps', 'Google Maps link', d.maps_url], ['instagram', 'Instagram', d.instagram_url], ['facebook', 'Facebook', d.facebook_url], ['youtube', 'YouTube', d.youtube_url]].map(([k, l, v]) => html`
            <div><label class="label" for="s-${k}">${l}</label><input id="s-${k}" class="input" type="url" value="${v || ''}" placeholder="https://"><p class="field-error hidden" data-err="${k}"></p></div>`)}
        </section>
        <section class="card card-pad space-y-3">
          <h2 class="text-[18px] font-semibold text-primary-container">Inventory</h2>
          <div class="max-w-xs"><label class="label" for="s-low">Low-stock warning level</label><input id="s-low" type="number" min="0" max="1000" class="input" value="${a.data ? a.data.low_stock_threshold : 5}"><p class="hint">A size/colour at or below this number is flagged as low stock.</p></div>
        </section>
      </div>
      <aside class="card card-pad flex flex-col gap-2 lg:sticky lg:top-4"><button class="btn-primary" type="submit" id="save">${icon('save', 'text-[18px]')} Save settings</button></aside>
    </form>
    <section class="card card-pad mt-4 max-w-2xl" aria-labelledby="pw-h">
      <h2 id="pw-h" class="text-[18px] font-semibold text-primary-container">Change my password</h2>
      <form id="pw" class="mt-3 grid sm:grid-cols-2 gap-3" novalidate>
        <div><label class="label" for="pw1">New password</label><input id="pw1" class="input" type="password" minlength="8" autocomplete="new-password"></div>
        <div><label class="label" for="pw2">Confirm</label><input id="pw2" class="input" type="password" autocomplete="new-password"></div>
        <p class="field-error hidden sm:col-span-2" id="pw-err" role="alert"></p>
        <div class="sm:col-span-2"><button class="btn-ghost" type="submit">Update password</button></div>
      </form></section>`);

  const err = (k, m) => { const n = $(`[data-err="${k}"]`, el); n.textContent = m || ''; n.classList.toggle('hidden', !m); };
  const prev = () => { $('#logo-prev', el).innerHTML = logo ? `<img src="${esc(logo)}" alt="Logo" class="max-w-full max-h-full object-contain">` : '<span class="material-symbols-outlined text-secondary/60 text-[32px]">storefront</span>'; };
  const waDigits = () => { let v = $('#s-wa', el).value.replace(/\D/g, ''); if (v.length === 10) v = '91' + v; return v; };
  const waLink = () => { $('#wa-test', el).href = 'https://wa.me/' + waDigits() + '?text=' + encodeURIComponent('Test message from the admin panel'); };
  prev(); waLink();
  $('#st', el).addEventListener('input', () => { dirty = true; waLink(); });
  $('#s-logo', el).addEventListener('change', async (e) => {
    const file = e.target.files[0]; e.target.value = ''; if (!file) return; err('logo', '');
    try { const r = await uploadImage(file, 'site/logo', { keepTransparency: true, maxSide: 800 }); logo = r.url; dirty = true; prev(); toast('Logo uploaded - click Save to apply.'); } catch (ex) { err('logo', errMsg(ex)); }
  });
  $('#logo-rm', el).addEventListener('click', () => { logo = ''; dirty = true; prev(); });

  $('#st', el).addEventListener('submit', async (e) => {
    e.preventDefault();
    const v = { name: $('#s-name', el).value.trim(), wa: waDigits(), low: parseInt($('#s-low', el).value, 10) };
    const links = Object.fromEntries(['maps', 'instagram', 'facebook', 'youtube'].map((k) => [k, $(`#s-${k}`, el).value.trim()]));
    let bad = false;
    err('name', v.name ? '' : 'Store name is required.'); bad ||= !v.name;
    const waOk = /^[0-9]{10,15}$/.test(v.wa); err('wa', waOk ? '' : 'Enter a valid number with country code (10–15 digits).'); bad ||= !waOk;
    for (const k of Object.keys(links)) { const ok = isUrl(links[k]); err(k, ok ? '' : 'Enter a full link starting with https://'); bad ||= !ok; }
    if (!Number.isInteger(v.low) || v.low < 0 || v.low > 1000) { toast('Low-stock level must be a number from 0 to 1000.', 'error'); bad = true; }
    if (bad) return toast('Please fix the highlighted fields.', 'error');
    await withBusy($('#save', el), async () => {
      const r1 = await supabase.from('store_settings').update({
        store_name: v.name, logo_url: logo || null, whatsapp_number: v.wa, address: $('#s-addr', el).value.trim(), opening_hours: $('#s-hours', el).value.trim(),
        maps_url: links.maps || null, instagram_url: links.instagram || null, facebook_url: links.facebook || null, youtube_url: links.youtube || null
      }).eq('id', 1);
      const r2 = await supabase.from('admin_settings').update({ low_stock_threshold: v.low }).eq('id', 1);
      if (r1.error || r2.error) return toast(errMsg(r1.error || r2.error), 'error');
      if (oldLogo && oldLogo !== logo) removeFiles([pathFromUrl(oldLogo)]);
      dirty = false; $('#s-wa', el).value = v.wa; toast('Settings saved. The website now uses them.');
    });
  });

  $('#pw', el).addEventListener('submit', async (e) => {
    e.preventDefault();
    const p1 = $('#pw1', el).value, p2 = $('#pw2', el).value, n = $('#pw-err', el);
    const bad = p1.length < 8 ? 'Password must be at least 8 characters.' : p1 !== p2 ? 'The two passwords do not match.' : '';
    n.textContent = bad; n.classList.toggle('hidden', !bad); if (bad) return;
    await withBusy($('#pw button[type=submit]', el), async () => {
      const { error } = await supabase.auth.updateUser({ password: p1 });
      if (error) { n.textContent = errMsg(error); n.classList.remove('hidden'); return; }
      $('#pw1', el).value = $('#pw2', el).value = ''; toast('Password updated.');
    });
  });
}
