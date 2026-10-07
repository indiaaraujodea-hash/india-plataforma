-- Histórico de cálculos da calculadora "Quanto preciso cobrar?" (ferramentas/sessao.html).
-- Cada simulação concluída gera uma linha nova (nunca sobrescreve as anteriores).
-- resultado é o valor já calculado no momento do salvamento — o histórico sempre
-- reproduz o que foi salvo, mesmo que as fórmulas da calculadora mudem depois.

create table public.calculadora_sessao_resultados (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id),
  respostas jsonb not null,
  resultado jsonb not null,
  versao_regra text not null default 'sessao-v1',
  criado_em timestamptz not null default now(),
  email_enviado_em timestamptz,
  email_erro text
);

create index calculadora_sessao_resultados_user_id_idx on public.calculadora_sessao_resultados (user_id, criado_em desc);

alter table public.calculadora_sessao_resultados enable row level security;

-- Cada mentorada só vê os próprios cálculos; admin vê todos.
create policy calculadora_sessao_resultados_select on public.calculadora_sessao_resultados
  for select using (user_id = auth.uid() or public.is_admin());

-- Só é possível gravar cálculo em nome de si mesma. Sem policy de update/delete:
-- depois de salvo, o registro é imutável (só a service role poderia alterar).
create policy calculadora_sessao_resultados_insert on public.calculadora_sessao_resultados
  for insert with check (user_id = auth.uid());
