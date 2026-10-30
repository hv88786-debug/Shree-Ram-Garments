import { supabase, isAdmin } from './supabase.js';
import { html, mount, $, errMsg, withBusy, icon } from './ui.js';

const shell = (inner) => html`
<div class="min-h-screen flex items-center justify-center p-4 bg-gradient-to-b from-primary to-primary-container">
  <div class="w-full max-w-md">
    <div class="text-center text-white mb-6">
      <p class="text-[11px] tracking-[0.3em] uppercase text-secondary-fixed-dim font-bold">Neem Ka Thana • Rajasthan</p>
      <h1 class="text-[28px] font-semibold mt-1">Shree Ram Garments</h1>
      <p class="text-[13px] text-[#f3dcdc]">Store administration</p>
    </div>
    <div class="card card-pad shadow-2xl border-secondary/30">${inner}</div>
    <p class="text-center text-[12px] text-[#f3dcdc] mt-4">Authorised staff only. <a class="underline" href="../index.html">Back to website</a></p>
  </div>
</div>`;

export function notConfiguredScreen(el) {
  mount(el, shell(html`
    <h2 class="text-[20px] font-semibold text-primary-container flex items-center gap-2">${icon('settings_alert', 'text-error')} Supabase is not configured</h2>
    <p class="mt-2 text-on-surface-variant">This build was made without <code class="bg-surface-container px-1 rounded">SUPABASE_URL</code> and <code class="bg-surface-container px-1 rounded">SUPABASE_ANON_KEY</code>, so sign-in is not possible.</p>
    <p class="mt-2 text-on-surface-variant">Follow <strong>SETUP.md</strong> to add them (a local <code class="bg-surface-container px-1 rounded">.env</code> file, and the same two variables in Vercel), then build and deploy again.</p>`));
}

export function showLogin(el, notice = '') {
  mount(el, shell(html`
    <h2 class="text-[22px] font-semibold text-primary-container">Sign in</h2>
    ${notice ? html`<p class="mt-2 text-[13px] rounded-lg bg-[#fff1d0] text-[#7a5200] px-3 py-2" role="status">${notice}</p>` : ''}
    <form id="login-form" class="mt-4 space-y-4" novalidate>
      <div><label class="label" for="lg-email">Email</label>
        <input id="lg-email" class="input" type="email" autocomplete="username" required autofocus></div>
      <div><label class="label" for="lg-pass">Password</label>
        <input id="lg-pass" class="input" type="password" autocomplete="current-password" required></div>
      <p id="lg-err" class="field-error hidden" role="alert"></p>
      <button class="btn-primary w-full" type="submit">Sign in</button>
      <button type="button" id="lg-forgot" class="block mx-auto text-[13px] font-semibold text-primary-container underline underline-offset-2">Forgot your password?</button>
    </form>`));
  const form = $('#login-form', el), err = $('#lg-err', el);
  const fail = (m) => { err.textContent = m; err.classList.remove('hidden'); };
  form.addEventListener('submit', async (e) => {
    e.preventDefault(); err.classList.add('hidden');
    const email = $('#lg-email', el).value.trim(), password = $('#lg-pass', el).value;
    if (!email || !password) return fail('Please enter your email and password.');
    await withBusy($('button[type=submit]', form), async () => {
      const { data, error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) return fail(/invalid login/i.test(error.message) ? 'Incorrect email or password.' : errMsg(error));
      try {
        if (!(await isAdmin(data.user.id))) {
          await supabase.auth.signOut();
          return fail('This account is not authorised to manage the store. Ask the owner to add you as an administrator.');
        }
      } catch (ex) { await supabase.auth.signOut(); return fail(errMsg(ex)); }
      // success: main.js reacts to the SIGNED_IN event
    });
  });
  $('#lg-forgot', el).addEventListener('click', () => showForgot(el, $('#lg-email', el).value.trim()));
}

export function showForgot(el, email = '') {
  mount(el, shell(html`
    <h2 class="text-[22px] font-semibold text-primary-container">Reset your password</h2>
    <p class="mt-1 text-on-surface-variant">Enter your email and we will send you a link to choose a new password.</p>
    <form id="fg-form" class="mt-4 space-y-4" novalidate>
      <div><label class="label" for="fg-email">Email</label>
        <input id="fg-email" class="input" type="email" autocomplete="username" required value="${email}" autofocus></div>
      <p id="fg-msg" class="hidden text-[13px] rounded-lg px-3 py-2" role="status"></p>
      <button class="btn-primary w-full" type="submit">Send reset link</button>
      <button type="button" id="fg-back" class="block mx-auto text-[13px] font-semibold text-primary-container underline underline-offset-2">Back to sign in</button>
    </form>`));
  const msg = $('#fg-msg', el);
  $('#fg-back', el).addEventListener('click', () => showLogin(el));
  $('#fg-form', el).addEventListener('submit', async (e) => {
    e.preventDefault();
    const em = $('#fg-email', el).value.trim();
    msg.className = 'text-[13px] rounded-lg px-3 py-2';
    if (!/^\S+@\S+\.\S+$/.test(em)) { msg.classList.add('bg-error-container', 'text-on-error-container'); msg.textContent = 'Please enter a valid email address.'; return; }
    await withBusy($('button[type=submit]', el), async () => {
      const { error } = await supabase.auth.resetPasswordForEmail(em, { redirectTo: new URL('reset.html', location.href).href });
      if (error && !/not found/i.test(error.message)) {
        msg.classList.add('bg-error-container', 'text-on-error-container'); msg.textContent = errMsg(error);
      } else {
        // Same message whether or not the email exists, so nobody can probe which emails are admins.
        msg.classList.add('bg-[#e3f4e8]', 'text-[#1b6b3a]');
        msg.textContent = 'If an account exists for that email, a reset link is on its way. Check your inbox (and spam folder).';
      }
    });
  });
}
