# Shree Ram Garments - Admin panel setup (Windows PowerShell, beginner friendly)

The website now reads its products, categories, homepage text and store settings from **Supabase**
(a hosted database). The shop owner manages everything at **`https://YOUR-SITE/admin/`**.

```
Visitors  ->  index.html / shop.html / product.html  ->  Supabase (READ-ONLY, public data only)
Owner     ->  /admin/  ->  Supabase Auth login  ->  Supabase (read + write, only if listed in admin_users)
```

**Security in one paragraph.** The website code contains only the *public* "anon" key. That key can only
do what the database's Row Level Security (RLS) rules allow: visitors may read active products,
active categories and public store details, nothing else. Writing is allowed only for users whose
id is in the `admin_users` table, and that table can only be edited from the Supabase SQL Editor.
The secret `service_role` key is never used - and the build refuses to run if you paste it by mistake.

> **Honest status:** the code, the SQL (run on a local Postgres engine, 42 permission checks) and the
> admin/public screens (browser tests against a simulated API, 58 checks) are tested. It has **not**
> been run against *your* Supabase project, because that needs your credentials. Do the checklist in
> section 8 before you call it production-ready.

---

## 1. Create the Supabase project (5 minutes)

1. Go to https://supabase.com -> sign in -> **New project**. Pick a name (e.g. `shree-ram-garments`),
   a strong database password (save it in a password manager) and the region nearest to you (e.g. *Mumbai*).
2. Wait until the project is ready.

## 2. Create the database (SQL Editor)

Open **SQL Editor -> New query**. For each file below: open it in Notepad / VS Code, copy everything,
paste into the SQL Editor and press **Run**. Wait for "Success" before the next one. **Order matters.**

| # | File (in `supabase\`) | What it does |
|---|-----------------------|--------------|
| 1 | `migrations\20261030000001_schema.sql` | Tables, save function, admin views |
| 2 | `migrations\20261030000002_rls.sql` | Security rules (RLS) - who can read/write what |
| 3 | `migrations\20261030000003_storage.sql` | Image bucket `store-media` (5 MB, JPG/PNG/WebP only, admin-only upload) |
| 4 | `seed.sql` *(optional)* | Loads the 5 categories + 38 demo products + current homepage images. Skip it to start empty |

Check: **Table Editor** should list `categories`, `products`, `product_variants`, `product_images`,
`store_settings`, `homepage_content`, `announcements`, `admin_users`, `admin_settings`.
**Storage** should show a public bucket `store-media`.

## 3. Lock down sign-ups and create administrators

1. **Authentication -> Sign In / Providers** (or *Providers -> Email*): turn **OFF** "Allow new users to sign up".
   (Admins are created by you, never by visitors. Even if this were on, a stranger would still have no admin rights - but turn it off anyway.)
2. **Authentication -> Users -> Add user -> Create new user**: enter the owner's email + a strong password,
   tick **Auto Confirm User**. Repeat for the second administrator.
3. Back in **SQL Editor**, open `supabase\make_admin.sql`, replace `owner@example.com` with the first email, **Run**.
   Change the email to the second administrator and Run again. The final `select` should list both.
4. **Authentication -> URL Configuration**:
   * **Site URL**: your live website, e.g. `https://shreeramgarments.in`
   * **Redirect URLs**: add `https://YOUR-SITE/admin/reset.html` and (for local testing) `http://localhost:3000/admin/reset.html`
5. Password-reset e-mails: Supabase's built-in mailer is very limited (a few mails per hour). For real use,
   set your own SMTP under **Authentication -> Emails -> SMTP Settings** (Gmail/Brevo/Resend all work).

## 4. Copy the two public values

**Project Settings -> API** (or *Connect*): copy
* **Project URL** (looks like `https://abcdxyz.supabase.co`) -> `SUPABASE_URL`
* **anon / publishable key** -> `SUPABASE_ANON_KEY`

Do **not** copy the `service_role` / `secret` key anywhere.

## 5. Run it on your computer (PowerShell)

Install Node.js LTS from https://nodejs.org if `node -v` shows an error. Then:

```powershell
# 1. go to the project folder (change the path to where you unzipped it)
cd C:\Users\YOURNAME\Desktop\shree_ram_garments_site_fixed

# 2. create your private settings file from the template
Copy-Item .env.example .env
notepad .env
#    Fill in:  SUPABASE_URL=https://abcdxyz.supabase.co
#              SUPABASE_ANON_KEY=eyJ...your anon key...
#    Save and close Notepad. (.env is git-ignored, so it is never uploaded.)

# 3. install and build
npm install
npm run build

# 4. open the built site
npx serve dist
```

Open http://localhost:3000 (website) and http://localhost:3000/admin/ (admin). Sign in with the e-mail/password from step 3.
If the build prints `Supabase is not configured`, your `.env` is missing or has no values.

## 6. Deploy to Vercel

1. Vercel dashboard -> your project -> **Settings -> Environment Variables**. Add (for *Production*, *Preview* and *Development*):
   * `SUPABASE_URL` = your Project URL
   * `SUPABASE_ANON_KEY` = your anon/publishable key
2. Settings -> General: Framework Preset **Other**, Build Command `npm run build`, Output Directory `dist` (already in `vercel.json`).
3. Upload the new code and redeploy:
   ```powershell
   git add .
   git commit -m "Add Supabase admin panel"
   git push
   ```
   (No Git? run `npx vercel --prod` and follow the prompts.)
