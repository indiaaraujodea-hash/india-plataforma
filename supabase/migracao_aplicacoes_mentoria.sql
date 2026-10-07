-- =========================================================
-- aplicacoes_mentoria — formulário de intenção da página /mentoria/.
-- Ninguém compra a mentoria pelo site: cada intenção é lida pela India,
-- que chama a pessoa no WhatsApp e só depois envia o link de inscrição.
--
-- Segurança (RLS): visitantes (anon) e usuárias logadas só podem INSERIR
-- uma intenção nova; ler e mudar o status é só para admin (is_admin()).
-- O aviso por e-mail é feito pela Edge Function notificar-mentoria, que usa
-- a service role e registra o resultado em email_notificacao_em/_erro — se
-- o e-mail falhar, a intenção continua salva.
-- =========================================================
create table if not exists public.aplicacoes_mentoria (
  id uuid primary key default gen_random_uuid(),
  nome text not null check (char_length(btrim(nome)) between 2 and 200),
  -- só dígitos, com DDI 55 + DDD + número (ex.: 5543984257669)
  whatsapp text not null check (whatsapp ~ '^55[0-9]{10,11}$'),
  email text not null check (char_length(email) <= 254 and email ~* '^[^@\s]+@[^@\s]+\.[^@\s]+$'),
  cidade text not null check (char_length(btrim(cidade)) between 2 and 120),
  tempo_atuacao text not null check (tempo_atuacao in ('Menos de 1 ano','1 a 3 anos','3 a 5 anos','Mais de 5 anos')),
  atendimentos_semana integer not null check (atendimentos_semana between 0 and 200),
  faturamento_mensal text not null check (faturamento_mensal in ('Até R$ 3 mil','R$ 3 a 6 mil','R$ 6 a 10 mil','R$ 10 a 15 mil','Acima de R$ 15 mil')),
  maior_desafio text not null check (char_length(btrim(maior_desafio)) between 3 and 3000),
  modalidade text not null check (modalidade in ('Individual','Em grupo','Ainda não sei')),
  como_conheceu text check (como_conheceu is null or como_conheceu in ('Indicação','Calculadora ou Mapa','Evento ou palestra','Outro')),
  consentimento_lgpd boolean not null check (consentimento_lgpd = true),
  status text not null default 'nova' check (status in ('nova','conversa marcada','link enviado','inscrita','não seguiu')),
  criado_em timestamptz not null default now(),
  email_notificacao_em timestamptz,
  email_notificacao_erro text
);

create index if not exists aplicacoes_mentoria_criado_em_idx on public.aplicacoes_mentoria (criado_em desc);

alter table public.aplicacoes_mentoria enable row level security;

-- Visitante só insere uma intenção "nova", sem mexer nos campos de controle.
drop policy if exists aplicacoes_mentoria_insert_publico on public.aplicacoes_mentoria;
create policy aplicacoes_mentoria_insert_publico on public.aplicacoes_mentoria
  for insert to anon, authenticated
  with check (status = 'nova' and email_notificacao_em is null and email_notificacao_erro is null);

drop policy if exists aplicacoes_mentoria_select_admin on public.aplicacoes_mentoria;
create policy aplicacoes_mentoria_select_admin on public.aplicacoes_mentoria
  for select to authenticated using (public.is_admin());

drop policy if exists aplicacoes_mentoria_update_admin on public.aplicacoes_mentoria;
create policy aplicacoes_mentoria_update_admin on public.aplicacoes_mentoria
  for update to authenticated using (public.is_admin()) with check (public.is_admin());

-- Permissões de tabela explícitas (a RLS acima decide as linhas).
revoke all on public.aplicacoes_mentoria from anon, authenticated;
grant insert on public.aplicacoes_mentoria to anon, authenticated;
grant select, update (status) on public.aplicacoes_mentoria to authenticated;
