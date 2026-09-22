import test from 'node:test';
import assert from 'node:assert/strict';
import { calcularScoresCompostos, calcularPontosLatentes, classificarManterFortalecerCriar, MOTOR_VERSAO } from '../diagnostico-engine.js';

// pesos idênticos ao seed_pesos.sql (versão 1, ativa)
const PESOS_SEED = [
  { ponto_latente: 'captar', variavel: 'captacao_score', peso: 1 },
  { ponto_latente: 'precificar', variavel: 'financas_score', peso: 1 },
  { ponto_latente: 'posicionar', variavel: 'posicionamento_score', peso: 1 },
  { ponto_latente: 'produto_mix', variavel: 'diversificacao_sinal', peso: 1 },
];

function respostasCompletas(overrides = {}) {
  return {
    respondent_nome: 'Ana',
    respondent_email: 'ana@teste.com',
    capacidade_agenda: 20,
    modelo_desejado: 'individual',
    receita_atual: 6000,
    pacientes_atuais: 12,
    valor_medio_sessao: 150,
    custos_mensais: 1800,
    custos_variaveis: 200,
    retirada_atual: 3000,
    pacientes_ativos_total: 12,
    pacientes_concentrados_qtd: 3,
    novos_pacientes_3meses: 5,
    canal_indicacao_qtd: 2,
    canal_instagram_qtd: 2,
    canal_google_qtd: 0,
    canal_outro_qtd: 1,
    estrutura_contrato: true, estrutura_prontuario: true, estrutura_cadastro: false,
    estrutura_cancelamento: true, estrutura_reajuste: false, estrutura_agenda_inclui: true, estrutura_protocolos: false,
    financas_contas_separadas: true, financas_custo_conhecido: true, financas_retirada_previsivel: false,
    financas_reserva: false, financas_acompanha_indicadores: true, financas_ponto_equilibrio: false,
    pos_publico_claro: 3, pos_diferenciais: 2, pos_presenca_coerente: 3, pos_entendem_por_que_agora: 2, pos_comunica_valor: 3,
    acq_sabe_origem: true, acq_dois_canais: false, acq_presenca_clara: true,
    acq_rotina_relacionamento: false, acq_primeiro_contato_organizado: true, acq_nao_depende_uma_fonte: false,
    mod_servico_claro: 3, mod_preco_criterios: 2, mod_novo_servico_resolve: 3, mod_agenda_comporta: 2,
    energia_desgaste: '100', sensacao_atual: 'Tenho direção, mas preciso organizar prioridades',
    ...overrides,
  };
}

test('scores compostos: dados completos não geram avisos de dado ausente', () => {
  const { valores, avisos } = calcularScoresCompostos(respostasCompletas());
  assert.equal(avisos.length, 0);
  assert.equal(valores.estrutura_score, Math.round((4 / 7) * 100));
  assert.ok(valores.financas_score !== null);
  assert.ok(valores.posicionamento_score !== null);
  assert.equal(valores.diversificacao_sinal, 0); // modelo_desejado = individual
});

test('D9: campo opcional ausente vira "parcial" com aviso, nunca 0 silencioso', () => {
  const respostas = respostasCompletas({ custos_mensais: '' });
  const { valores, statusParcial, avisos } = calcularScoresCompostos(respostas);
  assert.equal(statusParcial.financas, 'parcial');
  assert.ok(avisos.some((a) => a.campo === 'financas'));
  // financas_score ainda existe (baseado no checklist), só não recebeu o modificador de margem
  assert.ok(valores.financas_score !== null);
});

test('D9: rating obrigatório ausente vira null, não 0', () => {
  const respostas = respostasCompletas({ pos_diferenciais: '' });
  const { valores, avisos } = calcularScoresCompostos(respostas);
  assert.equal(valores.posicionamento_score, null);
  assert.ok(avisos.some((a) => a.campo === 'posicionamento'));
});

test('ponto_latente: esteira e escalar ficam "sem_regra_configurada" com os pesos atuais (D2)', () => {
  const r = calcularPontosLatentes(respostasCompletas(), PESOS_SEED);
  assert.equal(r.scores.esteira.status, 'sem_regra_configurada');
  assert.equal(r.scores.esteira.valor, null);
  assert.equal(r.scores.escalar.status, 'sem_regra_configurada');
  assert.equal(r.scores.escalar.valor, null);
});

test('ponto_latente: principal é escolhido só entre os pontos com dado válido', () => {
  const r = calcularPontosLatentes(respostasCompletas(), PESOS_SEED);
  assert.ok(['captar', 'precificar', 'posicionar', 'produto_mix'].includes(r.ponto_latente_principal));
  assert.notEqual(r.ponto_latente_principal, 'esteira');
  assert.notEqual(r.ponto_latente_principal, 'escalar');
  assert.equal(r.status, 'calculado');
  assert.equal(r.motor_versao, MOTOR_VERSAO);
});

test('D3: motor nunca retorna momento_clinica', () => {
  const r = calcularPontosLatentes(respostasCompletas(), PESOS_SEED);
  assert.equal('momento_clinica' in r, false);
});

