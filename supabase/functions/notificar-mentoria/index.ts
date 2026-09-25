// Edge Function: notificar-mentoria
//
// Chamada pela página /mentoria/ logo depois de salvar uma intenção em
// public.aplicacoes_mentoria. Busca a intenção com a service role, envia o
// e-mail de aviso pelo Resend e registra o resultado na própria linha
// (email_notificacao_em / email_notificacao_erro).
//
// - A intenção já está salva antes desta função rodar: se o e-mail falhar, o
//   registro continua no banco (e o erro fica visível em /admin/aplicacoes/).
// - Só envia uma vez por intenção: a linha é "reservada" atomicamente
//   (email_notificacao_em is null → now()) antes do envio.
// - Só aceita intenções recentes (últimas 2 h), para a URL pública não virar
//   um disparador de e-mails antigos.
//
// Segredos (Supabase → Edge Functions → Secrets):
//   RESEND_API_KEY          obrigatório — chave de API do Resend
//   MENTORIA_EMAIL_DESTINO  opcional — padrão: indiaaraujodea@gmail.com
//   MENTORIA_EMAIL_REMETENTE opcional — padrão: Clínica de Valor <onboarding@resend.dev>
// SUPABASE_URL e SUPABASE_SERVICE_ROLE_KEY já existem em toda Edge Function.
//
// verify_jwt fica desligado porque o site usa a chave publicável nova
// (sb_publishable_…), que não é um JWT. A função não expõe dados: só recebe
// o id e só age sobre intenções recém-criadas que ainda não foram avisadas.

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

function fmtWhatsapp(d: string) {
  // 55 + DDD + número → (43) 98425-7669
  const local = d.startsWith('55') ? d.slice(2) : d;
  const ddd = local.slice(0, 2);
  const num = local.slice(2);
  const meio = num.length === 9 ? 5 : 4;
  return `(${ddd}) ${num.slice(0, meio)}-${num.slice(meio)}`;
}

type Aplicacao = {
  id: string; nome: string; whatsapp: string; email: string; cidade: string;
  tempo_atuacao: string; atendimentos_semana: number; faturamento_mensal: string;
  maior_desafio: string; modalidade: string; como_conheceu: string | null; criado_em: string;
};

function montarEmail(a: Aplicacao) {
  const waLink = `https://wa.me/${a.whatsapp}?text=${encodeURIComponent(`Olá, ${a.nome.split(' ')[0]}! Aqui é a India. Recebi sua intenção para a Mentoria Clínica de Valor.`)}`;
  const data = new Date(a.criado_em).toLocaleString('pt-BR', { timeZone: 'America/Sao_Paulo' });
  const linhas: [string, string][] = [
    ['Nome completo', a.nome],
    ['WhatsApp', fmtWhatsapp(a.whatsapp)],
    ['E-mail', a.email],
    ['Cidade', a.cidade],
    ['Tempo de clínica', a.tempo_atuacao],
    ['Atendimentos por semana', String(a.atendimentos_semana)],
    ['Faturamento mensal', a.faturamento_mensal],
    ['Maior desafio hoje', a.maior_desafio],
    ['Modalidade de interesse', a.modalidade],
    ['Como conheceu', a.como_conheceu || '—'],
    ['Enviado em', data],
  ];
  const html = `
  <div style="font-family:Arial,Helvetica,sans-serif;background:#f7f3eb;padding:24px">
    <div style="max-width:600px;margin:auto;background:#fffdf9;border:1px solid #e5ded1;border-radius:16px;padding:28px">
      <div style="font-size:11px;letter-spacing:.14em;text-transform:uppercase;color:#9a5b34;font-weight:800">Mentoria Clínica de Valor</div>
      <h1 style="font-family:Georgia,serif;font-weight:500;color:#173f31;font-size:24px;margin:8px 0 18px">Nova intenção: ${esc(a.nome)}</h1>
      <table style="width:100%;border-collapse:collapse;font-size:14px;color:#1f2521">
        ${linhas.map(([k, v]) => `<tr><td style="padding:9px 10px 9px 0;border-bottom:1px solid #e5ded1;color:#69716b;vertical-align:top;width:40%">${esc(k)}</td><td style="padding:9px 0;border-bottom:1px solid #e5ded1;white-space:pre-wrap">${esc(v)}</td></tr>`).join('')}
      </table>
      <div style="text-align:center;margin-top:24px">
        <a href="${waLink}" style="display:inline-block;background:#173f31;color:#fff;text-decoration:none;font-weight:700;padding:14px 26px;border-radius:999px">Abrir WhatsApp de ${esc(a.nome.split(' ')[0])}</a>
      </div>
      <p style="font-size:12px;color:#69716b;margin:22px 0 0;text-align:center">Mude o status desta intenção em /admin/aplicacoes/ no site.</p>
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

  // Reserva a intenção para envio (uma vez só, e só se for recente).
  const limite = new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString();
  const { data: aplicacao, error: erroReserva } = await supabase
    .from('aplicacoes_mentoria')
    .update({ email_notificacao_em: new Date().toISOString(), email_notificacao_erro: null })
    .eq('id', id)
    .is('email_notificacao_em', null)
    .gte('criado_em', limite)
    .select('id, nome, whatsapp, email, cidade, tempo_atuacao, atendimentos_semana, faturamento_mensal, maior_desafio, modalidade, como_conheceu, criado_em')
    .maybeSingle();

  if (erroReserva) return json({ ok: false, erro: 'falha ao ler a intenção' }, 500);
  if (!aplicacao) return json({ ok: true, enviado: false, motivo: 'já avisada, antiga ou inexistente' });

  const apiKey = Deno.env.get('RESEND_API_KEY');
  const destino = Deno.env.get('MENTORIA_EMAIL_DESTINO') || 'indiaaraujodea@gmail.com';
  const remetente = Deno.env.get('MENTORIA_EMAIL_REMETENTE') || 'Clínica de Valor <onboarding@resend.dev>';

  let erroEnvio: string | null = null;
  if (!apiKey) {
    erroEnvio = 'RESEND_API_KEY não configurada';
  } else {
    const { html, texto } = montarEmail(aplicacao as Aplicacao);
    try {
      const resp = await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: { Authorization: `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({
          from: remetente,
          to: [destino],
          reply_to: aplicacao.email,
          subject: `Nova intenção de mentoria: ${aplicacao.nome} (${aplicacao.modalidade})`,
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
    // Libera a intenção para uma nova tentativa e deixa o erro registrado.
    await supabase.from('aplicacoes_mentoria')
      .update({ email_notificacao_em: null, email_notificacao_erro: erroEnvio })
      .eq('id', id);
    console.error('notificar-mentoria:', erroEnvio);
    return json({ ok: false, enviado: false, erro: 'não foi possível enviar o e-mail' }, 502);
  }

  return json({ ok: true, enviado: true });
});
