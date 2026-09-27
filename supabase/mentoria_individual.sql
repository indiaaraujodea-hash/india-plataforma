-- =========================================================
-- MENTORIA INDIVIDUAL — em revisão, NÃO RODAR EM PRODUÇÃO ainda.
--
-- Produto separado do "Mapa de 30 Dias" gratuito/self-serve: não altera
-- nenhuma tabela existente (profiles, diagnosticos, planos_acao,
-- diagnostic_fields). Tudo aditivo, em tabelas próprias.
--
-- Decisões desta rodada (confirmadas pela India em 2026-09-26):
-- 1) Lado admin primeiro. Mentorada pode existir sem profiles.id (sem
--    conta ainda) — por isso mentoria_individual.user_id é opcional e só
--    é preenchido quando a conta real for ativada.
-- 2) Dados importados carregam origem + data, nunca são "resolvidos"
--    silenciosamente quando há conflito.
-- 3) Diagnóstico próprio (mentoria_diagnostic_fields), mais completo que
--    o Mapa de 30 Dias — não compartilha tabela com `diagnosticos`.
-- 4) Entrega para a mentorada é sempre o Plano de Ação de 30 dias (até 3
--    prioridades), nunca o documento de análise interna completo.
-- =========================================================

-- ---------------------------------------------------------
-- Registro de mentoria individual. Existe independente de haver conta —
-- user_id é preenchido depois, quando a admin confirmar o e-mail real e
-- a mentorada criar/ativar a conta.
-- ---------------------------------------------------------
create table if not exists public.mentoria_individual (
  id uuid primary key default gen_random_uuid(),
  nome_completo text not null,
  email_previsto text,
  user_id uuid references public.profiles(id),
  status text not null default 'ativa' check (status in ('ativa','pausada','encerrada')),
  cadencia_encontros text not null default 'quinzenal' check (cadencia_encontros in ('semanal','quinzenal')),
  iniciada_em date,
  criado_em timestamptz not null default now(),
  criado_por uuid references public.profiles(id)
);

alter table public.mentoria_individual enable row level security;

drop policy if exists mentoria_individual_admin_all on public.mentoria_individual;
create policy mentoria_individual_admin_all on public.mentoria_individual
  for all using (public.is_admin()) with check (public.is_admin());

drop policy if exists mentoria_individual_select_propria on public.mentoria_individual;
create policy mentoria_individual_select_propria on public.mentoria_individual
  for select using (user_id = auth.uid());

-- ---------------------------------------------------------
-- Diagnóstico da mentoria individual — respostas guardam {valor, fonte,
-- data_referencia, confianca} por campo (não só o valor cru), para que a
-- ficha possa mostrar de onde veio cada dado. `conflitos` guarda os casos
-- em que duas fontes divergem, sem escolher uma.
-- status: rascunho (calculado sozinho) -> revisado (admin editou) ->
-- liberado (mentorada passa a ver).
-- ---------------------------------------------------------
create table if not exists public.mentoria_diagnosticos (
  id uuid primary key default gen_random_uuid(),
  mentoria_id uuid not null references public.mentoria_individual(id) on delete cascade,
  ciclo int not null default 1,
  respostas jsonb not null,
  analise jsonb,
  conflitos jsonb not null default '[]'::jsonb,
  status text not null default 'rascunho' check (status in ('rascunho','revisado','liberado')),
  gerado_em timestamptz not null default now(),
  revisado_em timestamptz,
  revisado_por uuid references public.profiles(id),
  liberado_em timestamptz,
  liberado_por uuid references public.profiles(id),
  unique (mentoria_id, ciclo)
);

alter table public.mentoria_diagnosticos enable row level security;

drop policy if exists mentoria_diagnosticos_admin_all on public.mentoria_diagnosticos;
create policy mentoria_diagnosticos_admin_all on public.mentoria_diagnosticos
  for all using (public.is_admin()) with check (public.is_admin());

drop policy if exists mentoria_diagnosticos_select_liberado on public.mentoria_diagnosticos;
create policy mentoria_diagnosticos_select_liberado on public.mentoria_diagnosticos
  for select using (
    status = 'liberado'
    and exists (
      select 1 from public.mentoria_individual m
      where m.id = mentoria_diagnosticos.mentoria_id and m.user_id = auth.uid()
    )
  );

-- ---------------------------------------------------------
-- Plano de ação mensal — o que a mentorada de fato recebe. Até 3
-- prioridades; cada uma com ação/responsável/prazo/indicador/linha de
-- base/critério de conclusão (armazenadas no array `prioridades`).
-- ---------------------------------------------------------
create table if not exists public.mentoria_planos_mensais (
  id uuid primary key default gen_random_uuid(),
  mentoria_id uuid not null references public.mentoria_individual(id) on delete cascade,
  diagnostico_id uuid references public.mentoria_diagnosticos(id),
  ciclo int not null default 1,
  prioridades jsonb not null default '[]'::jsonb,
  status text not null default 'rascunho' check (status in ('rascunho','liberado')),
  criado_em timestamptz not null default now(),
  liberado_em timestamptz,
  liberado_por uuid references public.profiles(id),
  unique (mentoria_id, ciclo)
);

alter table public.mentoria_planos_mensais enable row level security;

