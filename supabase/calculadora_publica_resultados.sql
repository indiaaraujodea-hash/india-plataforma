-- Histórico de cálculos da calculadora PÚBLICA (docs/calculadora/index.html),
-- separado do histórico da calculadora interna (calculadora_sessao_resultados).
-- Fica vinculado à conta que a pessoa cria/usa para ver o resultado, mas essa
-- conta, por si só, NÃO libera as ferramentas exclusivas da mentoria — isso
-- continua controlado por profiles.diagnostico_liberado (ver gate em
-- ferramentas/index.html, sessao.html, grupo.html, meus-calculos.html).

create table public.calculadora_publica_resultados (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id),
  respostas jsonb not null,
  resultado jsonb not null,
  versao_regra text not null default 'calculadora-publica-v1',
  criado_em timestamptz not null default now()
);

create index calculadora_publica_resultados_user_id_idx on public.calculadora_publica_resultados (user_id, criado_em desc);

alter table public.calculadora_publica_resultados enable row level security;

-- Cada visitante só vê os próprios cálculos; admin vê todos.
create policy calculadora_publica_resultados_select on public.calculadora_publica_resultados
  for select using (user_id = auth.uid() or public.is_admin());

-- Só é possível gravar cálculo em nome de si mesmo. Sem policy de update/delete:
-- depois de salvo, o registro é imutável (só a service role poderia alterar).
create policy calculadora_publica_resultados_insert on public.calculadora_publica_resultados
  for insert with check (user_id = auth.uid());
