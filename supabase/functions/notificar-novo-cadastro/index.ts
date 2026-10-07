// Edge Function: notificar-novo-cadastro
//
// Chamada pela página /login/ logo depois que uma conta nova termina de ser
// criada (qualquer rota de cadastro: calculadora, compra do Mapa ou direto).
// Avisa a administradora por e-mail que alguém se cadastrou na plataforma.
//
// - Só envia uma vez por perfil: a linha é "reservada" atomicamente
//   (aviso_cadastro_enviado_em is null → now()) antes do envio, e devolvida
//   para null se o envio falhar (permite nova tentativa depois).
// - Nunca aceita um e-mail vindo da chamada: sempre usa o e-mail já
//   cadastrado do dono do perfil — mesmo modelo de segurança das outras
//   funções de e-mail desta plataforma.
//
// Segredos (Supabase → Edge Functions → Secrets) — reaproveita os já usados
// pelas outras funções de e-mail:
//   RESEND_API_KEY           obrigatório — chave de API do Resend
//   MENTORIA_EMAIL_DESTINO   opcional — padrão: indiaaraujodea@gmail.com
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

function montarEmail(nome: string, email: string, criadoEm: string) {
  const data = new Date(criadoEm).toLocaleString('pt-BR', { timeZone: 'America/Sao_Paulo' });
  const html = `
  <div style="font-family:Arial,Helvetica,sans-serif;background:#f7f3eb;padding:24px">
    <div style="max-width:600px;margin:auto;background:#fffdf9;border:1px solid #e5ded1;border-radius:16px;padding:28px">
      <div style="font-size:11px;letter-spacing:.14em;text-transform:uppercase;color:#9a5b34;font-weight:800">Clínica de Valor</div>
      <h1 style="font-family:Georgia,serif;font-weight:500;color:#173f31;font-size:24px;margin:8px 0 18px">Novo cadastro na plataforma</h1>
      <table style="width:100%;border-collapse:collapse;font-size:14px;color:#1f2521">
        <tr><td style="padding:9px 10px 9px 0;border-bottom:1px solid #e5ded1;color:#69716b;width:40%">Nome</td><td style="padding:9px 0;border-bottom:1px solid #e5ded1">${esc(nome || '—')}</td></tr>
        <tr><td style="padding:9px 10px 9px 0;border-bottom:1px solid #e5ded1;color:#69716b">E-mail</td><td style="padding:9px 0;border-bottom:1px solid #e5ded1">${esc(email)}</td></tr>
        <tr><td style="padding:9px 10px 9px 0;color:#69716b">Cadastrado em</td><td style="padding:9px 0">${esc(data)}</td></tr>
      </table>
      <p style="font-size:12px;color:#69716b;margin:22px 0 0;text-align:center">Confira a ficha completa dela em /admin/ no site.</p>
    </div>
  </div>`;
  const texto = `Novo cadastro na plataforma\n\nNome: ${nome || '—'}\nE-mail: ${email}\nCadastrado em: ${data}`;
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

  // Reserva o perfil para envio (uma vez só).
  const { data: perfil, error: erroReserva } = await supabase
    .from('profiles')
    .update({ aviso_cadastro_enviado_em: new Date().toISOString() })
    .eq('id', id)
    .is('aviso_cadastro_enviado_em', null)
    .select('id, nome_completo, email, criado_em')
    .maybeSingle();

  if (erroReserva) return json({ ok: false, erro: 'falha ao ler o perfil' }, 500);
  if (!perfil) return json({ ok: true, enviado: false, motivo: 'já avisado ou inexistente' });

  const apiKey = Deno.env.get('RESEND_API_KEY');
  const destino = Deno.env.get('MENTORIA_EMAIL_DESTINO') || 'indiaaraujodea@gmail.com';
  const remetente = Deno.env.get('MENTORIA_EMAIL_REMETENTE') || 'Clínica de Valor <onboarding@resend.dev>';

  let erroEnvio: string | null = null;
  if (!perfil.email) {
    erroEnvio = 'e-mail do perfil não encontrado';
  } else if (!apiKey) {
    erroEnvio = 'RESEND_API_KEY não configurada';
  } else {
    const { html, texto } = montarEmail(perfil.nome_completo || '', perfil.email, perfil.criado_em);
    try {
      const resp = await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: { Authorization: `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({
          from: remetente,
          to: [destino],
          reply_to: perfil.email,
          subject: `Novo cadastro: ${perfil.nome_completo || perfil.email} — Clínica de Valor`,
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
    await supabase.from('profiles').update({ aviso_cadastro_enviado_em: null }).eq('id', id);
    console.error('notificar-novo-cadastro:', erroEnvio);
    return json({ ok: false, enviado: false, erro: 'não foi possível enviar o e-mail' }, 502);
  }

  return json({ ok: true, enviado: true });
});
