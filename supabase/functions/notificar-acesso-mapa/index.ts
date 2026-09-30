// Edge Function: notificar-acesso-mapa
//
// Chamada assim que a plataforma percebe que o acesso ao "Seu Mapa de 30
// Dias" de uma cliente acabou de ser liberado (profiles.diagnostico_liberado
// virou true) — tanto pelo clique em "Liberar acesso" no Admin (quando a
// conta já existia) quanto pelo próprio cadastro da cliente (quando a
// administradora confirmou o pagamento antes de ela criar a conta — nesse
// caso handle_new_user() já libera na hora do INSERT em profiles). Os dois
// caminhos chamam esta mesma função só com o id do perfil; ela decide sozinha
// se há algo a enviar.
//
// - Só envia se profiles.diagnostico_liberado = true (nunca avisa "liberado"
//   por engano).
// - Só envia uma vez: a linha é "reservada" atomicamente
//   (acesso_mapa_notificado_em is null → now()) antes do envio, e devolvida
//   para null se o envio falhar (permite nova tentativa depois).
// - Nunca aceita um e-mail vindo da chamada: sempre usa o e-mail já
//   cadastrado do dono do perfil — mesmo modelo de segurança de
//   notificar-calculadora-sessao.
//
// Segredos (Supabase → Edge Functions → Secrets) — reaproveita os já usados
// pelas outras funções de e-mail:
//   RESEND_API_KEY           obrigatório — chave de API do Resend
//   MENTORIA_EMAIL_REMETENTE opcional — padrão: Clínica de Valor <onboarding@resend.dev>
// SUPABASE_URL e SUPABASE_SERVICE_ROLE_KEY já existem em toda Edge Function.
//
// verify_jwt fica desligado pelo mesmo motivo das outras funções (chave
// publicável nova, não é JWT).

import { createClient } from 'jsr:@supabase/supabase-js@2';

const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), { status, headers: { ...CORS, 'Content-Type': 'application/json' } });
}

function esc(v: unknown) {
  return String(v ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]!));
}

function montarEmail(nome: string, urlLogin: string) {
  const primeiroNome = esc((nome || 'você').split(' ')[0]);
  const html = `
  <div style="font-family:Arial,Helvetica,sans-serif;background:#f7f3eb;padding:24px">
    <div style="max-width:600px;margin:auto;background:#fffdf9;border:1px solid #e5ded1;border-radius:16px;padding:28px">
      <div style="font-size:11px;letter-spacing:.14em;text-transform:uppercase;color:#9a5b34;font-weight:800">Clínica de Valor</div>
      <h1 style="font-family:Georgia,serif;font-weight:500;color:#173f31;font-size:24px;margin:8px 0 18px">Seu Mapa de 30 Dias já está liberado</h1>
      <p style="font-size:14px;color:#1f2521">Olá, ${primeiroNome}! Confirmamos o pagamento do seu Mapa de 30 Dias — seu acesso já está liberado na plataforma.</p>
      <p style="font-size:14px;color:#1f2521">Entre com o e-mail e a senha que você cadastrou para ver seu diagnóstico, o mapa personalizado e o plano de ação.</p>
      <p style="text-align:center;margin:26px 0">
        <a href="${esc(urlLogin)}" style="display:inline-block;background:#173f31;color:#fffdf9;font-weight:700;text-decoration:none;padding:12px 26px;border-radius:999px;font-size:14px">Acessar minha plataforma</a>
      </p>
      <p style="font-size:12px;color:#69716b;margin:22px 0 0;text-align:center">Se você ainda não criou sua conta, crie com o mesmo e-mail informado na compra.</p>
    </div>
  </div>`;
  const texto = `Olá, ${nome || 'você'}!\n\nConfirmamos o pagamento do seu Mapa de 30 Dias — seu acesso já está liberado na plataforma.\n\nEntre em ${urlLogin} com o e-mail e a senha que você cadastrou (ou crie sua conta com o mesmo e-mail da compra, se ainda não criou).`;
  return { html, texto };
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: CORS });
  if (req.method !== 'POST') return json({ ok: false, erro: 'método não permitido' }, 405);

  let id = '';
  try { id = String((await req.json())?.id ?? ''); } catch { /* corpo inválido */ }
  if (!UUID_RE.test(id)) return json({ ok: false, erro: 'id inválido' }, 400);

  const supabase = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!, {
    auth: { persistSession: false },
  });

  // Reserva o perfil para envio (uma vez só, e só se realmente estiver liberado).
  const { data: perfil, error: erroReserva } = await supabase
    .from('profiles')
    .update({ acesso_mapa_notificado_em: new Date().toISOString() })
    .eq('id', id)
    .eq('diagnostico_liberado', true)
    .is('acesso_mapa_notificado_em', null)
    .select('id, email, nome_completo')
    .maybeSingle();

  if (erroReserva) return json({ ok: false, erro: 'falha ao ler o perfil' }, 500);
  if (!perfil) return json({ ok: true, enviado: false, motivo: 'já avisado, não liberado ou inexistente' });

  const apiKey = Deno.env.get('RESEND_API_KEY');
  const remetente = Deno.env.get('MENTORIA_EMAIL_REMETENTE') || 'Clínica de Valor <onboarding@resend.dev>';
  const urlLogin = Deno.env.get('SITE_URL') ? `${Deno.env.get('SITE_URL')}/login/index.html` : 'https://india-plataforma.pages.dev/login/index.html';

  let erroEnvio: string | null = null;
  if (!perfil.email) {
    erroEnvio = 'e-mail da cliente não encontrado';
  } else if (!apiKey) {
    erroEnvio = 'RESEND_API_KEY não configurada';
  } else {
    const { html, texto } = montarEmail(perfil.nome_completo || '', urlLogin);
    try {
      const resp = await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: { Authorization: `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({
          from: remetente,
          to: [perfil.email],
          subject: 'Seu Mapa de 30 Dias já está liberado — Clínica de Valor',
          html,
          text: texto,
        }),
      });
      if (!resp.ok) erroEnvio = `Resend ${resp.status}: ${(await resp.text()).slice(0, 300)}`;
    } catch (e) {
      erroEnvio = `falha de rede: ${String(e).slice(0, 300)}`;
    }
  }

  if (erroEnvio) {
    await supabase.from('profiles').update({ acesso_mapa_notificado_em: null }).eq('id', id);
    console.error('notificar-acesso-mapa:', erroEnvio);
    return json({ ok: false, enviado: false, erro: 'não foi possível enviar o e-mail' }, 502);
  }

  return json({ ok: true, enviado: true });
});
