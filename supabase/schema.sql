-- INDIA · Clínica de Valor — schema Supabase (Auth + Postgres + RLS)
-- Aplicar num projeto Supabase novo (SQL Editor ou `supabase db push`).
-- Idempotente: pode ser reaplicado sem duplicar objetos.

create extension if not exists pgcrypto;

-- =========================================================
-- ENUMS
-- =========================================================

do $$ begin
  create type app_role as enum ('client','admin');
exception when duplicate_object then null; end $$;

do $$ begin
  -- Estágio do negócio. Dimensão SEPARADA do ponto_latente (decisão D3).
  -- Nunca é derivado automaticamente dos pesos históricos (decisão D3) —
  -- fica null ("a definir") até ser definido por um admin ou por regra validada futura.
  create type momento_clinica_enum as enum ('estruturacao','consolidacao','crescimento');
exception when duplicate_object then null; end $$;

do $$ begin
  -- Vocabulário da Matriz-Mãe (decisão D3), não os "7 movimentos" do protótipo antigo.
  create type ponto_latente_enum as enum ('captar','precificar','posicionar','produto_mix','esteira','escalar');
exception when duplicate_object then null; end $$;

do $$ begin
  create type acao_status_enum as enum ('nao_iniciado','em_andamento','concluido');
exception when duplicate_object then null; end $$;

do $$ begin
  create type diagnostico_status_enum as enum ('calculado','dados_insuficientes');
exception when duplicate_object then null; end $$;

do $$ begin
  create type peso_status_enum as enum ('rascunho_referencia_historica','validado');
exception when duplicate_object then null; end $$;

-- =========================================================
-- profiles (1:1 com auth.users)
-- =========================================================

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  role app_role not null default 'client',
  nome_completo text,
  email text,
  telefone text,
  cidade text,
  formacao text,
  ano_formacao int,
  tempo_atuacao text,
  criado_em timestamptz not null default now()
);

-- Liberação manual do Diagnóstico (decisão do produto: acesso controlado pela
-- administradora até existir um fluxo de compra/pagamento). Default bloqueado.
alter table public.profiles add column if not exists diagnostico_liberado boolean not null default false;
alter table public.profiles add column if not exists diagnostico_liberado_em timestamptz;
alter table public.profiles add column if not exists diagnostico_liberado_por uuid references public.profiles(id);

-- Só admin pode alterar os campos de liberação — mesmo que a policy de UPDATE
-- abaixo permita a cliente atualizar seu próprio perfil (nome, telefone etc.),
-- ela nunca pode se autoliberar. Segurança reforçada no banco, não só na tela.
create or replace function public.profiles_bloquear_autoliberacao()
returns trigger
language plpgsql
as $$
begin
  if not public.is_admin() then
    if new.diagnostico_liberado is distinct from old.diagnostico_liberado
       or new.diagnostico_liberado_em is distinct from old.diagnostico_liberado_em
       or new.diagnostico_liberado_por is distinct from old.diagnostico_liberado_por then
      raise exception 'somente administradores podem liberar/bloquear o diagnóstico';
    end if;
  end if;
  return new;
end;
$$;

drop trigger if exists profiles_liberacao_trigger on public.profiles;
create trigger profiles_liberacao_trigger
  before update on public.profiles
  for each row execute function public.profiles_bloquear_autoliberacao();

-- SECURITY DEFINER: evita recursão de RLS ao checar papel dentro de outras policies.
create or replace function public.is_admin()
returns boolean
language sql
security definer
set search_path = public
stable
as $$
  select coalesce((select role = 'admin' from public.profiles where id = auth.uid()), false);
$$;

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, email)
  values (new.id, new.email)
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

alter table public.profiles enable row level security;

drop policy if exists profiles_select_own_or_admin on public.profiles;
create policy profiles_select_own_or_admin on public.profiles
  for select using (id = auth.uid() or public.is_admin());

drop policy if exists profiles_update_own on public.profiles;
create policy profiles_update_own on public.profiles
  for update using (id = auth.uid()) with check (id = auth.uid() and role = 'client');
-- Clientes não podem se autopromover a admin (role travado no with check).
-- Mudança de papel para admin é feita manualmente no banco pela proprietária.

-- Admin precisa poder editar o perfil de QUALQUER cliente (liberar/bloquear
-- diagnóstico, entre outras ações administrativas) — a policy acima só cobre
-- a própria linha do usuário logado.
drop policy if exists profiles_update_admin on public.profiles;
create policy profiles_update_admin on public.profiles
  for update using (public.is_admin()) with check (public.is_admin());

-- =========================================================
-- mensagens_suporte — formulário "Ajuda" (persistido, visível só para admin;
-- não existe envio de e-mail automático nesta versão do app).
-- =========================================================

