# Shree Ram Garments website

Static site + admin panel (Tailwind compiled at build time, Supabase backend).

**Admin panel + Supabase backend: see [SETUP.md](SETUP.md)** (step-by-step for Windows PowerShell).

- `index.html` - homepage (hero, banners and product sections are filled from Supabase)
- `shop.html` - All Products (category, type, search, price range, sort)
- `product.html?id=PRODUCT_SLUG` - product details with size/colour pickers
- `assets/products.js` - data layer: reads the shared database; shows demo data only when Supabase is not configured
- `assets/demo-data.js` - demo catalogue (fallback + source for `supabase/seed.sql`)
- `assets/shop.js`, `assets/product.js`, `assets/home.js` - page logic
- `admin/`, `src/admin/` - the admin panel; `supabase/` - SQL migrations

Products are no longer edited in a JavaScript file - use `/admin/`.

## Build & deploy (Vercel)

Tailwind is **compiled at build time** (no `cdn.tailwindcss.com` at runtime - that script is development-only and breaks in production when blocked/slow).

- `tailwind.config.js` - theme (maroon/cream/gold tokens), scans `*.html` and `assets/**/*.js`
- `src/input.css` - Tailwind entry file
- `build.mjs` - compiles CSS and copies the site into `dist/`
- `vercel.json` - build command `npm run build`, output directory `dist`

Local: copy `.env.example` to `.env`, fill in the two Supabase values, then `npm install && npm run build` and `npx serve dist`.
Vercel: also add `SUPABASE_URL` and `SUPABASE_ANON_KEY` as environment variables.
Vercel: Framework Preset = Other, Root Directory = the folder containing `package.json`; settings are read from `vercel.json`.

### UX layer
- `src/input.css` - Tailwind entry + the "polish" CSS (navbar, buttons, product-card hover, reveal, reduced-motion)
- `assets/site.js` - sticky-header state, mobile-menu close behaviour, section reveal (all IntersectionObserver based)
