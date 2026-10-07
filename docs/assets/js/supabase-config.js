// Preencha com os dados do SEU projeto Supabase (Project Settings → API).
// SUPABASE_ANON_KEY é pública por design (protegida pelas policies de RLS do
// schema em /supabase/schema.sql) — não é um segredo, mas só funciona depois
// que o schema/RLS estiverem aplicados no projeto.
export const SUPABASE_URL = "https://wixizwjzqyhyjtksfvnh.supabase.co";
export const SUPABASE_ANON_KEY = "sb_publishable_An1umKCJGa3p3ouQzdSYkw_dF3fzuBU";

// Só troque para `true` depois de configurar o provedor Google em
// Supabase → Authentication → Providers (e o OAuth client no Google Cloud).
// Enquanto estiver `false`, o botão "Entrar com Google" fica oculto no login
// para não expor um botão quebrado ("Unsupported provider").
export const GOOGLE_AUTH_ENABLED = false;
