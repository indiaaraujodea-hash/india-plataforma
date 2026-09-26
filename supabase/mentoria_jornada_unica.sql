-- =========================================================
-- MENTORIA INDIVIDUAL — JORNADA ÚNICA (continuação da revisão)
-- Ainda em revisão — NÃO RODAR EM PRODUÇÃO. Depende de
-- mentoria_individual.sql e mentoria_biblioteca_exercicios.sql já
-- aplicados.
--
-- Este arquivo:
-- 1) liga a ativação da Mentoria Individual ao cadastro/login já
--    existente (sem segunda conta);
-- 2) adiciona Aulas (biblioteca + liberação por mentorada);
-- 3) evolui Exercícios para blocos (texto/pergunta/checklist/tabela) e
--    permite exercício ad-hoc (fora da biblioteca) por mentorada;
-- 4) enriquece Encontros com decisões/próximas ações (visíveis à
--    mentorada) além do que já existia;
-- 5) dá suporte ao fechamento mensal (comparar e preparar rascunho do
--    ciclo seguinte).
-- =========================================================

-- ---------------------------------------------------------
-- 1) Vínculo automático de conta — reaproveita o cadastro/login atual.
-- Se alguém cria conta (profiles) com e-mail igual a um
-- mentoria_individual.email_previsto ainda sem user_id, vincula sozinho.
-- Não mexe em handle_new_user() (que já cuida da liberação do Mapa) —
-- trigger separado, para não arriscar a lógica que já funciona.
-- ---------------------------------------------------------
create or replace function public.vincular_mentoria_por_email()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  update public.mentoria_individual
  set user_id = new.id
  where email_previsto = new.email and user_id is null;
  return new;
end;
$$;

drop trigger if exists profiles_vincular_mentoria_trigger on public.profiles;
create trigger profiles_vincular_mentoria_trigger
  after insert on public.profiles
  for each row execute function public.vincular_mentoria_por_email();

-- ---------------------------------------------------------
-- 2) Aulas — biblioteca reutilizável (conteúdo, não dado de cliente) +
-- liberação por mentorada, como já existe para o vínculo de exercícios.
-- ---------------------------------------------------------
create table if not exists public.aulas_biblioteca (
  id uuid primary key default gen_random_uuid(),
  titulo text not null,
  descricao text,
  video_url text,
  arquivo_url text,
  ordem int not null default 0,
  ativo boolean not null default true,
  criado_em timestamptz not null default now(),
  criado_por uuid references public.profiles(id)
);

alter table public.aulas_biblioteca enable row level security;

drop policy if exists aulas_biblioteca_select_auth on public.aulas_biblioteca;
create policy aulas_biblioteca_select_auth on public.aulas_biblioteca
  for select using (auth.uid() is not null);

drop policy if exists aulas_biblioteca_admin_write on public.aulas_biblioteca;
create policy aulas_biblioteca_admin_write on public.aulas_biblioteca
  for all using (public.is_admin()) with check (public.is_admin());

create table if not exists public.mentoria_aulas_liberadas (
  id uuid primary key default gen_random_uuid(),
  mentoria_id uuid not null references public.mentoria_individual(id) on delete cascade,
  aula_id uuid not null references public.aulas_biblioteca(id),
  liberado_em timestamptz not null default now(),
  liberado_por uuid references public.profiles(id),
  unique (mentoria_id, aula_id)
);

alter table public.mentoria_aulas_liberadas enable row level security;

drop policy if exists mentoria_aulas_admin_all on public.mentoria_aulas_liberadas;
create policy mentoria_aulas_admin_all on public.mentoria_aulas_liberadas
  for all using (public.is_admin()) with check (public.is_admin());

drop policy if exists mentoria_aulas_select_propria on public.mentoria_aulas_liberadas;
create policy mentoria_aulas_select_propria on public.mentoria_aulas_liberadas
  for select using (
    exists (select 1 from public.mentoria_individual m where m.id = mentoria_aulas_liberadas.mentoria_id and m.user_id = auth.uid())
  );

-- ---------------------------------------------------------
-- 3) Exercícios — evolução para blocos + ad-hoc por mentorada.
-- `blocos`: array de {tipo: 'texto'|'pergunta'|'checklist'|'tabela', ...}.
-- Mantém `perguntas` (versão anterior) por compatibilidade — quem usa
-- blocos ignora perguntas.
-- exercicio_id vira opcional: quando nulo, é um exercício ad-hoc e o
-- conteúdo mora em `titulo`/`blocos` na própria atribuição.
-- ---------------------------------------------------------
alter table public.exercicios_biblioteca add column if not exists blocos jsonb not null default '[]'::jsonb;

