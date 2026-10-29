# Shree Ram Garments website

Static site (Tailwind via CDN). Open `index.html` in a browser (internet needed for Tailwind, Google Fonts and the existing images).

- `index.html` - homepage (product sections are filled from `assets/products.js`)
- `shop.html` - All Products (category, type, search, price range, sort)
- `product.html?id=PRODUCT_ID` - product details
- `assets/products.js` - ALL product data and the WhatsApp number (917976399389). Edit here to add/remove/update products or set `image: 'assets/images/x.jpg'`.
- `assets/shop.js`, `assets/product.js`, `assets/home.js` - page logic

All names, prices and photos are demo placeholders until real inventory is supplied.

## Build & deploy (Vercel)

Tailwind is **compiled at build time** (no `cdn.tailwindcss.com` at runtime - that script is development-only and breaks in production when blocked/slow).

- `tailwind.config.js` - theme (maroon/cream/gold tokens), scans `*.html` and `assets/**/*.js`
- `src/input.css` - Tailwind entry file
- `build.mjs` - compiles CSS and copies the site into `dist/`
- `vercel.json` - build command `npm run build`, output directory `dist`

Local: `npm install && npm run build`, then open `dist/index.html`.
Vercel: Framework Preset = Other, Root Directory = the folder containing `package.json`; settings are read from `vercel.json`.

### UX layer
- `src/input.css` - Tailwind entry + the "polish" CSS (navbar, buttons, product-card hover, reveal, reduced-motion)
- `assets/site.js` - sticky-header state, mobile-menu close behaviour, section reveal (all IntersectionObserver based)
