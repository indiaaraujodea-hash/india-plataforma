import { supabase, avisarSupabaseNaoConfigurado } from './supabase-client.js';

export async function getSession() {
  const { data } = await supabase.auth.getSession();
  return data.session || null;
}

// Chame no topo de qualquer página protegida. loginPath é o caminho relativo
// até docs/login/index.html a partir da página atual (normalmente '../login/index.html').
export async function requireAuth(loginPath = '../login/index.html') {
  avisarSupabaseNaoConfigurado();
  const session = await getSession();
  if (!session) {
    const voltar = encodeURIComponent(location.pathname + location.search);
    location.href = `${loginPath}?redirect=${voltar}`;
    return null;
  }
  return session;
}

export async function getProfile(userId) {
  const { data, error } = await supabase.from('profiles').select('*').eq('id', userId).single();
  if (error) { console.error('Erro ao buscar perfil:', error); return null; }
  return data;
}

// Quem pode abrir as Ferramentas (calculadoras exclusivas): admin, quem tem
// diagnostico_liberado (comprou o Mapa de 30 Dias), OU qualquer mentorada
// com mentoria ativa — mesmo quando foi matriculada direto pelo admin, sem
// passar pelo fluxo de compra/diagnóstico (ex.: mentoria em grupo/turma).
export async function temAcessoFerramentas(userId) {
  const profile = await getProfile(userId);
  if (profile?.role === 'admin' || profile?.diagnostico_liberado) return true;
  const { data: mentoria } = await supabase.from('mentoria_individual').select('id').eq('user_id', userId).eq('status', 'ativa').maybeSingle();
  return !!mentoria;
}

// Chame após requireAuth() em páginas admin-only.
export async function requireAdmin(homePath = '../index.html', loginPath = '../login/index.html') {
  const session = await requireAuth(loginPath);
  if (!session) return null;
  const profile = await getProfile(session.user.id);
  if (!profile || profile.role !== 'admin') {
    location.href = homePath;
    return null;
  }
  return { session, profile };
}

export async function signOut(afterPath = '../index.html') {
  await supabase.auth.signOut();
  location.href = afterPath;
}

// Monta a barra de navegação com estado de sessão (nome + sair, ou entrar).
export async function montarNavSessao(navEl, { homePath = '.' } = {}) {
  if (!navEl) return;
  const session = await getSession();
  const el = document.createElement('span');
  el.className = 'nav-session';
  if (session) {
    const profile = await getProfile(session.user.id);
    const nome = profile?.nome_completo || session.user.email;
    el.innerHTML = `<span style="margin-right:10px">${nome}</span><a href="#" id="navSignOut">Sair</a>`;
    navEl.appendChild(el);
    document.getElementById('navSignOut').addEventListener('click', (e) => {
      e.preventDefault();
      signOut(`${homePath}/index.html`);
    });
  } else {
    el.innerHTML = `<a href="${homePath}/login/index.html">Entrar</a>`;
    navEl.appendChild(el);
  }
}
