-- Resultados salvos pelas calculadoras de tela única (sessão + grupo juntos):
-- "Quanto preciso cobrar?" (modelo='percentual') e "Calculadora Única"
-- (modelo='frequencia'). Um registro por clique em "Salvar meu resultado".
create table if not exists public.calculadora_unica_resultados (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  modelo text not null check (modelo in ('percentual','frequencia')),
  respostas jsonb not null,
  resultado jsonb not null,
  versao_regra text not null default 'calculadora-unica-v1',
  criado_em timestamptz not null default now()
);

comment on table public.calculadora_unica_resultados is
  'Resultados salvos pelas mentoradas nas calculadoras de tela única (Quanto preciso cobrar? e Calculadora Única). Um registro por clique em "Salvar".';

alter table public.calculadora_unica_resultados enable row level security;

create policy "calculadora_unica_resultados_select_own"
  on public.calculadora_unica_resultados
  for select
  to authenticated
  using (auth.uid() = user_id);

create policy "calculadora_unica_resultados_insert_own"
  on public.calculadora_unica_resultados
  for insert
  to authenticated
  with check (auth.uid() = user_id);
