import { supabase } from './supabase-client.js';

let montado = false;

function garantirEstilos() {
  if (document.getElementById('ajudaModalStyles')) return;
  const style = document.createElement('style');
  style.id = 'ajudaModalStyles';
  style.textContent = `
    .ajuda-overlay{position:fixed;inset:0;background:rgba(20,20,10,.45);z-index:9998;display:flex;align-items:center;justify-content:center;padding:20px}
    .ajuda-modal{background:#fff;border-radius:18px;max-width:420px;width:100%;padding:28px;box-shadow:0 30px 60px rgba(20,20,10,.3)}
    .ajuda-modal h2{font-family:Georgia,serif;color:var(--ink-green,#173f31);margin:0 0 6px;font-size:22px}
    .ajuda-modal p.sub{color:var(--muted2,#7a7368);font-size:13px;margin:0 0 18px}
    .ajuda-modal .form-field{margin-bottom:14px}
    .ajuda-modal .form-field label{display:block;font-size:13px;font-weight:700;margin-bottom:5px;color:var(--ink-green,#173f31)}
    .ajuda-modal .form-field input,.ajuda-modal .form-field textarea{width:100%;padding:10px;border:1px solid #ddd2c3;border-radius:10px;font:inherit}
    .ajuda-modal .actions{display:flex;justify-content:flex-end;gap:10px;margin-top:16px}
    .ajuda-modal .fechar{background:none;border:0;color:var(--muted2,#7a7368);cursor:pointer;font-size:13px}
  `;
  document.head.appendChild(style);
}

export function abrirModalAjuda(session, profile) {
  garantirEstilos();
  if (montado) return;
  montado = true;

  const overlay = document.createElement('div');
  overlay.className = 'ajuda-overlay';
  overlay.innerHTML = `
    <div class="ajuda-modal">
      <h2>Como podemos ajudar?</h2>
      <p class="sub">Sua mensagem é registrada e a equipe responde pelo seu e-mail.</p>
      <div id="ajudaMsg"></div>
      <form id="ajudaForm">
        <div class="form-field"><label>Nome</label><input type="text" id="ajudaNome" required></div>
        <div class="form-field"><label>E-mail</label><input type="email" id="ajudaEmail" required></div>
        <div class="form-field"><label>Como podemos ajudar?</label><textarea id="ajudaMensagem" rows="4" required></textarea></div>
        <div class="actions">
          <button type="button" class="fechar" id="ajudaFechar">Cancelar</button>
          <button type="submit" class="btn">Enviar</button>
        </div>
      </form>
    </div>`;
  document.body.appendChild(overlay);

  const fechar = () => { overlay.remove(); montado = false; };
  overlay.addEventListener('click', (e) => { if (e.target === overlay) fechar(); });
  overlay.querySelector('#ajudaFechar').addEventListener('click', fechar);

  const nomeInput = overlay.querySelector('#ajudaNome');
  const emailInput = overlay.querySelector('#ajudaEmail');
  if (profile?.nome_completo) nomeInput.value = profile.nome_completo;
  if (session?.user?.email) emailInput.value = session.user.email;

  overlay.querySelector('#ajudaForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    const msgBox = overlay.querySelector('#ajudaMsg');
    const btn = overlay.querySelector('button[type=submit]');
    btn.disabled = true;
    const { error } = await supabase.from('mensagens_suporte').insert({
      user_id: session?.user?.id || null,
      nome: nomeInput.value.trim(),
      email: emailInput.value.trim(),
      mensagem: overlay.querySelector('#ajudaMensagem').value.trim(),
    });
    btn.disabled = false;
    if (error) {
      msgBox.innerHTML = `<div class="alert alert-error">Não foi possível enviar: ${error.message}</div>`;
      return;
    }
    overlay.querySelector('.ajuda-modal').innerHTML = `
      <h2>Mensagem enviada</h2>
      <p class="sub">Recebemos sua mensagem. Retornaremos pelo seu e-mail.</p>
      <div class="actions"><button type="button" class="btn" id="ajudaOk">Ok</button></div>`;
    overlay.querySelector('#ajudaOk').addEventListener('click', fechar);
  });
}
