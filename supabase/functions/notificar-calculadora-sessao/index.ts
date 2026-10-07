// Edge Function: notificar-calculadora-sessao
//
// Chamada pela página /ferramentas/sessao.html logo depois de salvar um
// cálculo em public.calculadora_sessao_resultados. Busca o registro com a
// service role, envia por e-mail (Resend) uma cópia do resultado para o
// próprio e-mail cadastrado da mentorada, e registra o resultado do envio
// na própria linha (email_enviado_em / email_erro).
//
// - O cálculo já está salvo antes desta função rodar: se o e-mail falhar,
//   o resultado continua acessível na plataforma (não bloqueia nada).
// - Só envia uma vez por cálculo: a linha é "reservada" atomicamente
//   (email_enviado_em is null → now()) antes do envio.
// - Só aceita cálculos recentes (última 1 h), para a URL não virar um
//   disparador de e-mails antigos.
//
// Segredos (Supabase → Edge Functions → Secrets) — reaproveita os já usados
// por notificar-mentoria / notificar-compra:
//   RESEND_API_KEY           obrigatório — chave de API do Resend
//   MENTORIA_EMAIL_REMETENTE opcional — padrão: Clínica de Valor <onboarding@resend.dev>
// SUPABASE_URL e SUPABASE_SERVICE_ROLE_KEY já existem em toda Edge Function.
//
// verify_jwt fica desligado pelo mesmo motivo das outras funções (chave
// publicável nova, não é JWT). A função não expõe dados de terceiros: só
// aceita um id de cálculo e envia para o e-mail já cadastrado do dono
// daquele cálculo — nunca para um endereço informado na chamada.

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

const fmt = (n: unknown) => {
  const v = Number(n);
  return isFinite(v) ? 'R$ ' + Math.round(v).toLocaleString('pt-BR') : '—';
};

type Registro = {
  id: string;
  user_id: string;
  respostas: Record<string, unknown>;
  resultado: {
    prolabore?: number; fat?: number; sess?: number | null;
    grpPessoa?: number | null; pagas?: number; agendadas?: number;
  };
  criado_em: string;
};

function montarEmail(r: Registro, nome: string) {
  const res = r.resultado || {};
  const data = new Date(r.criado_em).toLocaleString('pt-BR', { timeZone: 'America/Sao_Paulo' });
  const linhas: [string, string][] = [
    ['Pró-labore desejado', fmt(res.prolabore)],
    ['Faturamento mínimo/mês', fmt(res.fat)],
  ];
  if (res.sess != null) linhas.push(['Valor da sessão individual', fmt(res.sess)]);
  if (res.grpPessoa != null) linhas.push(['Valor por pessoa no grupo', fmt(res.grpPessoa) + ' / mês']);
  linhas.push(['Calculado em', data]);

  const html = `
  <div style="font-family:Arial,Helvetica,sans-serif;background:#f7f3eb;padding:24px">
    <div style="max-width:600px;margin:auto;background:#fffdf9;border:1px solid #e5ded1;border-radius:16px;padding:28px">
      <div style="font-size:11px;letter-spacing:.14em;text-transform:uppercase;color:#9a5b34;font-weight:800">Clínica de Valor</div>
      <h1 style="font-family:Georgia,serif;font-weight:500;color:#173f31;font-size:24px;margin:8px 0 18px">Seu resultado: quanto cobrar</h1>
      <p style="font-size:14px;color:#1f2521">Olá, ${esc(nome.split(' ')[0])}! Aqui está a cópia do resultado que você calculou na plataforma.</p>
      <table style="width:100%;border-collapse:collapse;font-size:14px;color:#1f2521;margin-top:14px">
        ${linhas.map(([k, v]) => `<tr><td style="padding:9px 10px 9px 0;border-bottom:1px solid #e5ded1;color:#69716b;vertical-align:top;width:55%">${esc(k)}</td><td style="padding:9px 0;border-bottom:1px solid #e5ded1;white-space:pre-wrap;font-weight:700">${esc(v)}</td></tr>`).join('')}
      </table>
      <p style="font-size:12px;color:#69716b;margin:22px 0 0;text-align:center">Você pode ver este e todos os seus cálculos anteriores em "Meus cálculos", na plataforma.</p>
    </div>
  </div>`;
  const texto = `Olá, ${nome.split(' ')[0]}!\n\n` + linhas.map(([k, v]) => `${k}: ${v}`).join('\n');
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

  // Reserva o registro para envio (uma vez só, e só se for recente).
  const limite = new Date(Date.now() - 60 * 60 * 1000).toISOString();
  const { data: registro, error: erroReserva } = await supabase
    .from('calculadora_sessao_resultados')
    .update({ email_enviado_em: new Date().toISOString(), email_erro: null })
    .eq('id', id)
    .is('email_enviado_em', null)
    .gte('criado_em', limite)
    .select('id, user_id, respostas, resultado, criado_em')
    .maybeSingle();

  if (erroReserva) return json({ ok: false, erro: 'falha ao ler o cálculo' }, 500);
  if (!registro) return json({ ok: true, enviado: false, motivo: 'já avisado, antigo ou inexistente' });

  const { data: perfil, error: erroPerfil } = await supabase
    .from('profiles')
    .select('email, nome_completo')
    .eq('id', registro.user_id)
    .maybeSingle();

  const apiKey = Deno.env.get('RESEND_API_KEY');
  const remetente = Deno.env.get('MENTORIA_EMAIL_REMETENTE') || 'Clínica de Valor <onboarding@resend.dev>';

  let erroEnvio: string | null = null;
  if (erroPerfil || !perfil?.email) {
    erroEnvio = 'e-mail da mentorada não encontrado';
  } else if (!apiKey) {
    erroEnvio = 'RESEND_API_KEY não configurada';
  } else {
    const { html, texto } = montarEmail(registro as Registro, perfil.nome_completo || 'mentorada');
    try {
      const resp = await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: { Authorization: `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({
          from: remetente,
          to: [perfil.email],
          subject: 'Seu resultado: quanto cobrar — Clínica de Valor',
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
    // Libera o registro para uma nova tentativa e deixa o erro registrado.
    await supabase.from('calculadora_sessao_resultados')
      .update({ email_enviado_em: null, email_erro: erroEnvio })
      .eq('id', id);
    console.error('notificar-calculadora-sessao:', erroEnvio);
    return json({ ok: false, enviado: false, erro: 'não foi possível enviar o e-mail' }, 502);
  }

  return json({ ok: true, enviado: true });
});
