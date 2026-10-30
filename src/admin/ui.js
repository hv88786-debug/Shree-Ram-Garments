// Tiny UI toolkit: safe HTML templating, toasts, dialogs, formatters.

export class Raw { constructor(s) { this.s = s; } toString() { return this.s; } }
export const raw = (s) => new Raw(s);

export function esc(v) {
  return String(v == null ? '' : v).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
}
const toStr = (v) => (v instanceof Raw ? v.s : Array.isArray(v) ? v.map(toStr).join('') : v == null || v === false ? '' : esc(v));
// html`...` escapes every interpolated value unless it is itself html`...` / raw().
export function html(strings, ...vals) {
  let out = '';
  strings.forEach((s, i) => { out += s; if (i < vals.length) out += toStr(vals[i]); });
  return new Raw(out);
}
export function mount(el, content) { el.innerHTML = content instanceof Raw ? content.s : esc(content); return el; }

export const icon = (name, cls = '') => html`<span class="material-symbols-outlined ${cls}" aria-hidden="true">${name}</span>`;
export const $ = (sel, root = document) => root.querySelector(sel);
export const $$ = (sel, root = document) => Array.from(root.querySelectorAll(sel));

export const money = (n) => (n == null || n === '' ? '' : '₹' + Number(n).toLocaleString('en-IN', { maximumFractionDigits: 2 }));
export const fmtDate = (d) => (d ? new Date(d).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }) : '');
export const fmtDateTime = (d) => (d ? new Date(d).toLocaleString('en-IN', { day: 'numeric', month: 'short', hour: 'numeric', minute: '2-digit' }) : '');
// <input type="datetime-local"> <-> ISO string
export function toLocalInput(iso) {
  if (!iso) return '';
  const d = new Date(iso); const p = (n) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}T${p(d.getHours())}:${p(d.getMinutes())}`;
}
export const fromLocalInput = (v) => (v ? new Date(v).toISOString() : null);

export function debounce(fn, ms = 300) { let t; return (...a) => { clearTimeout(t); t = setTimeout(() => fn(...a), ms); }; }
export const slugify = (s) => String(s).toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');

// Friendly text for database / network errors.
export function errMsg(e) {
  const m = String((e && (e.message || e.error_description)) || e || 'Something went wrong');
  const code = e && e.code;
  if (code === '23505' || /duplicate key/i.test(m)) {
    if (/sku/i.test(m)) return 'That SKU is already used by another product.';
    if (/slug/i.test(m)) return 'That URL name (slug) already exists. Please choose another.';
    return 'This value already exists. Please use a different one.';
  }
  if (code === '23503' || /foreign key|violates foreign/i.test(m)) return 'This item is still in use by other records, so it cannot be removed.';
  if (code === '42501' || /row-level security|not authorized|permission denied/i.test(m)) return 'You do not have permission to do that. Please sign in again with an administrator account.';
  if (code === '23514' || /violates check constraint/i.test(m)) return 'One of the values is not allowed (for example a negative price, or an original price below the selling price).';
  if (/failed to fetch|networkerror|load failed/i.test(m)) return 'Could not reach the server. Please check your internet connection and try again.';
  if (/jwt expired|invalid jwt/i.test(m)) return 'Your session expired. Please sign in again.';
  return m;
}

// ---- toasts ----
export function toast(message, type = 'ok') {
  let box = document.getElementById('toasts');
  if (!box) {
    box = document.createElement('div'); box.id = 'toasts';
    box.className = 'fixed z-[100] bottom-4 left-4 right-4 sm:left-auto sm:right-6 sm:bottom-6 flex flex-col gap-2 items-stretch sm:items-end pointer-events-none';
    box.setAttribute('role', 'status'); box.setAttribute('aria-live', 'polite');
    document.body.appendChild(box);
  }
  const el = document.createElement('div');
  const tone = type === 'error' ? 'bg-error text-white' : type === 'warn' ? 'bg-[#7a5200] text-white' : 'bg-primary text-white';
  el.className = `pointer-events-auto max-w-md rounded-lg px-4 py-3 shadow-lg font-semibold text-[13px] ${tone}`;
  el.textContent = message;
  box.appendChild(el);
  setTimeout(() => el.remove(), type === 'error' ? 7000 : 3500);
}

// ---- modal ----
export function openModal(content, { title = '', wide = false, onClose } = {}) {
  const prevFocus = document.activeElement;
  const wrap = document.createElement('div');
  wrap.className = 'fixed inset-0 z-[90] flex items-end sm:items-center justify-center p-0 sm:p-4 bg-[#261a1a]/55';
  wrap.innerHTML = `<div role="dialog" aria-modal="true" aria-label="${esc(title)}" class="bg-white w-full ${wide ? 'sm:max-w-2xl' : 'sm:max-w-lg'} max-h-[92vh] overflow-y-auto rounded-t-2xl sm:rounded-2xl shadow-2xl" tabindex="-1"></div>`;
  const dlg = wrap.firstElementChild;
  mount(dlg, content);
  document.body.appendChild(wrap);
  const close = (result) => {
    document.removeEventListener('keydown', onKey, true);
    wrap.remove();
    if (prevFocus && prevFocus.focus) prevFocus.focus();
    if (onClose) onClose(result);
  };
  function onKey(e) {
    if (e.key === 'Escape') { e.stopPropagation(); close(); return; }
    if (e.key === 'Tab') { // keep focus inside the dialog
      const f = $$('a[href],button:not([disabled]),input:not([disabled]),select,textarea,[tabindex]:not([tabindex="-1"])', dlg).filter((x) => x.offsetParent !== null);
      if (!f.length) return;
      const first = f[0], last = f[f.length - 1];
      if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
      else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
    }
  }
  document.addEventListener('keydown', onKey, true);
  wrap.addEventListener('mousedown', (e) => { if (e.target === wrap) close(); });
  const auto = $('[autofocus]', dlg) || $('input,select,textarea', dlg); (auto || dlg).focus();
  return { el: dlg, close };
}

export function confirmDialog({ title, message, confirmText = 'Confirm', danger = false, cancelText = 'Cancel' }) {
  return new Promise((resolve) => {
    let settled = false;
    const done = (v) => { if (!settled) { settled = true; resolve(v); } };
    const m = openModal(html`
      <div class="p-6">
        <h2 class="text-[20px] font-semibold text-primary-container">${title}</h2>
        <p class="mt-2 text-on-surface-variant whitespace-pre-line">${message}</p>
        <div class="mt-6 flex flex-col-reverse sm:flex-row sm:justify-end gap-2">
          <button type="button" class="btn-ghost" data-act="no" autofocus>${cancelText}</button>
          <button type="button" class="${danger ? 'btn-danger-solid' : 'btn-primary'}" data-act="yes">${confirmText}</button>
        </div>
      </div>`, { title, onClose: () => done(false) });
    m.el.addEventListener('click', (e) => {
      const b = e.target.closest('[data-act]'); if (!b) return;
      done(b.dataset.act === 'yes'); m.close();
    });
  });
}

// Disable a button + show progress while an async task runs.
export async function withBusy(btn, fn) {
  if (!btn) return fn();
  const old = btn.innerHTML; btn.disabled = true;
  btn.innerHTML = '<span class="material-symbols-outlined animate-spin text-[18px]" aria-hidden="true">progress_activity</span> Working…';
  try { return await fn(); } finally { btn.disabled = false; btn.innerHTML = old; }
}

export function emptyState(iconName, title, text, actionHtml = '') {
  return html`<div class="text-center py-12 px-4">
    ${icon(iconName, 'text-[44px] text-secondary/60')}
    <h3 class="mt-2 text-[18px] font-semibold text-primary-container">${title}</h3>
    <p class="mt-1 text-on-surface-variant max-w-md mx-auto">${text}</p>
    <div class="mt-4">${raw(actionHtml)}</div></div>`;
}
export function errorState(message) {
  return html`<div class="card card-pad text-center" role="alert">
    ${icon('error', 'text-[40px] text-error')}
    <h3 class="mt-2 text-[18px] font-semibold text-primary-container">Something went wrong</h3>
    <p class="mt-1 text-on-surface-variant">${message}</p>
    <button type="button" class="btn-primary mt-4" data-retry>Try again</button></div>`;
}
export const skeletonRows = (n = 5) => html`<div class="space-y-3" aria-busy="true" aria-label="Loading">${Array.from({ length: n }, () => html`<div class="skeleton h-16 w-full"></div>`)}</div>`;

// <button role="switch"> helper
export const switchBtn = (name, on, label) => html`<button type="button" role="switch" class="switch" data-switch="${name}" aria-checked="${on ? 'true' : 'false'}" aria-label="${label}"></button>`;
