import test from 'node:test';
import assert from 'node:assert/strict';
import { calcularScoresCompostos, calcularPontosLatentes, MOTOR_VERSAO } from '../diagnostico-engine.js';

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
    goal_faturamento: 12000,
    goal_retirada: 8000,
    max_atendimentos: 20,
    modelo_desejado: 'individual',
    receita_atual: 6000,
    pacientes_atuais: 12,
    valor_medio_sessao: 150,
    custos_mensais: 1800,
    concentracao_top3: 30,
    concentracao_canal: 40,
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
