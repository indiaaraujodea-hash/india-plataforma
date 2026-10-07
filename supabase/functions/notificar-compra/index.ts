// Edge Function: notificar-compra
//
// Chamada pela página /compra/ logo depois de salvar uma solicitação em
// public.solicitacoes_compra. Busca a solicitação com a service role, envia
// o e-mail de aviso pelo Resend e registra o resultado na própria linha
// (email_notificacao_em / email_notificacao_erro).
//
// - A solicitação já está salva antes desta função rodar: se o e-mail falhar,
//   o registro continua no banco (e o erro fica visível em /admin/).
// - Só envia uma vez por solicitação: a linha é "reservada" atomicamente
//   (email_notificacao_em is null → now()) antes do envio. Se o envio falhar,
//   a reserva é desfeita (volta a null) e o erro fica registrado — permite
//   tentar de novo sem duplicar a solicitação em si.
// - Só aceita solicitações recentes (últimas 2 h) quando quem chama não é
//   identificado como admin — pra a URL pública não virar um disparador de
//   e-mails antigos. Uma chamada com o token de uma admin autenticada (Admin
//   → "Reenviar aviso") ignora esse limite, porque reenviar um aviso de uma
//   solicitação de ontem é exatamente pra isso que serve o botão.
//
// Segredos (Supabase → Edge Functions → Secrets) — reaproveita os já usados
// por notificar-mentoria:
//   RESEND_API_KEY          obrigatório — chave de API do Resend
//   MENTORIA_EMAIL_DESTINO  opcional — padrão: indiaaraujodea@gmail.com
//   MENTORIA_EMAIL_REMETENTE opcional — padrão: Clínica de Valor <onboarding@resend.dev>
// SUPABASE_URL e SUPABASE_SERVICE_ROLE_KEY já existem em toda Edge Function.
//
// verify_jwt fica desligado porque o site usa a chave publicável nova
// (sb_publishable_…), que não é um JWT. A função não expõe dados: só recebe
// o id e só age sobre solicitações que ainda não foram avisadas (ou, pra
// quem é admin, sobre qualquer solicitação existente).

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

// Decodifica o "sub" (user id) de um JWT sem validar a assinatura — a
// validação de verdade é a consulta a profiles.role logo em seguida, feita
// com a service role (a mesma linha que a própria cliente não conseguiria
// ler/alterar por RLS). Isso só decide se o limite de 2h é ignorado; nunca
// concede acesso a dado nenhum por si só.
function subDoJwt(authHeader: string | null): string | null {
  const token = (authHeader || '').replace(/^Bearer\s+/i, '').trim();
  if (!token || token.split('.').length !== 3) return null;
  try {
    const payloadB64 = token.split('.')[1].replace(/-/g, '+').replace(/_/g, '/');
    const padded = payloadB64 + '='.repeat((4 - (payloadB64.length % 4)) % 4);
    const payload = JSON.parse(atob(padded));
    return typeof payload.sub === 'string' ? payload.sub : null;
  } catch {
    return null;
  }
}

type Solicitacao = {
  id: string; nome: string; email: string; whatsapp: string;
  produto: string; valor: number; criado_em: string;
};