alter table public.mentoria_exercicios_atribuidos alter column exercicio_id drop not null;
alter table public.mentoria_exercicios_atribuidos add column if not exists titulo_adhoc text;
alter table public.mentoria_exercicios_atribuidos add column if not exists blocos_adhoc jsonb;

-- ---------------------------------------------------------
-- 4) Encontros — decisões e próximas ações (visíveis à mentorada,
-- registradas depois do encontro). Notas privadas continuam na tabela
-- separada mentoria_notas_privadas.
-- ---------------------------------------------------------
alter table public.mentoria_encontros add column if not exists decisoes text;
alter table public.mentoria_encontros add column if not exists proximas_acoes text;
alter table public.mentoria_encontros add column if not exists registrado_em timestamptz;
alter table public.mentoria_encontros add column if not exists registrado_por uuid references public.profiles(id);

-- ---------------------------------------------------------
-- 5) Fechamento mensal — marca o ciclo como encerrado e guarda a
-- comparação planejado x realizado (o rascunho do ciclo seguinte é uma
-- nova linha normal em mentoria_diagnosticos/mentoria_planos_mensais,
-- já suportado pela estrutura existente).
-- ---------------------------------------------------------
alter table public.mentoria_diagnosticos add column if not exists encerrado boolean not null default false;
alter table public.mentoria_diagnosticos add column if not exists comparacao_planejado_realizado jsonb;
alter table public.mentoria_diagnosticos add column if not exists encerrado_em timestamptz;
alter table public.mentoria_diagnosticos add column if not exists encerrado_por uuid references public.profiles(id);

-- ---------------------------------------------------------
-- 6) Guarda de campos em Encontros — a mentorada só deve conseguir
-- preencher check-in e nota/insight pós-encontro; agendamento,
-- decisões e próximas ações são só da admin (mesmo padrão já usado em
-- mentoria_exercicios_atribuidos).
-- ---------------------------------------------------------
create or replace function public.mentoria_encontros_bloquear_campos_admin()
returns trigger
language plpgsql
as $$
begin
  if not public.is_admin() then
    if new.numero is distinct from old.numero
       or new.data_agendada is distinct from old.data_agendada
       or new.realizado is distinct from old.realizado
       or new.decisoes is distinct from old.decisoes
       or new.proximas_acoes is distinct from old.proximas_acoes
       or new.registrado_em is distinct from old.registrado_em
       or new.registrado_por is distinct from old.registrado_por
       or new.mentoria_id is distinct from old.mentoria_id
       or new.ciclo is distinct from old.ciclo
    then
      raise exception 'somente administradores podem alterar estes campos do encontro';
    end if;
  end if;
  return new;
end;
$$;

drop trigger if exists mentoria_encontros_bloquear_campos_admin_trigger on public.mentoria_encontros;
create trigger mentoria_encontros_bloquear_campos_admin_trigger
  before update on public.mentoria_encontros
  for each row execute function public.mentoria_encontros_bloquear_campos_admin();

-- ---------------------------------------------------------
-- 7) Guarda de campos em Planos Mensais — a policy mentoria_planos_update_propria
-- (mentoria_individual.sql) já existia e permite a mentorada atualizar o
-- plano liberado, sem nenhuma trava de coluna. Nesta rodada não construímos
-- UI para ela editar prioridades diretamente, mas a policy continua
-- permitindo por API — trava aqui por segurança, mesmo padrão dos guards
-- já usados em exercícios e encontros.
-- ---------------------------------------------------------
create or replace function public.mentoria_planos_bloquear_campos_admin()
returns trigger
language plpgsql
as $$
begin
  if not public.is_admin() then
    if new.mentoria_id is distinct from old.mentoria_id
       or new.diagnostico_id is distinct from old.diagnostico_id
       or new.ciclo is distinct from old.ciclo
       or new.status is distinct from old.status
       or new.liberado_em is distinct from old.liberado_em
       or new.liberado_por is distinct from old.liberado_por
    then
      raise exception 'somente administradores podem alterar estes campos do plano mensal';
    end if;
  end if;
  return new;
end;
$$;

drop trigger if exists mentoria_planos_bloquear_campos_admin_trigger on public.mentoria_planos_mensais;
create trigger mentoria_planos_bloquear_campos_admin_trigger
  before update on public.mentoria_planos_mensais
  for each row execute function public.mentoria_planos_bloquear_campos_admin();