4. **Changing env variables later needs a redeploy** (Deployments -> ... -> Redeploy), because the values are baked in at build time.
5. Make sure the Supabase **Site URL / Redirect URLs** (step 3.4) use your final domain.

## 7. Using the admin panel

| Page | What you do there |
|------|-------------------|
| Dashboard | Totals, low/out-of-stock, recent products, quick actions |
| Products | Add / edit / duplicate / delete, search, filter, sort. The switch hides a product without deleting it |
| Product form | Name, SKU, category, price (+ original price), up to 10 photos (first = cover), sizes & colours, **stock for every size+colour**, Featured / New arrival / Visible |
| Categories | Add, rename, reorder (arrows), hide, delete (blocked while it contains products) |
| Inventory | Type or +/- the stock of each size/colour; saved instantly. Filter low/out of stock |
| Homepage | Hero image/text, promo banner (with start/end schedule), top announcement bar (scheduled), pick featured & new-arrival products |
| Store settings | Name, logo, **WhatsApp number**, address, hours, social links, low-stock level, change password |

Notes
* Homepage "Popular Picks" shows the 4 newest *Featured* products; "New Arrivals" the 4 newest *New arrival* products.
* WhatsApp enquiries contain product name, price, SKU, and the size/colour the customer picked.
* Photos are shrunk to max 1600 px and stored as WebP automatically. Stock numbers are never visible to visitors - only "in stock / sold out".
* The website loads up to 1000 products at once (Supabase's default limit). That is plenty for one shop; ask for pagination if you ever pass ~800.
* The demo seed has **no stock rows** (sizes/colours are unknown). Add them per product; until then the product page simply has no size picker.
* The phone numbers in the header/footer (Vikram Saini) are still written in the HTML, not in settings.

## 8. Test it before going live (do not skip)

1. **Logged out**: open `/admin/` in a private window -> you see only the sign-in form.
2. **Wrong person**: in Supabase create a third user but do *not* run `make_admin.sql` for them. Signing in must show "not authorised".
3. **Anonymous write is refused** (replace the two placeholders; expect a red *401/403/permission* error):
   ```powershell
   $k = "YOUR_ANON_KEY"
   $h = @{ apikey = $k; Authorization = "Bearer $k"; "Content-Type" = "application/json" }
   Invoke-RestMethod -Method Post -Uri "https://YOUR_REF.supabase.co/rest/v1/categories" -Headers $h -Body '{"slug":"hack","name":"Hack"}'
   ```
4. **Private data is hidden** - both must fail or return nothing:
   ```powershell
   Invoke-RestMethod -Uri "https://YOUR_REF.supabase.co/rest/v1/admin_users?select=*" -Headers $h
   Invoke-RestMethod -Uri "https://YOUR_REF.supabase.co/rest/v1/product_variants?select=stock" -Headers $h
   ```
5. In the admin: add a product with 2 sizes x 2 colours, upload 2 photos, mark Featured. Open the website: it must appear on the homepage, in the shop, and its page must show the size/colour pickers; the WhatsApp button must contain name, price, SKU, size, colour.
6. Set one size to stock 0 -> that size is struck through on the product page. Hide the product -> it disappears from the site.
7. Upload a 6 MB photo and a renamed `.txt` -> both must be rejected.
8. Use "Forgot your password?" -> e-mail arrives -> new password works.
9. Phone check: open the site and admin at 375 px width (browser DevTools -> device toolbar).

Only when all nine pass is it reasonable to call this production-ready.

## 9. Troubleshooting

| Symptom | Fix |
|---------|-----|
| Site shows the old demo products | `SUPABASE_URL`/`SUPABASE_ANON_KEY` were missing at build time. Add them, redeploy |
| "We could not load the collection" | Wrong URL/key, SQL files 2 not run (RLS blocks reads), or project paused (free projects pause after inactivity - click *Restore*) |
| Empty shop, no error | Products are Hidden, their category is hidden, or the seed was not run |
| Admin: "not authorised" | Run `make_admin.sql` with that exact e-mail |
| Admin: "permission denied / row-level security" | Run migration 2 again, make sure you are signed in as an administrator |
| Reset e-mail never arrives / link invalid | Configure SMTP; add the redirect URL (step 3.4); links expire - request a new one |
| Photo upload fails | Run migration 3; file must be JPG/PNG/WebP under 5 MB |
| Build says "SECRET key" | You pasted the service_role key. Use the anon/publishable key |

## 10. Project layout

```
admin\index.html, admin\reset.html   admin shells (no inline scripts; strict CSP in vercel.json)
src\admin\*.js, src\admin.css        admin app source (bundled by esbuild, styled by Tailwind)
assets\products.js                   public data layer (reads Supabase, falls back to demo data if unconfigured)
assets\demo-data.js                  demo catalogue (fallback + source of supabase\seed.sql)
assets\config.js                     overwritten at build with your public Supabase values
supabase\migrations\*.sql            schema, RLS, storage     supabase\seed.sql, make_admin.sql
build.mjs                            env -> config, Tailwind (site + admin), esbuild
```
Backups: Supabase free projects have no automatic backups; export data regularly (Table Editor -> Export) or upgrade.
