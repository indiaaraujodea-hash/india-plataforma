-- =========================================================
-- Bloqueio de acesso à plataforma (botão no /admin)
--
-- Bloquear = a cliente não consegue mais entrar (login recusado) e as
-- sessões abertas são encerradas. NADA é apagado: cadastro, diagnósticos,
-- mapa, planos e histórico continuam guardados. Desbloquear devolve o
-- acesso exatamente como estava.
--
-- Usa o próprio "ban" do Supabase Auth (auth.users.banned_until), o mesmo
-- do botão "Ban user" do painel. As funções rodam como SECURITY DEFINER
-- porque o navegador não tem permissão no schema auth; por isso elas
-- checam public.is_admin() antes de qualquer coisa.
--
-- Idempotente: pode rodar de novo no SQL Editor sem problema.
-- =========================================================

create or replace function public.admin_definir_bloqueio_plataforma(p_user_id uuid, p_bloquear boolean)
returns timestamptz
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_ate timestamptz;
begin
  if not public.is_admin() then
    raise exception 'Apenas administradoras podem bloquear ou desbloquear acessos.';
  end if;
  if p_user_id = auth.uid() then
    raise exception 'Você não pode bloquear a sua própria conta.';
  end if;
  if exists (select 1 from public.profiles where id = p_user_id and role = 'admin') then
    raise exception 'Contas de administradora não podem ser bloqueadas por aqui.';
  end if;

  v_ate := case when p_bloquear then '2100-01-01 00:00:00+00'::timestamptz else null end;

  update auth.users set banned_until = v_ate where id = p_user_id;
  if not found then
    raise exception 'Conta não encontrada.';
  end if;

  if p_bloquear then
    -- Encerra as sessões abertas (os refresh tokens caem junto, em cascata).
    delete from auth.sessions where user_id = p_user_id;
  end if;

  return v_ate;
end;
$$;

create or replace function public.admin_status_bloqueio_plataforma()
returns table (user_id uuid, bloqueado boolean, bloqueado_ate timestamptz)
language plpgsql
security definer
set search_path = ''
as $$
begin
  if not public.is_admin() then
    raise exception 'Apenas administradoras podem ver o status de acesso.';
  end if;
  return query
    select u.id, (u.banned_until is not null and u.banned_until > now()), u.banned_until
    from auth.users u;
end;
$$;

revoke all on function public.admin_definir_bloqueio_plataforma(uuid, boolean) from public, anon;
revoke all on function public.admin_status_bloqueio_plataforma() from public, anon;
grant execute on function public.admin_definir_bloqueio_plataforma(uuid, boolean) to authenticated;
grant execute on function public.admin_status_bloqueio_plataforma() to authenticated;