create table if not exists public.mensagens_suporte (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references public.profiles(id) on delete set null,
  nome text not null,
  email text not null,
  mensagem text not null,
  status text not null default 'novo' check (status in ('novo','respondido')),
  criado_em timestamptz not null default now()
);

alter table public.mensagens_suporte enable row level security;

drop policy if exists suporte_insert_authenticated on public.mensagens_suporte;
create policy suporte_insert_authenticated on public.mensagens_suporte
  for insert with check (auth.role() = 'authenticated');

drop policy if exists suporte_select_admin on public.mensagens_suporte;
create policy suporte_select_admin on public.mensagens_suporte
  for select using (public.is_admin());

drop policy if exists suporte_update_admin on public.mensagens_suporte;
create policy suporte_update_admin on public.mensagens_suporte
  for update using (public.is_admin()) with check (public.is_admin());

-- =========================================================
-- diagnostic_fields — catálogo dos field_id estáveis do formulário (decisão D8)
-- =========================================================

create table if not exists public.diagnostic_fields (
  field_id text primary key,
  etapa text not null,
  ordem int not null,
  label text not null,
  tipo text not null check (tipo in ('text','email','number','select','checkbox','rating','textarea','date'))
);

alter table public.diagnostic_fields enable row level security;

drop policy if exists diagnostic_fields_select_authenticated on public.diagnostic_fields;
create policy diagnostic_fields_select_authenticated on public.diagnostic_fields
  for select using (auth.role() = 'authenticated');

-- =========================================================
-- diagnosticos — histórico por ciclo (uma cliente pode ter vários diagnósticos
-- ao longo do tempo; cada um é imutável e NUNCA sobrescreve o anterior).
-- "Diagnóstico atual" = o de criado_em mais recente para aquele user_id.
-- =========================================================

create table if not exists public.diagnosticos (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  respostas jsonb not null,
  resultado_calculado jsonb,
  motor_versao text,
  status diagnostico_status_enum not null default 'calculado',
  momento_clinica momento_clinica_enum,
  momento_clinica_definido_por uuid references public.profiles(id),
  momento_clinica_definido_em timestamptz,
  criado_em timestamptz not null default now()
);

-- Remove a constraint antiga de "um diagnóstico por vida toda" de projetos já
-- aplicados anteriormente — decisão de produto mudou para permitir novos ciclos
-- (histórico), sem nunca sobrescrever um diagnóstico já existente.
alter table public.diagnosticos drop constraint if exists diagnosticos_user_id_key;

create index if not exists diagnosticos_user_id_criado_em_idx on public.diagnosticos (user_id, criado_em desc);

-- Trava de imutabilidade: "respostas", "user_id" e "criado_em" nunca mudam após o insert,
-- mesmo por admin. Só resultado_calculado/motor_versao/status/momento_clinica* são editáveis
-- (recálculo do motor e definição do Momento da Clínica).
create or replace function public.diagnosticos_bloquear_alteracao_respostas()
returns trigger
language plpgsql
as $$
begin
  if new.respostas is distinct from old.respostas then
    raise exception 'respostas do diagnóstico são imutáveis';
  end if;
  if new.user_id is distinct from old.user_id then
    raise exception 'user_id do diagnóstico é imutável';
  end if;
  if new.criado_em is distinct from old.criado_em then
    raise exception 'criado_em do diagnóstico é imutável';
  end if;
  return new;
end;
$$;

drop trigger if exists diagnosticos_imutavel on public.diagnosticos;
create trigger diagnosticos_imutavel
  before update on public.diagnosticos
  for each row execute function public.diagnosticos_bloquear_alteracao_respostas();

alter table public.diagnosticos enable row level security;

drop policy if exists diagnosticos_select_own_or_admin on public.diagnosticos;
create policy diagnosticos_select_own_or_admin on public.diagnosticos
  for select using (user_id = auth.uid() or public.is_admin());

-- Só pode inserir um novo diagnóstico quem está com o Diagnóstico LIBERADO pela
-- administradora — reforçado aqui no banco, não só escondendo o botão na tela.
drop policy if exists diagnosticos_insert_own on public.diagnosticos;
create policy diagnosticos_insert_own on public.diagnosticos
  for insert with check (
    user_id = auth.uid()
    and exists (
      select 1 from public.profiles p
      where p.id = auth.uid() and p.diagnostico_liberado = true
    )
  );

drop policy if exists diagnosticos_update_own_or_admin on public.diagnosticos;
create policy diagnosticos_update_own_or_admin on public.diagnosticos
  for update using (user_id = auth.uid() or public.is_admin());
-- O que pode de fato mudar num UPDATE é restrito pelo trigger acima, não por esta policy.

