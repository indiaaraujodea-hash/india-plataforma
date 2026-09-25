import { getSession, getProfile, signOut } from './auth.js';
import { CONTATO_URL } from './site-config.js';

// Componente único do cabeçalho público (Início, Sobre, Produtos, Mentoria,
// Ajuda, Contato, Entrar/Sair) — qualquer página do site que chamar
// montarCabecalhoPublico() usa exatamente o mesmo menu, na mesma ordem, com
// o mesmo comportamento. Mudar o menu no futuro é mudar só este arquivo.
const ESTILO_ID = 'site-header-estilo';
const CSS = `
.ph-fixo{position:sticky;top:0;z-index:50}
.ph-fixo .ph-header{box-shadow:0 1px 0 rgba(23,63,49,.04)}
.ph-header{display:flex;align-items:center;justify-content:space-between;padding:18px 32px;background:var(--ph-bg,#f7f3eb);position:relative;flex-wrap:wrap;gap:14px}
.ph-brand{display:flex;flex-direction:column;text-decoration:none;line-height:1.15}
.ph-brand b{font-family:Georgia,'Cambria',serif;font-size:20px;letter-spacing:.06em;color:var(--ph-ink,#173f31)}
.ph-brand span{font-size:9.5px;letter-spacing:.18em;color:var(--ph-ink,#173f31);opacity:.6}
.ph-hamburger{display:none;background:none;border:none;cursor:pointer;padding:8px;color:var(--ph-ink,#173f31)}
.ph-links{display:flex;align-items:center;gap:22px;flex-wrap:wrap}
.ph-links a{color:var(--ph-ink,#173f31);text-decoration:none;font-size:14px;font-weight:600;white-space:nowrap;cursor:pointer;font-family:Arial,Helvetica,sans-serif}
.ph-entrar{background:var(--ph-accent,#9a5b34);color:#fff!important;padding:11px 22px;border-radius:999px;font-weight:700}
@media(max-width:900px){
  .ph-links{position:absolute;top:100%;left:0;right:0;z-index:30;background:#fdfaf4;flex-direction:column;align-items:stretch;gap:0;max-height:0;overflow:hidden;transition:max-height .25s ease;box-shadow:0 12px 24px rgba(20,20,10,.12);border-radius:0 0 14px 14px}
  .ph-links.ph-aberto{max-height:640px;max-height:calc(100dvh - 90px);overflow-y:auto}
  .ph-links a{padding:16px 24px;border-bottom:1px solid #ece4d4}
  .ph-entrar{border-radius:0;text-align:center}
  .ph-hamburger{display:flex}
  /* celular: logo e botão do menu sempre na mesma linha, cabeçalho baixo (ele fica fixo no topo) */
  .ph-header{padding:12px 18px;flex-wrap:nowrap}
  .ph-brand{min-width:0}
}
@media(max-width:400px){
  .ph-brand b{font-size:18px}
  .ph-brand span{font-size:8.5px;letter-spacing:.12em;white-space:nowrap}
}
`;

function instalarEstilo() {
  if (document.getElementById(ESTILO_ID)) return;
  const style = document.createElement('style');
  style.id = ESTILO_ID;
  style.textContent = CSS;
  document.head.appendChild(style);
}

// container: elemento vazio (ex.: <div id="cabecalhoPublico"></div>) onde o
// cabeçalho será inserido.
// rootPath: caminho relativo até docs/ a partir da página atual ('.' na raiz
// — Home/Login —, '..' nas páginas de 1 nível — Sobre/Calculadora/Compra).
// paginaAtual: 'inicio' faz "Início" e "Produtos" apontarem para âncoras na
// própria página, em vez de navegar para fora dela.
export async function montarCabecalhoPublico({ container, rootPath = '.', paginaAtual = '' }) {
  if (!container) return null;
  instalarEstilo();
  // Menu sempre visível no topo ao rolar (principalmente no celular), para a
  // pessoa achar Produtos/Mentoria de qualquer página. O login tem layout
  // próprio e fica de fora.
  if (paginaAtual !== 'login') container.classList.add('ph-fixo');

  const homeHref = `${rootPath}/inicio/index.html`;
  const itens = [
    { label: 'Início', href: paginaAtual === 'inicio' ? '#' : homeHref },
    { label: 'Sobre', href: `${rootPath}/sobre/index.html` },
    { label: 'Produtos', href: paginaAtual === 'inicio' ? '#produtos' : `${homeHref}#produtos` },
    { label: 'Mentoria', href: `${rootPath}/mentoria/index.html` },
    { label: 'Ajuda', acao: 'ajuda' },
    { label: 'Contato', acao: 'contato' },
  ];

  container.innerHTML = `
    <div class="ph-header">
      <a class="ph-brand" href="${homeHref}"><b>INDIA</b><span>PESSOAS · ENCONTROS · NEGÓCIOS</span></a>
      <button class="ph-hamburger" id="phHamburger" aria-label="Abrir menu" aria-expanded="false">
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M3 6h18M3 12h18M3 18h18"/></svg>
      </button>
      <div class="ph-links" id="phLinks">
        ${itens.map((i) => (i.acao
          ? `<a href="#" data-acao="${i.acao}">${i.label}</a>`
          : `<a href="${i.href}">${i.label}</a>`)).join('')}
        <a class="ph-entrar" href="${rootPath}/login/index.html" id="phEntrar">Entrar</a>
      </div>
    </div>`;

  const phLinks = container.querySelector('#phLinks');
  const phHamburger = container.querySelector('#phHamburger');
  phHamburger.addEventListener('click', function () {
    const aberto = phLinks.classList.toggle('ph-aberto');
    this.setAttribute('aria-expanded', aberto ? 'true' : 'false');
  });
  // Ao tocar num item (ex.: "Produtos" na própria Home), o menu do celular fecha.
  phLinks.addEventListener('click', (e) => {
    if (!e.target.closest('a')) return;
    phLinks.classList.remove('ph-aberto');
    phHamburger.setAttribute('aria-expanded', 'false');
  });

  const session = await getSession();
  const profile = session ? await getProfile(session.user.id) : null;

  const btnEntrar = container.querySelector('#phEntrar');
  if (session) {
    // Logada: atalhos para o ecossistema (mesmo destino padrão do login) e,
    // para admin, para o painel administrativo.
    const atalhos = [`<a href="${rootPath}/mapa/index.html">Minha área</a>`];
    if (profile?.role === 'admin') atalhos.push(`<a href="${rootPath}/admin/index.html">Admin</a>`);
    btnEntrar.insertAdjacentHTML('beforebegin', atalhos.join(''));
    btnEntrar.textContent = 'Sair';
    btnEntrar.href = '#';
    btnEntrar.addEventListener('click', async (e) => {
      e.preventDefault();
      await signOut(`${rootPath}/inicio/index.html`);
    });
  }

  container.querySelector('[data-acao="contato"]').addEventListener('click', (e) => {
    e.preventDefault();
    if (!CONTATO_URL) return;
    window.open(CONTATO_URL, '_blank');
  });

  container.querySelector('[data-acao="ajuda"]').addEventListener('click', async (e) => {
    e.preventDefault();
    if (!session) {
      location.href = `${rootPath}/login/index.html?redirect=${encodeURIComponent('/inicio/index.html')}`;
      return;
    }
    const { abrirModalAjuda } = await import(`${rootPath}/assets/js/ajuda-modal.js`);
    abrirModalAjuda(session, profile);
  });

  return { session, profile };
}
