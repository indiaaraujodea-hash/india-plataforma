import { createClient } from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/+esm';
import { SUPABASE_URL, SUPABASE_ANON_KEY } from './supabase-config.js';

export const supabaseConfigurado = !SUPABASE_URL.startsWith('COLOQUE_AQUI') && !SUPABASE_ANON_KEY.startsWith('COLOQUE_AQUI');

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: { persistSession: true, autoRefreshToken: true }
});

export function avisarSupabaseNaoConfigurado() {
  if (supabaseConfigurado) return;
  const box = document.createElement('div');
  box.style.cssText = 'position:fixed;left:0;right:0;top:0;z-index:9999;background:#a43b45;color:#fff;padding:10px 16px;font:13px Arial;text-align:center';
  box.textContent = 'Supabase ainda não configurado — edite docs/assets/js/supabase-config.js com a URL e a anon key do projeto.';
  document.body.prepend(box);
}