-- =========================================================
-- pesos_ponto_latente — motor de pontuação desacoplado/configurável (decisão D2)
-- Pesos históricos da Matriz-Mãe entram só como referência (ativo=false, status=rascunho).
-- Nada aqui é aplicado como regra definitiva até um admin marcar ativo=true e status=validado.
-- =========================================================

create table if not exists public.pesos_ponto_latente (
  id uuid primary key default gen_random_uuid(),
  versao int not null,
  ponto_latente ponto_latente_enum not null,
  variavel text not null,
  peso numeric not null,
  ativo boolean not null default false,
  status peso_status_enum not null default 'rascunho_referencia_historica',
  criado_em timestamptz not null default now(),
  unique (versao, ponto_latente, variavel)
);

alter table public.pesos_ponto_latente enable row level security;

drop policy if exists pesos_select_authenticated on public.pesos_ponto_latente;
create policy pesos_select_authenticated on public.pesos_ponto_latente
  for select using (auth.role() = 'authenticated');

drop policy if exists pesos_admin_write on public.pesos_ponto_latente;
create policy pesos_admin_write on public.pesos_ponto_latente
  for all using (public.is_admin()) with check (public.is_admin());

-- =========================================================
-- pesos_ponto_latente_historico_referencia — matriz de pesos ORIGINAL da Matriz-Mãe
-- (7 "Decisões" × 9 variáveis V1-V9, tal como estava em Pesos_Decisao).
-- Guardada só para consulta/auditoria da proprietária — o motor do app NUNCA lê
-- esta tabela. Não corresponde aos field_id do formulário atual (decisão D1).
-- =========================================================

create table if not exists public.pesos_ponto_latente_historico_referencia (
  decisao_historica text not null,
  variavel_historica text not null,
  peso numeric not null,
  origem text not null default 'Matriz-Mae_v2_FINAL_3.xlsx aba Pesos_Decisao',
  primary key (decisao_historica, variavel_historica)
);

alter table public.pesos_ponto_latente_historico_referencia enable row level security;

drop policy if exists historico_admin_only on public.pesos_ponto_latente_historico_referencia;
create policy historico_admin_only on public.pesos_ponto_latente_historico_referencia
  for select using (public.is_admin());

-- =========================================================
-- pontos_latentes_textos — textos oficiais (MODELOS_RELATORIO_PONTOS_LATENTES.docx)
-- =========================================================

create table if not exists public.pontos_latentes_textos (
  ponto_latente ponto_latente_enum primary key,
  titulo text not null,
  sintese text not null,
  potencias_instrucao text not null,
  o_que_por_tras text not null,
  como_aparece_instrucao text not null,
  por_que_agora text not null,
  caminho_desenvolvimento text not null,
  para_refletir text not null,
  para_compreender_instrucao text not null,
  para_aplicar_instrucao text not null,
  para_avancar text not null
);

alter table public.pontos_latentes_textos enable row level security;

drop policy if exists textos_select_authenticated on public.pontos_latentes_textos;
create policy textos_select_authenticated on public.pontos_latentes_textos
  for select using (auth.role() = 'authenticated');

drop policy if exists textos_admin_write on public.pontos_latentes_textos;
create policy textos_admin_write on public.pontos_latentes_textos
  for all using (public.is_admin()) with check (public.is_admin());

-- =========================================================
-- manual_capitulos — Manual protegido (não pode mais ser HTML público)
-- =========================================================

create table if not exists public.manual_capitulos (
  numero int primary key,
  titulo text not null,
  conteudo_html text not null,
  ordem int not null
);

alter table public.manual_capitulos enable row level security;

-- Cliente só pode ler o(s) capítulo(s) ligados ao Ponto Latente (principal ou
-- complementar) do diagnóstico MAIS RECENTE — nunca de qualquer ciclo antigo,
-- e nunca o Manual inteiro livremente. Admin continua com acesso total.
drop policy if exists manual_select_authenticated on public.manual_capitulos;
drop policy if exists manual_select_permitido on public.manual_capitulos;
create policy manual_select_permitido on public.manual_capitulos
  for select using (
    public.is_admin()
    or exists (
      select 1
      from (
        select resultado_calculado
        from public.diagnosticos
        where user_id = auth.uid()
        order by criado_em desc
        limit 1
      ) d
      join public.ponto_latente_capitulo_map capm
        on capm.capitulo_numero = manual_capitulos.numero
        and capm.status = 'validado'
        and capm.ponto_latente in (
          (d.resultado_calculado->>'ponto_latente_principal')::ponto_latente_enum,
          (d.resultado_calculado->>'ponto_latente_complementar')::ponto_latente_enum
        )
    )
  );

