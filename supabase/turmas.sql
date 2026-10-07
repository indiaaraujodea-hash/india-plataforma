-- =========================================================
-- TURMAS (Mentoria em Grupo) — reaproveita a estrutura já existente de
-- Mentoria Individual por participante (mentoria_individual,
-- mentoria_diagnosticos, mentoria_planos_mensais, mentoria_notas_privadas).
-- Cada participante da turma é uma linha normal em mentoria_individual,
-- agora com turma_id preenchido. O que é NOVO aqui é só o nível "turma":
-- o registro da turma em si, os encontros compartilhados (todo mundo no
-- mesmo encontro, diferente da Mentoria Individual) e os materiais
-- compartilhados.
-- =========================================================

create table if not exists public.turmas (
  id uuid primary key default gen_random_uuid(),
  nome text not null,
  ciclo int not null default 1,
  observacoes text,
  status text not null default 'ativa' check (status in ('ativa','encerrada')),
  criado_em timestamptz not null default now(),
  criado_por uuid references public.profiles(id)
);

alter table public.turmas enable row level security;

drop policy if exists turmas_admin_all on public.turmas;
create policy turmas_admin_all on public.turmas
  for all using (public.is_admin()) with check (public.is_admin());

-- Participante da turma continua sendo uma mentoria_individual normal
-- (mesmo diagnóstico/plano/encontros/notas privadas já existentes),
-- só ganha o vínculo com a turma.
alter table public.mentoria_individual add column if not exists turma_id uuid references public.turmas(id);

-- select própria da mentoria_individual já cobre o participante ver seus
-- próprios dados quando tiver conta — não precisa de policy nova aqui.

create table if not exists public.turma_encontros (
  id uuid primary key default gen_random_uuid(),
  turma_id uuid not null references public.turmas(id) on delete cascade,
  numero int not null,
  data_agendada date,
  modalidade text check (modalidade in ('online','presencial')),
  observacoes text,
  criado_em timestamptz not null default now()
);

alter table public.turma_encontros enable row level security;

drop policy if exists turma_encontros_admin_all on public.turma_encontros;
create policy turma_encontros_admin_all on public.turma_encontros
  for all using (public.is_admin()) with check (public.is_admin());

drop policy if exists turma_encontros_select_participante on public.turma_encontros;
create policy turma_encontros_select_participante on public.turma_encontros
  for select using (
    exists (
      select 1 from public.mentoria_individual m
      where m.turma_id = turma_encontros.turma_id and m.user_id = auth.uid()
    )
  );

create table if not exists public.turma_materiais (
  id uuid primary key default gen_random_uuid(),
  turma_id uuid not null references public.turmas(id) on delete cascade,
  titulo text not null,
  tipo text,
  url text,
  descricao text,
  criado_em timestamptz not null default now(),
  criado_por uuid references public.profiles(id)
);

alter table public.turma_materiais enable row level security;

drop policy if exists turma_materiais_admin_all on public.turma_materiais;
create policy turma_materiais_admin_all on public.turma_materiais
  for all using (public.is_admin()) with check (public.is_admin());

drop policy if exists turma_materiais_select_participante on public.turma_materiais;
create policy turma_materiais_select_participante on public.turma_materiais
  for select using (
    exists (
      select 1 from public.mentoria_individual m
      where m.turma_id = turma_materiais.turma_id and m.user_id = auth.uid()
    )
  );
