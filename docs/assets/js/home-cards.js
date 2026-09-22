// Cards de produtos da Home (pública e logada): Minha Clínica de Valor,
// Manual da Clínica de Valor (livro comercial — não é o Manual interno) e Mentoria.
import { WHATSAPP_URL, MANUAL_LIVRO_URL, MANUAL_CAPA_IMG } from './site-config.js';

const img = (nome) => new URL(`../img/${nome}`, import.meta.url).href;

// opts.clinicaHref: destino do botão da Clínica (varia entre Home pública e logada).
export function renderHomeCards(container, { clinicaHref }) {
  const manualBtn = MANUAL_LIVRO_URL
    ? `<a class="hp-cta alt" href="${MANUAL_LIVRO_URL}" target="_blank" rel="noopener">Conheça o Manual →</a>`
    : `<span class="hp-cta alt disabled" aria-disabled="true" title="Página do livro ainda não configurada">Conheça o Manual → <small>(em breve)</small></span>`;

  const mentoriaBtn = WHATSAPP_URL
    ? `<a class="hp-cta" href="${WHATSAPP_URL}" target="_blank" rel="noopener">Falar comigo no WhatsApp →</a>`
    : `<span class="hp-cta disabled" aria-disabled="true" title="Link do WhatsApp ainda não configurado">Falar comigo no WhatsApp → <small>(em breve)</small></span>`;

  container.innerHTML = `
    <article class="hp-card">
      <div class="hp-photo hp-photo-clinica" role="img" aria-label="Mesa de trabalho com notebook e caderno de planejamento"></div>
      <div class="hp-body">
        <div class="hp-kicker">Para psicólogas</div>
        <h3>Minha Clínica de Valor</h3>
        <p>Diagnóstico, ferramentas e direcionamento para construir uma clínica sustentável na ACP.</p>
        <a class="hp-cta" href="${clinicaHref}" data-cta="clinica">Conhecer a Clínica de Valor →</a>
      </div>
    </article>

    <article class="hp-card">
      <div class="hp-photo hp-photo-manual">
        <img src="${img(MANUAL_CAPA_IMG)}" alt="Capa do livro Manual da Clínica como Negócio na ACP — India Araújo de Almeida" loading="lazy">
      </div>
      <div class="hp-body">
        <div class="hp-kicker">Livro</div>
        <h3>Manual da Clínica de Valor</h3>
        <p>Estratégias práticas para construir uma clínica sustentável sem perder a essência da Abordagem Centrada na Pessoa.</p>
        ${manualBtn}
      </div>
    </article>

    <article class="hp-card">
      <div class="hp-photo" role="img" aria-label="Duas poltronas frente a frente para um encontro de mentoria" style="background-image:url('${img('card-mentoria.svg')}')"></div>
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
