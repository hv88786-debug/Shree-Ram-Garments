// Supabase browser client. Uses ONLY the public anon key from assets/config.js.
// Real protection comes from Row Level Security in the database (see supabase/migrations).
import { createClient } from '@supabase/supabase-js';

const cfg = window.SRG_CONFIG || {};
export const configured = Boolean(cfg.supabaseUrl && cfg.supabaseAnonKey);
export const BUCKET = 'store-media';

export const supabase = configured
  ? createClient(cfg.supabaseUrl, cfg.supabaseAnonKey, {
      auth: { persistSession: true, autoRefreshToken: true, detectSessionInUrl: false, storageKey: 'srg-admin-auth' }
    })
  : null;

// Is the signed-in user listed in admin_users? (RLS only lets a user see their own row.)
export async function isAdmin(userId) {
  const { data, error } = await supabase.from('admin_users').select('user_id').eq('user_id', userId).maybeSingle();
  if (error) throw error;
  return Boolean(data);
}
