import { supabase, configured, isAdmin } from './supabase.js';
import { html, mount, $, $$, icon, confirmDialog, toast, errMsg } from './ui.js';
import { notConfiguredScreen, showLogin } from './auth.js';
import * as dashboard from './views/dashboard.js';
import * as products from './views/products.js';
import * as productForm from './views/product-form.js';
import * as categories from './views/categories.js';
import * as inventory from './views/inventory.js';
import * as homepage from './views/homepage.js';
import * as settings from './views/settings.js';

const app = document.getElementById('app');

const NAV = [
  ['dashboard', 'Dashboard', 'space_dashboard'],
  ['products', 'Products', 'checkroom'],
  ['categories', 'Categories', 'category'],
  ['inventory', 'Inventory', 'inventory_2'],
  ['homepage', 'Homepage', 'web'],
  ['settings', 'Store settings', 'storefront']
];

function match(path) {
  let m;
  if (path === '/' || path === '/dashboard') return { name: 'dashboard', view: dashboard, args: [] };
  if (path === '/products') return { name: 'products', view: products, args: [] };
  if (path === '/products/new') return { name: 'products', view: productForm, args: [null] };
  if ((m = path.match(/^\/products\/([0-9a-f-]{36})$/i))) return { name: 'products', view: productForm, args: [m[1]] };
  if (path === '/categories') return { name: 'categories', view: categories, args: [] };
  if (path === '/inventory') return { name: 'inventory', view: inventory, args: [] };
  if (path === '/homepage') return { name: 'homepage', view: homepage, args: [] };
  if (path === '/settings') return { name: 'settings', view: settings, args: [] };
  return null;
}

let user = null, navToken = 0, currentHash = '', dirtyCheck = null;

function layout() {
  mount(app, html`
  <div class="min-h-screen lg:flex">
    <a href="#view" class="sr-only focus:not-sr-only focus:absolute focus:z-[100] focus:bg-white focus:p-2">Skip to content</a>
    <div id="scrim" class="fixed inset-0 bg-black/40 z-30 hidden lg:hidden"></div>
    <aside id="sidebar" class="fixed inset-y-0 left-0 z-40 w-[264px] bg-primary text-white flex flex-col -translate-x-full lg:translate-x-0 lg:sticky lg:top-0 lg:h-screen transition-transform shrink-0" aria-label="Main navigation">
      <div class="px-5 pt-6 pb-4 border-b border-white/10">
        <p class="text-[10px] tracking-[0.28em] uppercase text-secondary-fixed-dim font-bold">Admin panel</p>
        <p class="text-[20px] font-semibold leading-tight mt-1" style="font-family:'Playfair Display',serif">Shree Ram Garments</p>
      </div>
      <nav class="flex-1 overflow-y-auto p-3 space-y-1">
        ${NAV.map(([id, label, ic]) => html`<a class="nav-link" href="#/${id}" data-nav="${id}">${icon(ic)}<span>${label}</span></a>`)}
        <a class="nav-link mt-4" href="../index.html" target="_blank" rel="noopener">${icon('open_in_new')}<span>View website</span></a>
      </nav>
      <div class="p-4 border-t border-white/10 text-[12px]">
        <p class="text-[#f3dcdc] truncate" title="${user.email}">${user.email}</p>
        <button id="logout" type="button" class="mt-2 btn-ghost btn-sm w-full">${icon('logout', 'text-[18px]')} Sign out</button>
      </div>
    </aside>
    <div class="flex-1 min-w-0 flex flex-col">
      <header class="lg:hidden sticky top-0 z-20 bg-primary text-white flex items-center gap-2 px-2 h-14 shadow">
        <button id="menu" type="button" class="btn-icon text-white hover:bg-white/10 hover:text-white" aria-label="Open menu" aria-expanded="false">${icon('menu')}</button>
        <span class="font-semibold" style="font-family:'Playfair Display',serif">Shree Ram Garments</span>
      </header>
      <main id="view" class="w-full max-w-[1200px] mx-auto p-4 sm:p-6 lg:p-8" tabindex="-1"></main>
    </div>
  </div>`);

  const sidebar = $('#sidebar'), scrim = $('#scrim'), menu = $('#menu');
  const setDrawer = (open) => {
    sidebar.classList.toggle('-translate-x-full', !open); scrim.classList.toggle('hidden', !open);
    menu.setAttribute('aria-expanded', String(open)); menu.setAttribute('aria-label', open ? 'Close menu' : 'Open menu');
  };
  menu.addEventListener('click', () => setDrawer(sidebar.classList.contains('-translate-x-full')));
  scrim.addEventListener('click', () => setDrawer(false));
  sidebar.addEventListener('click', (e) => { if (e.target.closest('a[data-nav]')) setDrawer(false); });
  $('#logout').addEventListener('click', async () => {
    if (dirtyCheck && dirtyCheck() && !(await confirmDialog({ title: 'Discard unsaved changes?', message: 'You have unsaved changes that will be lost.', confirmText: 'Sign out anyway', danger: true }))) return;
    dirtyCheck = null;
    await supabase.auth.signOut();
  });
}