function montarEmail(s: Solicitacao) {
  const valorFmt = Number(s.valor).toFixed(2).replace('.', ',');
  const data = new Date(s.criado_em).toLocaleString('pt-BR', { timeZone: 'America/Sao_Paulo' });
  const waLink = `https://wa.me/${s.whatsapp.replace(/\D/g, '')}`;
  const linhas: [string, string][] = [
    ['Produto', s.produto],
    ['Valor', `R$ ${valorFmt}`],
    ['Nome', s.nome],
    ['E-mail', s.email],
    ['WhatsApp', s.whatsapp],
    ['Enviado em', data],
  ];
  const html = `
  <div style="font-family:Arial,Helvetica,sans-serif;background:#f7f3eb;padding:24px">
    <div style="max-width:600px;margin:auto;background:#fffdf9;border:1px solid #e5ded1;border-radius:16px;padding:28px">
      <div style="font-size:11px;letter-spacing:.14em;text-transform:uppercase;color:#9a5b34;font-weight:800">Clínica de Valor</div>
      <h1 style="font-family:Georgia,serif;font-weight:500;color:#173f31;font-size:24px;margin:8px 0 18px">Pagamento a confirmar: ${esc(s.nome)}</h1>
      <table style="width:100%;border-collapse:collapse;font-size:14px;color:#1f2521">
        ${linhas.map(([k, v]) => `<tr><td style="padding:9px 10px 9px 0;border-bottom:1px solid #e5ded1;color:#69716b;vertical-align:top;width:40%">${esc(k)}</td><td style="padding:9px 0;border-bottom:1px solid #e5ded1;white-space:pre-wrap">${esc(v)}</td></tr>`).join('')}
      </table>
      <div style="text-align:center;margin-top:24px">
        <a href="${waLink}" style="display:inline-block;background:#173f31;color:#fff;text-decoration:none;font-weight:700;padding:14px 26px;border-radius:999px">Abrir WhatsApp de ${esc(s.nome.split(' ')[0])}</a>
      </div>
      <p style="font-size:12px;color:#69716b;margin:22px 0 0;text-align:center">Confira o comprovante e libere o acesso em /admin/ no site.</p>
    </div>
  </div>`;
  const texto = linhas.map(([k, v]) => `${k}: ${v}`).join('\n') + `\n\nWhatsApp: ${waLink}`;
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

  const userId = subDoJwt(req.headers.get('Authorization'));
  let chamadaDeAdmin = false;
  if (userId) {
    const { data: perfilChamador } = await supabase.from('profiles').select('role').eq('id', userId).maybeSingle();
    chamadaDeAdmin = perfilChamador?.role === 'admin';
  }

  // Reserva a solicitação para envio (uma vez só). Fora da janela de 2h só
  // quem é admin pode reenviar (botão "Reenviar aviso" no Admin).
  let query = supabase
    .from('solicitacoes_compra')
    .update({ email_notificacao_em: new Date().toISOString(), email_notificacao_erro: null })
    .eq('id', id)
    .is('email_notificacao_em', null);
  if (!chamadaDeAdmin) {
    const limite = new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString();
    query = query.gte('criado_em', limite);
  }
  const { data: solicitacao, error: erroReserva } = await query
    .select('id, nome, email, whatsapp, produto, valor, criado_em')
    .maybeSingle();

  if (erroReserva) return json({ ok: false, erro: 'falha ao ler a solicitação' }, 500);
  if (!solicitacao) return json({ ok: true, enviado: false, motivo: 'já avisada, antiga ou inexistente' });

  const apiKey = Deno.env.get('RESEND_API_KEY');
  const destino = Deno.env.get('MENTORIA_EMAIL_DESTINO') || 'indiaaraujodea@gmail.com';
  const remetente = Deno.env.get('MENTORIA_EMAIL_REMETENTE') || 'Clínica de Valor <onboarding@resend.dev>';

  let erroEnvio: string | null = null;
  if (!apiKey) {
    erroEnvio = 'RESEND_API_KEY não configurada';
  } else {
    const { html, texto } = montarEmail(solicitacao as Solicitacao);
    try {
      const resp = await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: { Authorization: `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({
          from: remetente,
          to: [destino],
          reply_to: solicitacao.email,
          subject: `Pagamento a confirmar: ${solicitacao.nome} — ${solicitacao.produto}`,
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
    // Libera a solicitação para uma nova tentativa e deixa o erro registrado.
    await supabase.from('solicitacoes_compra')
      .update({ email_notificacao_em: null, email_notificacao_erro: erroEnvio })
      .eq('id', id);
    console.error('notificar-compra:', erroEnvio);
    return json({ ok: false, enviado: false, erro: 'não foi possível enviar o e-mail' }, 502);
  }

  return json({ ok: true, enviado: true });
});
