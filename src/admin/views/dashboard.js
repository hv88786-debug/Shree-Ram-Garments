import { supabase } from '../supabase.js';
import { html, mount, $, icon, money, fmtDate, errMsg, errorState, skeletonRows, raw } from '../ui.js';

const stat = (iconName, label, value, href, tone = '') => html`
  <a href="${href}" class="card card-pad block hover:border-secondary transition-colors group" aria-label="${label}: ${value}">
    <div class="flex items-start justify-between">
      <div><p class="label !mb-0">${label}</p><p class="mt-2 text-[34px] leading-none font-semibold ${tone}" style="font-family:'Playfair Display',serif">${value}</p></div>
      <span class="w-10 h-10 rounded-full bg-surface-container flex items-center justify-center text-secondary group-hover:bg-secondary-container">${icon(iconName)}</span>
    </div>
  </a>`;

export async function render(ctx) {
  const { el } = ctx;
  const load = async () => {
    mount(el, html`<h1 class="text-[28px] font-semibold text-primary-container">Dashboard</h1><div class="mt-6">${skeletonRows(4)}</div>`);
    const head = (q) => q.select('id', { count: 'exact', head: true });
    const [total, cats, low, out, recent, attention] = await Promise.all([
      head(supabase.from('admin_products_list')),
      head(supabase.from('categories')),
      head(supabase.from('admin_products_list')).eq('stock_status', 'low'),
      head(supabase.from('admin_products_list')).eq('stock_status', 'out'),
      supabase.from('admin_products_list').select('id,name,image_url,price,is_active,created_at,category_name').order('created_at', { ascending: false }).limit(6),
      supabase.from('admin_inventory').select('variant_id,product_id,product_name,size,color,stock,is_out').or('is_out.eq.true,is_low.eq.true').order('stock', { ascending: true }).limit(8)
    ]);
    for (const r of [total, cats, low, out, recent, attention]) if (r.error) throw r.error;
    if (!ctx.alive()) return;

    const variantLabel = (v) => [v.size, v.color].filter(Boolean).join(' / ') || 'Default';
    mount(el, html`
      <div class="flex flex-wrap items-end justify-between gap-3">
        <div><h1 class="text-[28px] font-semibold text-primary-container">Dashboard</h1>
          <p class="text-on-surface-variant">Welcome back. Here is how the store looks today.</p></div>
        <div class="flex flex-wrap gap-2">
          <a class="btn-primary" href="#/products/new">${icon('add', 'text-[18px]')} Add product</a>
          <a class="btn-ghost" href="#/inventory">${icon('inventory_2', 'text-[18px]')} Manage inventory</a>
        </div>
      </div>

      <div class="mt-6 grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        ${stat('checkroom', 'Total products', total.count ?? 0, '#/products')}
        ${stat('category', 'Categories', cats.count ?? 0, '#/categories')}
        ${stat('warning', 'Low stock', low.count ?? 0, '#/products?stock=low', (low.count || 0) > 0 ? 'text-[#7a5200]' : '')}
        ${stat('production_quantity_limits', 'Out of stock', out.count ?? 0, '#/products?stock=out', (out.count || 0) > 0 ? 'text-error' : '')}
      </div>

      <div class="mt-6 grid lg:grid-cols-5 gap-4">
        <section class="card lg:col-span-3" aria-labelledby="recent-h">
          <div class="flex items-center justify-between px-4 sm:px-6 pt-4"><h2 id="recent-h" class="text-[18px] font-semibold text-primary-container">Recently added</h2><a class="text-[13px] font-semibold text-secondary underline underline-offset-2" href="#/products">View all</a></div>
          <ul class="mt-2 divide-y divide-[#efe6d6]">
            ${recent.data.length ? recent.data.map((p) => html`
              <li><a class="flex items-center gap-3 px-4 sm:px-6 py-3 hover:bg-surface-container-low" href="#/products/${p.id}">
                <span class="w-12 h-14 rounded-md bg-surface-container overflow-hidden shrink-0 flex items-center justify-center">${p.image_url ? raw(`<img class="w-full h-full object-cover" alt="" loading="lazy" src="${encodeURI(p.image_url).replace(/"/g, '%22')}">`) : icon('checkroom', 'text-secondary/60')}</span>
                <span class="min-w-0 flex-1"><span class="block font-semibold truncate">${p.name}</span><span class="block text-[12px] text-on-surface-variant">${p.category_name} · ${fmtDate(p.created_at)}</span></span>
                <span class="text-right shrink-0"><span class="block font-semibold">${money(p.price)}</span>${p.is_active ? '' : html`<span class="badge-muted">Hidden</span>`}</span>
              </a></li>`) : html`<li class="px-6 py-8 text-center text-on-surface-variant">No products yet. <a class="underline font-semibold" href="#/products/new">Add your first product</a>.</li>`}
          </ul>
        </section>

        <section class="card lg:col-span-2" aria-labelledby="att-h">
          <div class="flex items-center justify-between px-4 sm:px-6 pt-4"><h2 id="att-h" class="text-[18px] font-semibold text-primary-container">Needs restocking</h2><a class="text-[13px] font-semibold text-secondary underline underline-offset-2" href="#/inventory">Inventory</a></div>
          <ul class="mt-2 divide-y divide-[#efe6d6]">
            ${attention.data.length ? attention.data.map((v) => html`
              <li><a class="flex items-center gap-3 px-4 sm:px-6 py-3 hover:bg-surface-container-low" href="#/inventory?q=${encodeURIComponent(v.product_name)}">
                <span class="min-w-0 flex-1"><span class="block font-semibold truncate">${v.product_name}</span><span class="block text-[12px] text-on-surface-variant">${variantLabel(v)}</span></span>
                ${v.is_out ? html`<span class="badge-bad">Out</span>` : html`<span class="badge-warn">${v.stock} left</span>`}
              </a></li>`) : html`<li class="px-6 py-8 text-center text-on-surface-variant">${icon('check_circle', 'text-[#1b6b3a]')}<br>Nothing is running low.</li>`}
          </ul>
        </section>
      </div>

      <section class="mt-6" aria-labelledby="qa-h">
        <h2 id="qa-h" class="text-[18px] font-semibold text-primary-container mb-3">Quick actions</h2>
        <div class="grid sm:grid-cols-2 lg:grid-cols-4 gap-3">
          ${[['add_circle', 'Add a product', '#/products/new'], ['inventory_2', 'Update stock', '#/inventory'], ['web', 'Edit homepage', '#/homepage'], ['storefront', 'Store settings', '#/settings']].map(([ic, t, h]) => html`
            <a class="card px-4 py-3 flex items-center gap-3 font-semibold hover:border-secondary" href="${h}">${icon(ic, 'text-secondary')} ${t}</a>`)}
        </div>
      </section>`);
  };
  try { await load(); } catch (e) {
    if (!ctx.alive()) return;
    mount(el, errorState(errMsg(e)));
    $('[data-retry]', el).addEventListener('click', () => ctx.retry());
  }
}
