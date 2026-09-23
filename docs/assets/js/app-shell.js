import { getProfile } from './auth.js';
import { supabase } from './supabase-client.js';

const ICONS = {
  home: '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M3 11l9-8 9 8"/><path d="M5 10v10h14V10"/></svg>',
  plan: '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="5" y="3" width="14" height="18" rx="2"/><path d="M9 8h6M9 12h6M9 16h4"/></svg>',
  diag: '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M3 21h18"/><path d="M6 21V10M12 21V4M18 21v-7"/></svg>',
  report: '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M4 4h16v16H4z"/><path d="M8 9h8M8 13h8M8 17h5"/></svg>',
  tools: '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M14.7 6.3a4 4 0 0 1-5.4 5.4L4 17l3 3 5.3-5.3a4 4 0 0 1 5.4-5.4z"/></svg>',
  book: '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"/></svg>',
  evolucao: '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M3 17l6-6 4 4 8-8"/><path d="M14 7h7v7"/></svg>',
  comunidade: '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="9" cy="8" r="3"/><path d="M2 20c0-3.3 3.1-6 7-6s7 2.7 7 6"/><circle cx="17" cy="8" r="2.4"/><path d="M16 14.2c2.7.5 4.8 2.6 5 5.8"/></svg>',
  suporte: '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="9"/><circle cx="12" cy="12" r="3.2"/><path d="M4.9 4.9l4.2 4.2M19.1 4.9l-4.2 4.2M4.9 19.1l4.2-4.2M19.1 19.1l-4.2-4.2"/></svg>',
  admin: '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 2l8 4v6c0 5-3.5 8.5-8 10-4.5-1.5-8-5-8-10V6l8-4z"/></svg>',
  produtos: '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M20.59 13.41 12 22 2 12V2h10z"/><circle cx="6.5" cy="6.5" r="1.5"/></svg>',
  sair: '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><path d="M16 17l5-5-5-5"/><path d="M21 12H9"/></svg>',
  bell: '<svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M18 8a6 6 0 0 0-12 0c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.7 21a2 2 0 0 1-3.4 0"/></svg>',
};

const NAV_ITEMS = [
  { key: 'inicio', label: 'Início', icon: 'home', href: (r) => `${r}/inicio/index.html` },
  { key: 'plano', label: 'Meu Plano', icon: 'plan', href: (r) => `${r}/plano/index.html` },
  { key: 'mapa', label: 'Meu Diagnóstico', icon: 'diag', href: (r) => `${r}/mapa/index.html` },
  { key: 'relatorio', label: 'Meus Relatórios', icon: 'report', href: (r) => `${r}/relatorio/index.html` },
  { key: 'acompanhamento', label: 'Acompanhamento', icon: 'evolucao', href: (r) => `${r}/acompanhamento/index.html` },
  { key: 'ferramentas', label: 'Ferramentas', icon: 'tools', href: (r) => `${r}/ferramentas/index.html` },
  { key: 'manual', label: 'Manual', icon: 'book', href: (r) => `${r}/manual/index.html` },
  { key: 'comunidade', label: 'Comunidade', icon: 'comunidade', disabled: true },
  { key: 'suporte', label: 'Ajuda', icon: 'suporte', action: 'ajuda' },
  // Só leva de volta à Home pública/vitrine (produtos já existente) — não abre
  // loja dentro do ecossistema nem altera permissões/acesso da cliente.
  { key: 'produtos', label: 'Produtos', icon: 'produtos', href: (r) => `${r}/inicio/index.html` },
];

function initials(name) {
  if (!name) return '?';
  const parts = name.trim().split(/\s+/);
  return ((parts[0]?.[0] || '') + (parts[1]?.[0] || '')).toUpperCase() || name[0].toUpperCase();
}

// rootPath: caminho relativo até docs/ a partir da página atual ('.' na Home, '..' nas páginas de 1 nível).
export async function mountAppShell(activeKey, session, rootPath = '..') {
  const profile = await getProfile(session.user.id);
  const nome = profile?.nome_completo || session.user.email || 'Minha conta';

  const navItems = profile?.role === 'admin'
    ? [...NAV_ITEMS, { key: 'admin', label: 'Admin', icon: 'admin', href: (r) => `${r}/admin/index.html` }]
    : NAV_ITEMS;

  const navHtml = navItems.map((item) => {
    if (item.disabled) {
      return `<a class="disabled" title="Em breve">${ICONS[item.icon]}<span>${item.label}</span></a>`;
    }
    if (item.action) {
      return `<a href="#" data-action="${item.action}">${ICONS[item.icon]}<span>${item.label}</span></a>`;
    }
    const activeClass = item.key === activeKey ? ' active' : '';
    return `<a class="${activeClass.trim()}" href="${item.href(rootPath)}">${ICONS[item.icon]}<span>${item.label}</span></a>`;
  }).join('');

  const sidebarHtml = `
    <aside class="app-sidebar">
      <div class="brand-mark"><b>INDIA</b><span>CAFÉ · PESSOAS · NEGÓCIOS</span></div>
      <nav class="app-nav">${navHtml}</nav>
      <a href="#" id="appShellSignOut" class="app-signout">${ICONS.sair}<span>Sair</span></a>
    </aside>`;

  const topbarHtml = `
    <div class="app-topbar">
      <div class="bell">${ICONS.bell}</div>
      <div class="who">
        <div class="avatar">${initials(nome)}</div>
        <div>
          <div class="who-name">${nome}</div>
          <div class="who-sub">Minha conta</div>
        </div>
      </div>
    </div>`;

  const contentWrap = document.createElement('div');
  contentWrap.className = 'app-content';
  while (document.body.firstChild) contentWrap.appendChild(document.body.firstChild);
  // a página já traz seu próprio header.top (nav antigo) — a sidebar o substitui.
  contentWrap.querySelectorAll('header.top').forEach((el) => el.remove());

  const mainWrap = document.createElement('div');
  mainWrap.className = 'app-main';
  mainWrap.insertAdjacentHTML('afterbegin', topbarHtml);
  mainWrap.appendChild(contentWrap);

  document.body.insertAdjacentHTML('afterbegin', `<div class="app-shell">${sidebarHtml}</div>`);
  document.querySelector('.app-shell').appendChild(mainWrap);
  document.body.classList.add('app-shell-active');

  document.getElementById('appShellSignOut').addEventListener('click', async (e) => {
    e.preventDefault();
    await supabase.auth.signOut();
    location.href = `${rootPath}/index.html`;
  });

  const ajudaTrigger = document.querySelector('.app-sidebar [data-action="ajuda"]');
  if (ajudaTrigger) {
    ajudaTrigger.addEventListener('click', async (e) => {
      e.preventDefault();
      const { abrirModalAjuda } = await import(`${rootPath}/assets/js/ajuda-modal.js`);
      abrirModalAjuda(session, profile);
    });
  }
}
