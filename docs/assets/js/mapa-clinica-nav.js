// Barra de navegação secundária, persistente em todas as páginas que
// pertencem à área "Mapa da Clínica" (Visão Geral, Meu Mapa, Meu Plano,
// Acompanhamento, Ferramentas, Manual). Cada aba só reaproveita rotas que já
// existem — nenhuma página nova além da Visão Geral.
const ESTILO_ID = 'mc-subnav-estilo';
const CSS = `
.mc-subnav-wrap{margin:0 0 26px}
.mc-subnav-eyebrow{font-size:11px;font-weight:800;letter-spacing:.14em;text-transform:uppercase;color:var(--terracota,var(--gold,#b58a48));margin-bottom:10px}
.mc-subnav{display:flex;gap:4px;overflow-x:auto;-webkit-overflow-scrolling:touch;border-bottom:1px solid var(--line-soft,#e5ded1);scrollbar-width:thin}
.mc-subnav a{
  flex-shrink:0;font-size:13.5px;font-weight:600;color:var(--muted2,#69716b);text-decoration:none;
  padding:9px 14px;border-bottom:2px solid transparent;white-space:nowrap;
}
.mc-subnav a:hover{color:var(--ink-green,#173f31)}
.mc-subnav a.active{color:var(--ink-green,#173f31);font-weight:700;border-bottom-color:var(--ink-green,#173f31)}
@media(max-width:520px){
  .mc-subnav a{padding:8px 11px;font-size:13px}
}
`;

function instalarEstilo() {
  if (document.getElementById(ESTILO_ID)) return;
  const style = document.createElement('style');
  style.id = ESTILO_ID;
  style.textContent = CSS;
  document.head.appendChild(style);
}

const ABAS = [
  { key: 'visao-geral', label: 'Visão Geral', href: (r) => `${r}/mapa-da-clinica/index.html` },
  { key: 'meu-mapa', label: 'Meu Mapa', href: (r) => `${r}/relatorio/index.html` },
  { key: 'meu-plano', label: 'Meu Plano', href: (r) => `${r}/plano/index.html` },
  { key: 'acompanhamento', label: 'Acompanhamento', href: (r) => `${r}/acompanhamento/index.html` },
  { key: 'ferramentas', label: 'Ferramentas', href: (r) => `${r}/ferramentas/index.html` },
  { key: 'manual', label: 'Manual', href: (r) => `${r}/manual/index.html` },
];

// Chame depois de mountAppShell(). activeKey é uma das chaves em ABAS.
// rootPath é o mesmo caminho relativo já usado no mountAppShell da página.
export function montarSubNavMapaClinica(activeKey, rootPath = '..') {
  instalarEstilo();
  const alvo = document.querySelector('.app-content');
  if (!alvo) return;
  const wrap = document.createElement('div');
  wrap.className = 'mc-subnav-wrap';
  wrap.innerHTML = `
    <div class="mc-subnav-eyebrow">Mapa da Clínica</div>
    <nav class="mc-subnav" aria-label="Navegação do Mapa da Clínica">
      ${ABAS.map((a) => `<a class="${a.key === activeKey ? 'active' : ''}" href="${a.href(rootPath)}">${a.label}</a>`).join('')}
    </nav>`;
  alvo.prepend(wrap);
}