async function route() {
  const raw = location.hash.replace(/^#/, '') || '/dashboard';
  // Unsaved-changes guard (product form).
  if (dirtyCheck && dirtyCheck() && raw !== currentHash) {
    const leave = await confirmDialog({ title: 'Leave without saving?', message: 'You have unsaved changes on this page. If you leave now they will be lost.', confirmText: 'Leave page', cancelText: 'Stay here', danger: true });
    if (!leave) { location.hash = currentHash; return; }   // the resulting hashchange is ignored (same hash)
  }
  dirtyCheck = null;
  const [path, qs = ''] = raw.split('?');
  const found = match(path);
  currentHash = raw;
  const token = ++navToken;
  // A fresh <main> per navigation: listeners attached by the previous view disappear with the old node.
  const old = $('#view'), el = old.cloneNode(false);
  old.replaceWith(el);
  $$('[data-nav]').forEach((a) => (a.dataset.nav === (found && found.name) ? a.setAttribute('aria-current', 'page') : a.removeAttribute('aria-current')));
  if (!found) {
    mount(el, html`<div class="card card-pad text-center"><h1 class="text-[22px] font-semibold text-primary-container">Page not found</h1><p class="mt-2 text-on-surface-variant">That admin page does not exist.</p><a class="btn-primary mt-4" href="#/dashboard">Go to dashboard</a></div>`);
    return;
  }
  const ctx = {
    el, user, params: new URLSearchParams(qs), args: found.args,
    alive: () => token === navToken,
    setDirtyCheck: (fn) => { dirtyCheck = fn; },
    go: (hash) => { location.hash = hash; },
    retry: () => route()
  };
  window.scrollTo(0, 0);
  try { await found.view.render(ctx); } catch (e) {
    if (!ctx.alive()) return;
    console.error(e);
    mount(el, html`<div class="card card-pad text-center" role="alert"><h1 class="text-[20px] font-semibold text-primary-container">This page could not load</h1><p class="mt-2 text-on-surface-variant">${errMsg(e)}</p><button class="btn-primary mt-4" type="button" id="reload-view">Try again</button></div>`);
    const b = $('#reload-view'); if (b) b.addEventListener('click', () => route());
  }
}

const onHash = () => { if (location.hash.replace(/^#/, '') !== currentHash) route(); };
let started = false;
function startApp(u) {
  user = u;
  if (started) return;
  started = true;
  layout();
  window.addEventListener('hashchange', onHash);
  window.addEventListener('beforeunload', (e) => { if (dirtyCheck && dirtyCheck()) { e.preventDefault(); e.returnValue = ''; } });
  route();
}
function stopApp(notice) {
  started = false; user = null; dirtyCheck = null;
  window.removeEventListener('hashchange', onHash); currentHash = '';
  showLogin(app, notice);
}

async function boot() {
  if (!configured) return notConfiguredScreen(app);
  supabase.auth.onAuthStateChange((event, session) => {
    // Never await Supabase calls directly inside this callback; defer them.
    setTimeout(async () => {
      if (event === 'SIGNED_OUT') { if (started) stopApp('You have been signed out.'); }
      else if (event === 'SIGNED_IN' && session && !started) {
        try { if (await isAdmin(session.user.id)) startApp(session.user); } catch (e) { toast(errMsg(e), 'error'); }
      }
    }, 0);
  });
  try {
    const { data } = await supabase.auth.getSession();
    if (data.session && (await isAdmin(data.session.user.id))) return startApp(data.session.user);
    if (data.session) await supabase.auth.signOut();
  } catch (e) { console.error(e); }
  showLogin(app);
}
boot();
