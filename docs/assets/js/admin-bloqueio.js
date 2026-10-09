// Bloqueio de acesso à plataforma — peças compartilhadas pelas páginas do /admin
// (Turmas, Mentorias Individuais e ficha da mentorada).
// Bloquear = a pessoa sai na hora e não consegue entrar de novo; nada é apagado.
// Banco: supabase/bloqueio_acesso_plataforma.sql
import { supabase } from './supabase-client.js';

// Map user_id -> { bloqueado, bloqueado_ate }. Devolve null se o SQL não estiver
// aplicado ou a chamada falhar — as páginas seguem funcionando sem o botão.
export async function carregarBloqueios() {
  const { data, error } = await supabase.rpc('admin_status_bloqueio_plataforma');
  if (error) return null;
  const mapa = new Map((data || []).map((r) => [r.user_id, r]));
  // Sua própria conta (ex.: quando você aparece como participante de teste) não ganha botão.
  const { data: { user } } = await supabase.auth.getUser();
  mapa.minhaConta = user?.id || null;
  return mapa;
}

export function estaBloqueada(bloqueios, userId) {
  return !!(bloqueios && userId && bloqueios.get(userId)?.bloqueado);
}

export function badgeAcesso(bloqueios, userId) {
  if (!bloqueios || !userId) return '';
  return estaBloqueada(bloqueios, userId)
    ? '<span style="font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:.04em;padding:4px 10px;border-radius:999px;background:#f6d4d4;color:#8a2020">Bloqueada</span>'
    : '<span style="font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:.04em;padding:4px 10px;border-radius:999px;background:#e7f1ea;color:#245744">Ativa</span>';
}

function escAttr(v) {
  return String(v ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
}

// Botão Bloquear/Desbloquear. Só aparece para quem já tem conta vinculada.
export function botaoBloqueio(bloqueios, userId, nome, estilo = 'padding:7px 14px;font-size:12.5px') {
  if (!bloqueios || !userId || userId === bloqueios.minhaConta) return '';
  const bloqueada = estaBloqueada(bloqueios, userId);
  return `<button type="button" class="btn ${bloqueada ? '' : 'alt'}" data-bloqueio-user="${escAttr(userId)}" data-bloqueio-nome="${escAttr(nome)}" data-bloqueio-acao="${bloqueada ? 'desbloquear' : 'bloquear'}" style="${estilo}">${bloqueada ? 'Desbloquear acesso' : 'Bloquear acesso'}</button>`;
}

// Liga os cliques de todos os botões dentro de `raiz`; chama `aoConcluir` após sucesso.
export function religarBotoesBloqueio(raiz, aoConcluir) {
  raiz.querySelectorAll('[data-bloqueio-user]').forEach((btn) => {
    btn.addEventListener('click', async () => {
      const nome = btn.dataset.bloqueioNome || 'esta pessoa';
      const bloquear = btn.dataset.bloqueioAcao === 'bloquear';
      const ok = confirm(bloquear
        ? `Bloquear o acesso de ${nome} à plataforma?\n\nEla sai agora e não consegue entrar de novo. Nada é apagado — você pode desbloquear quando quiser.`
        : `Desbloquear o acesso de ${nome}?\n\nEla volta a entrar com o mesmo e-mail e senha e encontra tudo como deixou.`);
      if (!ok) return;
      btn.disabled = true;
      const textoAntes = btn.textContent;
      btn.textContent = bloquear ? 'Bloqueando…' : 'Desbloqueando…';
      const { error } = await supabase.rpc('admin_definir_bloqueio_plataforma', { p_user_id: btn.dataset.bloqueioUser, p_bloquear: bloquear });
      if (error) {
        alert(`Não foi possível ${bloquear ? 'bloquear' : 'desbloquear'}: ${error.message}`);
        btn.disabled = false;
        btn.textContent = textoAntes;
        return;
      }
      if (aoConcluir) await aoConcluir();
    });
  });
}
