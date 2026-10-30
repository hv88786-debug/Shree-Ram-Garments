// Password-recovery landing page (the link in the reset email opens admin/reset.html).
import { createClient } from '@supabase/supabase-js';
import { html, mount, $, errMsg, withBusy } from './ui.js';

const cfg = window.SRG_CONFIG || {};
const app = document.getElementById('app');
const wrap = (inner) => html`
<div class="min-h-screen flex items-center justify-center p-4 bg-gradient-to-b from-primary to-primary-container">
  <div class="w-full max-w-md card card-pad shadow-2xl">
    <h1 class="text-[22px] font-semibold text-primary-container">Choose a new password</h1>${inner}
    <p class="text-center mt-4"><a class="text-[13px] font-semibold text-primary-container underline" href="./">Go to admin sign in</a></p>
  </div>
</div>`;

if (!cfg.supabaseUrl || !cfg.supabaseAnonKey) {
  mount(app, wrap(html`<p class="mt-2 text-on-surface-variant">Supabase is not configured for this site.</p>`));
} else {
  // detectSessionInUrl lets supabase-js read the recovery token from the email link.
  const sb = createClient(cfg.supabaseUrl, cfg.supabaseAnonKey, { auth: { persistSession: false, detectSessionInUrl: true, flowType: 'implicit' } });
  let ready = false;
  const form = () => {
    mount(app, wrap(html`
      <form id="rs-form" class="mt-4 space-y-4" novalidate>
        <div><label class="label" for="rs-p1">New password</label><input id="rs-p1" class="input" type="password" autocomplete="new-password" minlength="8" required autofocus>
          <p class="hint">At least 8 characters.</p></div>
        <div><label class="label" for="rs-p2">Confirm new password</label><input id="rs-p2" class="input" type="password" autocomplete="new-password" required></div>
        <p id="rs-err" class="field-error hidden" role="alert"></p>
        <button class="btn-primary w-full" type="submit">Save new password</button>
      </form>`));
    $('#rs-form', app).addEventListener('submit', async (e) => {
      e.preventDefault();
      const p1 = $('#rs-p1', app).value, p2 = $('#rs-p2', app).value, err = $('#rs-err', app);
      err.classList.add('hidden');
      const bad = p1.length < 8 ? 'Password must be at least 8 characters.' : p1 !== p2 ? 'The two passwords do not match.' : '';
      if (bad) { err.textContent = bad; err.classList.remove('hidden'); return; }
      await withBusy($('button[type=submit]', app), async () => {
        const { error } = await sb.auth.updateUser({ password: p1 });
        if (error) { err.textContent = errMsg(error); err.classList.remove('hidden'); return; }
        await sb.auth.signOut();
        mount(app, wrap(html`<p class="mt-3 rounded-lg bg-[#e3f4e8] text-[#1b6b3a] px-3 py-2" role="status">Your password has been changed. You can now sign in with the new password.</p>`));
      });
    });
  };
  const invalid = () => mount(app, wrap(html`<p class="mt-3 rounded-lg bg-error-container text-on-error-container px-3 py-2" role="alert">This reset link is invalid or has expired. Please request a new one from the sign-in page.</p>`));
  sb.auth.onAuthStateChange((event) => { if (event === 'PASSWORD_RECOVERY' && !ready) { ready = true; form(); } });
  setTimeout(() => { if (!ready) invalid(); }, 5000);
}