test('produto_mix vira dados_insuficientes quando modelo_desejado não foi respondido', () => {
  const respostas = respostasCompletas({ modelo_desejado: null });
  const r = calcularPontosLatentes(respostas, PESOS_SEED);
  assert.equal(r.scores.produto_mix.status, 'dados_insuficientes');
  assert.equal(r.scores.produto_mix.valor, null);
});

test('sem nenhum peso configurado, todos os pontos ficam insuficientes e status geral é dados_insuficientes', () => {
  const r = calcularPontosLatentes(respostasCompletas(), []);
  for (const ponto of Object.keys(r.scores)) {
    assert.equal(r.scores[ponto].valor, null);
  }
  assert.equal(r.status, 'dados_insuficientes');
  assert.equal(r.ponto_latente_principal, null);
  assert.equal(r.ponto_latente_complementar, null);
});

test('ranking: ponto com score composto mais alto vira principal (caso controlado)', () => {
  // posicionamento no máximo (4/4 em tudo), captação/finanças no mínimo (tudo desmarcado)
  const respostas = respostasCompletas({
    pos_publico_claro: 4, pos_diferenciais: 4, pos_presenca_coerente: 4, pos_entendem_por_que_agora: 4, pos_comunica_valor: 4,
    acq_sabe_origem: false, acq_dois_canais: false, acq_presenca_clara: false,
    acq_rotina_relacionamento: false, acq_primeiro_contato_organizado: false, acq_nao_depende_uma_fonte: false,
    financas_contas_separadas: false, financas_custo_conhecido: false, financas_retirada_previsivel: false,
    financas_reserva: false, financas_acompanha_indicadores: false, financas_ponto_equilibrio: false,
    modelo_desejado: 'individual',
  });
  const r = calcularPontosLatentes(respostas, PESOS_SEED);
  assert.equal(r.ponto_latente_principal, 'posicionar');
});

test('concentração de canal é derivada das quantidades por canal, não de um percentual direto', () => {
  // 1 canal concentra 8 dos 10 novos pacientes informados por canal => 80% (>=75, penalidade forte)
  const concentrado = respostasCompletas({ canal_indicacao_qtd: 8, canal_instagram_qtd: 1, canal_google_qtd: 1, canal_outro_qtd: 0 });
  const distribuido = respostasCompletas({ canal_indicacao_qtd: 3, canal_instagram_qtd: 3, canal_google_qtd: 2, canal_outro_qtd: 2 });
  const { valores: vConcentrado } = calcularScoresCompostos(concentrado);
  const { valores: vDistribuido } = calcularScoresCompostos(distribuido);
  assert.ok(vConcentrado.captacao_score < vDistribuido.captacao_score);
});

test('sem nenhuma quantidade por canal informada, captação fica "parcial" (nunca inventa concentração)', () => {
  const respostas = respostasCompletas({ canal_indicacao_qtd: null, canal_instagram_qtd: null, canal_google_qtd: null, canal_outro_qtd: null });
  const { statusParcial, avisos } = calcularScoresCompostos(respostas);
  assert.equal(statusParcial.captacao, 'parcial');
  assert.ok(avisos.some((a) => a.campo === 'captacao'));
});

test('financas_score usa custos fixos + variáveis, sem depender de meta de retirada', () => {
  const respostas = respostasCompletas({ receita_atual: 10000, custos_mensais: 2000, custos_variaveis: 1000 });
  const { valores, statusParcial } = calcularScoresCompostos(respostas);
  assert.equal(statusParcial.financas, 'ok');
  assert.ok(valores.financas_score !== null);
});

test('classificarManterFortalecerCriar: checkbox marcado vira MANTER, desmarcado vira CRIAR, ausente não entra em nenhuma coluna', () => {
  const respostas = respostasCompletas({
    financas_reserva: true,
    financas_retirada_previsivel: false,
  });
  delete respostas.financas_ponto_equilibrio;
  const { valores } = calcularScoresCompostos(respostas);
  const { manter, criar } = classificarManterFortalecerCriar(respostas, valores);
  assert.ok(manter.some((i) => i.id === 'financas_reserva'));
  assert.ok(criar.some((i) => i.id === 'financas_retirada_previsivel'));
  assert.ok(!manter.some((i) => i.id === 'financas_ponto_equilibrio'));
  assert.ok(!criar.some((i) => i.id === 'financas_ponto_equilibrio'));
});

test('classificarManterFortalecerCriar: score composto baixo cai em CRIAR, médio em FORTALECER, alto em MANTER', () => {
  const { manter, fortalecer, criar } = classificarManterFortalecerCriar({}, {
    financas_score: 20, captacao_score: 55, posicionamento_score: 90, modelo_score: undefined,
  });
  assert.ok(criar.some((i) => i.id === 'financas_score'));
  assert.ok(fortalecer.some((i) => i.id === 'captacao_score'));
  assert.ok(manter.some((i) => i.id === 'posicionamento_score'));
  assert.ok(!manter.some((i) => i.id === 'modelo_score') && !fortalecer.some((i) => i.id === 'modelo_score') && !criar.some((i) => i.id === 'modelo_score'));
});