drop policy if exists mentoria_planos_admin_all on public.mentoria_planos_mensais;
create policy mentoria_planos_admin_all on public.mentoria_planos_mensais
  for all using (public.is_admin()) with check (public.is_admin());

drop policy if exists mentoria_planos_select_liberado on public.mentoria_planos_mensais;
create policy mentoria_planos_select_liberado on public.mentoria_planos_mensais
  for select using (
    status = 'liberado'
    and exists (
      select 1 from public.mentoria_individual m
      where m.id = mentoria_planos_mensais.mentoria_id and m.user_id = auth.uid()
    )
  );

-- Mentorada pode marcar suas próprias ações como em andamento/concluídas,
-- mas só dentro do plano já liberado — nunca cria ou libera plano.
drop policy if exists mentoria_planos_update_propria on public.mentoria_planos_mensais;
create policy mentoria_planos_update_propria on public.mentoria_planos_mensais
  for update using (
    status = 'liberado'
    and exists (
      select 1 from public.mentoria_individual m
      where m.id = mentoria_planos_mensais.mentoria_id and m.user_id = auth.uid()
    )
  ) with check (status = 'liberado');

-- ---------------------------------------------------------
-- Encontros (2 por mês nesta cadência) — dados que a mentorada também
-- enxerga: check-in de antes do encontro e a notinha de depois (nota
-- 0-10 + insight). Notas privadas da admin ficam em tabela separada,
-- nunca aqui.
-- ---------------------------------------------------------
create table if not exists public.mentoria_encontros (
  id uuid primary key default gen_random_uuid(),
  mentoria_id uuid not null references public.mentoria_individual(id) on delete cascade,
  ciclo int not null default 1,
  numero int not null,
  data_agendada date,
  realizado boolean not null default false,
  checkin_respostas jsonb,
  checkin_em timestamptz,
  nota_pos_encontro int check (nota_pos_encontro between 0 and 10),
  insight_pos_encontro text,
  criado_em timestamptz not null default now()
);

alter table public.mentoria_encontros enable row level security;

drop policy if exists mentoria_encontros_admin_all on public.mentoria_encontros;
create policy mentoria_encontros_admin_all on public.mentoria_encontros
  for all using (public.is_admin()) with check (public.is_admin());

drop policy if exists mentoria_encontros_select_propria on public.mentoria_encontros;
create policy mentoria_encontros_select_propria on public.mentoria_encontros
  for select using (
    exists (
      select 1 from public.mentoria_individual m
      where m.id = mentoria_encontros.mentoria_id and m.user_id = auth.uid()
    )
  );

-- Mentorada só preenche o check-in e a notinha pós-encontro, nunca os
-- outros campos (numero, data_agendada, realizado ficam com a admin).
drop policy if exists mentoria_encontros_update_checkin on public.mentoria_encontros;
create policy mentoria_encontros_update_checkin on public.mentoria_encontros
  for update using (
    exists (
      select 1 from public.mentoria_individual m
      where m.id = mentoria_encontros.mentoria_id and m.user_id = auth.uid()
    )
  ) with check (
    exists (
      select 1 from public.mentoria_individual m
      where m.id = mentoria_encontros.mentoria_id and m.user_id = auth.uid()
    )
  );

-- ---------------------------------------------------------
-- Notas e transcrições privadas — sem NENHUMA policy de select para a
-- mentorada (a ausência de policy já bloqueia, mas o admin_all cobre a
-- admin). Nunca aparecem em nenhuma tela da mentorada.
-- ---------------------------------------------------------
create table if not exists public.mentoria_notas_privadas (
  id uuid primary key default gen_random_uuid(),
  mentoria_id uuid not null references public.mentoria_individual(id) on delete cascade,
  encontro_id uuid references public.mentoria_encontros(id),
  texto text not null,
  criado_em timestamptz not null default now(),
  criado_por uuid references public.profiles(id)
);

alter table public.mentoria_notas_privadas enable row level security;

drop policy if exists mentoria_notas_admin_all on public.mentoria_notas_privadas;
create policy mentoria_notas_admin_all on public.mentoria_notas_privadas
  for all using (public.is_admin()) with check (public.is_admin());

-- ---------------------------------------------------------
-- Definição dos campos do diagnóstico da Mentoria Individual — mais
-- completo que o Mapa de 30 Dias gratuito (portfólio de serviços,
-- janela de 6 meses, capacidade emocional x agenda, declarações
-- estratégicas). Reaproveita o padrão de diagnostic_fields, mas em
-- tabela própria para não misturar produtos.
-- ---------------------------------------------------------
create table if not exists public.mentoria_diagnostic_fields (
  field_id text primary key,
  etapa text not null,
  ordem int not null,
  label text not null,
  tipo text not null check (tipo in ('text','email','number','select','checkbox','rating','textarea','date','tabela')),
  opcoes jsonb
);

alter table public.mentoria_diagnostic_fields enable row level security;

drop policy if exists mentoria_diagnostic_fields_select_auth on public.mentoria_diagnostic_fields;
create policy mentoria_diagnostic_fields_select_auth on public.mentoria_diagnostic_fields
  for select using (auth.uid() is not null);

drop policy if exists mentoria_diagnostic_fields_admin_write on public.mentoria_diagnostic_fields;
create policy mentoria_diagnostic_fields_admin_write on public.mentoria_diagnostic_fields
  for all using (public.is_admin()) with check (public.is_admin());