drop policy if exists manual_admin_write on public.manual_capitulos;
create policy manual_admin_write on public.manual_capitulos
  for all using (public.is_admin()) with check (public.is_admin());

-- =========================================================
-- Ponto Latente → Capítulo / Ferramenta
-- Estrutura pronta, mas SEM mapeamento definitivo ainda (doc oficial diz que os
-- placeholders "não substituem essa validação"). Fica vazia/nula até aprovação.
-- =========================================================

create table if not exists public.ponto_latente_capitulo_map (
  ponto_latente ponto_latente_enum primary key,
  capitulo_numero int references public.manual_capitulos(numero),
  status text not null default 'pendente_validacao' check (status in ('pendente_validacao','validado'))
);

alter table public.ponto_latente_capitulo_map enable row level security;

drop policy if exists cap_map_select_authenticated on public.ponto_latente_capitulo_map;
create policy cap_map_select_authenticated on public.ponto_latente_capitulo_map
  for select using (auth.role() = 'authenticated');

drop policy if exists cap_map_admin_write on public.ponto_latente_capitulo_map;
create policy cap_map_admin_write on public.ponto_latente_capitulo_map
  for all using (public.is_admin()) with check (public.is_admin());

create table if not exists public.ponto_latente_ferramenta_map (
  ponto_latente ponto_latente_enum primary key,
  ferramenta text check (ferramenta in ('calculadora_sessao','calculadora_grupo')),
  status text not null default 'pendente_validacao' check (status in ('pendente_validacao','validado'))
);

alter table public.ponto_latente_ferramenta_map enable row level security;

drop policy if exists ferr_map_select_authenticated on public.ponto_latente_ferramenta_map;
create policy ferr_map_select_authenticated on public.ponto_latente_ferramenta_map
  for select using (auth.role() = 'authenticated');

drop policy if exists ferr_map_admin_write on public.ponto_latente_ferramenta_map;
create policy ferr_map_admin_write on public.ponto_latente_ferramenta_map
  for all using (public.is_admin()) with check (public.is_admin());

-- =========================================================
-- planos_acao — Meu Plano de Ação (1:1 com o diagnóstico)
-- =========================================================

create table if not exists public.planos_acao (
  id uuid primary key default gen_random_uuid(),
  diagnostico_id uuid not null unique references public.diagnosticos(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  momento_atual_snapshot momento_clinica_enum,
  ponto_latente_principal_snapshot ponto_latente_enum,
  ponto_latente_complementar_snapshot ponto_latente_enum,
  o_que_resolver_primeiro text,
  resultado_30_dias text,
  como_medir_avanco text,
  primeiro_passo_semana text,
  criado_em timestamptz not null default now(),
  atualizado_em timestamptz not null default now()
);

alter table public.planos_acao enable row level security;

drop policy if exists planos_select_own_or_admin on public.planos_acao;
create policy planos_select_own_or_admin on public.planos_acao
  for select using (user_id = auth.uid() or public.is_admin());

drop policy if exists planos_insert_own on public.planos_acao;
create policy planos_insert_own on public.planos_acao
  for insert with check (user_id = auth.uid());

drop policy if exists planos_update_own on public.planos_acao;
create policy planos_update_own on public.planos_acao
  for update using (user_id = auth.uid()) with check (user_id = auth.uid());

create table if not exists public.planos_acao_itens (
  id uuid primary key default gen_random_uuid(),
  plano_id uuid not null references public.planos_acao(id) on delete cascade,
  ordem int not null check (ordem between 1 and 3),
  descricao text not null,
  prazo date,
  status acao_status_enum not null default 'nao_iniciado',
  concluido_em timestamptz,
  unique (plano_id, ordem)
);

alter table public.planos_acao_itens enable row level security;

drop policy if exists itens_select_own_or_admin on public.planos_acao_itens;
create policy itens_select_own_or_admin on public.planos_acao_itens
  for select using (
    public.is_admin() or exists (
      select 1 from public.planos_acao p
      where p.id = plano_id and p.user_id = auth.uid()
    )
  );

drop policy if exists itens_write_own on public.planos_acao_itens;
create policy itens_write_own on public.planos_acao_itens
  for all using (
    exists (select 1 from public.planos_acao p where p.id = plano_id and p.user_id = auth.uid())
  ) with check (
    exists (select 1 from public.planos_acao p where p.id = plano_id and p.user_id = auth.uid())
  );

create or replace function public.planos_acao_touch()
returns trigger language plpgsql as $$
begin
  new.atualizado_em = now();
  return new;
end;
$$;

drop trigger if exists planos_acao_touch_trigger on public.planos_acao;
create trigger planos_acao_touch_trigger
  before update on public.planos_acao
  for each row execute function public.planos_acao_touch();
