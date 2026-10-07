const ICONE_OLHO = '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M1 12s4-7 11-7 11 7 11 7-4 7-11 7-11-7-11-7z"/><circle cx="12" cy="12" r="3"/></svg>';
const ICONE_OLHO_FECHADO = '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M17.94 17.94A10.94 10.94 0 0 1 12 20c-7 0-11-8-11-8a20.3 20.3 0 0 1 5.06-6.06M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a20.4 20.4 0 0 1-2.94 4.12M14.12 14.12a3 3 0 1 1-4.24-4.24"/><path d="M1 1l22 22"/></svg>';

// Envolve um <input type="password"> existente com um botão de olho que
// alterna entre mostrar e ocultar a senha. Não altera o id/valor do input.
export function ativarToggleSenha(inputId) {
  const input = document.getElementById(inputId);
  if (!input || input.dataset.toggleAtivo) return;
  input.dataset.toggleAtivo = '1';

  const wrap = document.createElement('div');
  wrap.style.cssText = 'position:relative;display:flex';
  input.parentNode.insertBefore(wrap, input);
  wrap.appendChild(input);
  input.style.paddingRight = '42px';
  input.style.flex = '1';

  const btn = document.createElement('button');
  btn.type = 'button';
  btn.setAttribute('aria-label', 'Mostrar senha');
  btn.style.cssText = 'position:absolute;right:10px;top:50%;transform:translateY(-50%);background:none;border:none;padding:4px;cursor:pointer;color:#8a8578;display:flex;align-items:center';
  btn.innerHTML = ICONE_OLHO;
  wrap.appendChild(btn);

  btn.addEventListener('click', () => {
    const oculta = input.type === 'password';
    input.type = oculta ? 'text' : 'password';
    btn.innerHTML = oculta ? ICONE_OLHO_FECHADO : ICONE_OLHO;
    btn.setAttribute('aria-label', oculta ? 'Ocultar senha' : 'Mostrar senha');
  });
}
