-- =========================================================
-- BIBLIOTECA DE EXERCÍCIOS — em revisão, NÃO RODAR EM PRODUÇÃO ainda.
-- Continuação de supabase/mentoria_individual.sql — depende dele já
-- estar aplicado (mentoria_individual, mentoria_planos_mensais,
-- mentoria_notas_privadas, is_admin()).
--
-- Biblioteca é reutilizável entre mentoradas (tabela `exercicios_biblioteca`).
-- O vínculo com uma mentorada específica (a uma prioridade do Plano de
-- 30 dias, com prazo e liberação) fica em
-- `mentoria_exercicios_atribuidos` — histórico por ciclo, nunca
-- sobrescrito de um mês para o outro.
-- =========================================================

-- ---------------------------------------------------------
-- Biblioteca reutilizável. Conteúdo não é sensível (é material de
-- trabalho, não dado de cliente) — qualquer usuário autenticado pode
-- ler; só admin cria/edita/arquiva.
-- ---------------------------------------------------------
create table if not exists public.exercicios_biblioteca (
  id uuid primary key default gen_random_uuid(),
  titulo text not null,
  objetivo text,
  instrucoes text,
  link_url text,
  arquivo_url text,
  perguntas jsonb not null default '[]'::jsonb,
  tempo_estimado_min int,
  ativo boolean not null default true,
  criado_em timestamptz not null default now(),
  criado_por uuid references public.profiles(id),
  atualizado_em timestamptz not null default now()
);

alter table public.exercicios_biblioteca enable row level security;

drop policy if exists exercicios_biblioteca_select_auth on public.exercicios_biblioteca;
create policy exercicios_biblioteca_select_auth on public.exercicios_biblioteca
  for select using (auth.uid() is not null);

drop policy if exists exercicios_biblioteca_admin_write on public.exercicios_biblioteca;
create policy exercicios_biblioteca_admin_write on public.exercicios_biblioteca
  for all using (public.is_admin()) with check (public.is_admin());

-- ---------------------------------------------------------
-- Vínculo de um exercício da biblioteca a UMA prioridade do Plano de 30
-- dias de UMA mentorada, num ciclo (mês) específico. `prioridade_idx` é
-- a posição (0, 1 ou 2) dentro do array `prioridades` do plano mensal.
-- status: rascunho (admin ainda ajustando) -> liberado (mentorada vê).
-- `resposta` guarda o que a mentorada enviou; `orientacao_visivel` é o
-- que a admin devolve para ela ver (diferente da nota privada).
-- ---------------------------------------------------------
create table if not exists public.mentoria_exercicios_atribuidos (
  id uuid primary key default gen_random_uuid(),
  mentoria_id uuid not null references public.mentoria_individual(id) on delete cascade,
  plano_id uuid not null references public.mentoria_planos_mensais(id) on delete cascade,
  prioridade_idx int not null check (prioridade_idx >= 0 and prioridade_idx < 3),
  exercicio_id uuid not null references public.exercicios_biblioteca(id),
  ciclo int not null,
  prazo date,
  status text not null default 'rascunho' check (status in ('rascunho','liberado')),
  resposta jsonb,
  respondido_em timestamptz,
  orientacao_visivel text,
  orientacao_em timestamptz,
  criado_em timestamptz not null default now(),
  criado_por uuid references public.profiles(id),
  liberado_em timestamptz,
  liberado_por uuid references public.profiles(id)
);

alter table public.mentoria_exercicios_atribuidos enable row level security;

drop policy if exists mentoria_exercicios_admin_all on public.mentoria_exercicios_atribuidos;
create policy mentoria_exercicios_admin_all on public.mentoria_exercicios_atribuidos
  for all using (public.is_admin()) with check (public.is_admin());

drop policy if exists mentoria_exercicios_select_liberado on public.mentoria_exercicios_atribuidos;
create policy mentoria_exercicios_select_liberado on public.mentoria_exercicios_atribuidos
  for select using (
    status = 'liberado'
    and exists (
      select 1 from public.mentoria_individual m
      where m.id = mentoria_exercicios_atribuidos.mentoria_id and m.user_id = auth.uid()
    )
  );

-- A mentorada só envia a resposta dela; o trigger abaixo bloqueia
-- qualquer tentativa de alterar status/prazo/orientação/vínculo por
-- quem não é admin — mesmo que o cliente tente mandar esses campos.
drop policy if exists mentoria_exercicios_update_resposta on public.mentoria_exercicios_atribuidos;
create policy mentoria_exercicios_update_resposta on public.mentoria_exercicios_atribuidos
  for update using (
    status = 'liberado'
    and exists (
      select 1 from public.mentoria_individual m
      where m.id = mentoria_exercicios_atribuidos.mentoria_id and m.user_id = auth.uid()
    )
  ) with check (status = 'liberado');

create or replace function public.mentoria_exercicios_bloquear_campos_admin()
returns trigger
language plpgsql
as $$
begin
  if not public.is_admin() then
    if new.status is distinct from old.status
       or new.prazo is distinct from old.prazo
       or new.orientacao_visivel is distinct from old.orientacao_visivel
       or new.orientacao_em is distinct from old.orientacao_em
       or new.exercicio_id is distinct from old.exercicio_id
       or new.prioridade_idx is distinct from old.prioridade_idx
       or new.plano_id is distinct from old.plano_id
       or new.mentoria_id is distinct from old.mentoria_id
       or new.ciclo is distinct from old.ciclo
       or new.liberado_em is distinct from old.liberado_em
       or new.liberado_por is distinct from old.liberado_por
    then
      raise exception 'somente administradores podem alterar estes campos do exercício atribuído';
    end if;
  end if;
  return new;
end;
$$;

drop trigger if exists mentoria_exercicios_bloquear_campos_admin_trigger on public.mentoria_exercicios_atribuidos;
create trigger mentoria_exercicios_bloquear_campos_admin_trigger
  before update on public.mentoria_exercicios_atribuidos
  for each row execute function public.mentoria_exercicios_bloquear_campos_admin();

-- ---------------------------------------------------------
-- Notas privadas já existiam (supabase/mentoria_individual.sql) para
-- encontros. Agora podem também referenciar um exercício atribuído
-- específico, para o comentário privado da admin sobre aquela resposta.
-- ---------------------------------------------------------
alter table public.mentoria_notas_privadas
  add column if not exists exercicio_atribuido_id uuid references public.mentoria_exercicios_atribuidos(id);
