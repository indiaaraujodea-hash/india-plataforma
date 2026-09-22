// Cards de produtos da Home (pública e logada): Minha Clínica de Valor,
// Manual da Clínica de Valor (livro comercial — não é o Manual interno) e Mentoria.
import { WHATSAPP_URL, MANUAL_LIVRO_URL, MANUAL_CAPA_IMG } from './site-config.js';

const img = (nome) => new URL(`../img/${nome}`, import.meta.url).href;

// Botão no estilo da referência: círculo com ícone + texto ao lado.
const SETA = '<span class="hp-ico" aria-hidden="true"><svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M5 12h14M13 6l6 6-6 6"/></svg></span>';
const WHATS = '<span class="hp-ico whats" aria-hidden="true"><svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2a10 10 0 0 0-8.6 15.1L2 22l5-1.3A10 10 0 1 0 12 2zm0 18.2a8.2 8.2 0 0 1-4.2-1.2l-.3-.2-3 .8.8-2.9-.2-.3A8.2 8.2 0 1 1 12 20.2zm4.5-6.1c-.2-.1-1.5-.7-1.7-.8s-.4-.1-.6.1-.7.8-.8 1-.3.2-.5.1a6.7 6.7 0 0 1-3.3-2.9c-.2-.4.2-.4.7-1.3.1-.2 0-.3 0-.4l-.8-1.8c-.2-.5-.4-.4-.6-.4h-.5a1 1 0 0 0-.7.3 3 3 0 0 0-.9 2.2 5.2 5.2 0 0 0 1.1 2.7 11.8 11.8 0 0 0 4.5 4c1.7.7 2.3.8 3.2.6a2.7 2.7 0 0 0 1.8-1.3 2.2 2.2 0 0 0 .2-1.3c-.1-.1-.3-.2-.5-.3z"/></svg></span>';

// opts.clinicaHref: destino do botão da Clínica (varia entre Home pública e logada).
export function renderHomeCards(container, { clinicaHref }) {
  const manualBtn = MANUAL_LIVRO_URL
    ? `<a class="hp-cta" href="${MANUAL_LIVRO_URL}" target="_blank" rel="noopener">${SETA}<span>Conheça o Manual</span></a>`
    : `<span class="hp-cta disabled" aria-disabled="true" title="Página do livro ainda não configurada">${SETA}<span>Conheça o Manual <small>(em breve)</small></span></span>`;

  const mentoriaBtn = WHATSAPP_URL
    ? `<a class="hp-cta" href="${WHATSAPP_URL}" target="_blank" rel="noopener">${WHATS}<span>Falar comigo no WhatsApp</span></a>`
    : `<span class="hp-cta disabled" aria-disabled="true" title="Link do WhatsApp ainda não configurado">${WHATS}<span>Falar comigo no WhatsApp <small>(em breve)</small></span></span>`;

  container.innerHTML = `
    <article class="hp-card">
      <div class="hp-photo"><img src="${img('card-clinica.jpg')}" alt="Poltrona, mesa lateral com livros e planta"></div>
      <div class="hp-body">
        <div class="hp-kicker">Para psicólogas</div>
        <h3>Minha Clínica de Valor</h3>
        <p>Diagnóstico, ferramentas e direcionamento para construir uma clínica sustentável na ACP.</p>
        <a class="hp-cta" href="${clinicaHref}" data-cta="clinica">${SETA}<span>Conhecer a Clínica de Valor</span></a>
      </div>
    </article>

    <article class="hp-card">
      <div class="hp-photo hp-photo-manual">
        <img src="${img(MANUAL_CAPA_IMG)}" alt="Capa do livro Manual da Clínica como Negócio na ACP — India Araújo de Almeida">
      </div>
      <div class="hp-body">
        <div class="hp-kicker">Livro</div>
        <h3>Manual da Clínica de Valor</h3>
        <p>Estratégias práticas para construir uma clínica sustentável sem perder a essência da Abordagem Centrada na Pessoa.</p>
        ${manualBtn}
      </div>
    </article>

    <article class="hp-card">
      <div class="hp-photo"><img src="${img('card-mentoria.jpg')}" alt="Notebook e caderno de planejamento sobre a mesa"></div>
      <div class="hp-body">
        <div class="hp-kicker">Mentoria</div>
        <h3>Encontros ao vivo para os próximos passos da sua clínica</h3>
        <p>Acompanhamento estratégico para transformar diagnóstico em ação, organizar prioridades e avançar com consistência.</p>
        <ul class="hp-list"><li>Mentoria em Grupo</li><li>Mentoria Individual</li></ul>
        ${mentoriaBtn}
      </div>
    </article>`;

  // Se o arquivo da capa ainda não estiver em assets/img, o espaço fica apenas com o fundo neutro (sem texto e sem recriar a capa).
  const capa = container.querySelector('.hp-photo-manual img');
  const marcarPendente = () => capa.parentElement.classList.add('pendente');
  capa.addEventListener('error', marcarPendente);
  if (capa.complete && capa.naturalWidth === 0) marcarPendente();
}
