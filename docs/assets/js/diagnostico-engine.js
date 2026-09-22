// Motor de diagnóstico — decisões D1/D2/D3/D8/D9 (ver conversa de arquitetura).
//
// - D1: as perguntas usadas aqui são as já aprovadas no app (mapa/index.html),
//   identificadas por field_id estável — nunca por posição de coluna.
// - D2: os pesos que ligam variável → ponto_latente vêm de fora (parâmetro
//   `pesosPorPonto`), lidos de pesos_ponto_latente no Supabase. Este módulo não
//   embute nenhuma regra "definitiva" — é só o mecanismo de cálculo.
// - D3: este módulo NUNCA decide momento_clinica. Só devolve ponto_latente.
// - D9: um campo ausente vira `null`, nunca 0. Cada score final carrega
//   `status: 'ok' | 'parcial' | 'insuficiente'` e a lista de variáveis que
//   faltaram, para a UI poder mostrar isso sem inventar nada.
//
// Módulo puro (sem I/O, sem `window`, sem Supabase) para poder ser testado
// com Node puro — ver docs/assets/js/__tests__/diagnostico-engine.test.mjs.

export const MOTOR_VERSAO = 'engine-v1-provisorio';

function num(v) {
  if (v === null || v === undefined || v === '') return null;
  const n = Number(v);
  return Number.isFinite(n) ? n : null;
}

function clamp(n, a = 0, b = 100) {
  return Math.max(a, Math.min(b, n));
}

function pctChecks(respostas, fieldIds) {
  // Checkbox sempre tem estado definido (marcado/desmarcado) — não existe "ausente" aqui.
  const marcados = fieldIds.filter((id) => respostas[id] === true).length;
  return Math.round((marcados / fieldIds.length) * 100);
}

// Ratings 0-4; se algum estiver ausente (não respondido), a etapa toda fica marcada
// como incompleta em vez de tratar a ausência como nota 0.
function pctRatings(respostas, fieldIds) {
  const valores = fieldIds.map((id) => num(respostas[id]));
  if (valores.some((v) => v === null)) return null;
  const soma = valores.reduce((a, b) => a + b, 0);
  return Math.round((soma / (fieldIds.length * 4)) * 100);
}

const ESTRUTURA_FIELDS = ['estrutura_contrato','estrutura_prontuario','estrutura_cadastro','estrutura_cancelamento','estrutura_reajuste','estrutura_agenda_inclui','estrutura_protocolos'];
const FINANCAS_FIELDS = ['financas_contas_separadas','financas_custo_conhecido','financas_retirada_previsivel','financas_reserva','financas_acompanha_indicadores','financas_ponto_equilibrio'];
const POSICIONAMENTO_FIELDS = ['pos_publico_claro','pos_diferenciais','pos_presenca_coerente','pos_entendem_por_que_agora','pos_comunica_valor'];
const ACQUISITION_FIELDS = ['acq_sabe_origem','acq_dois_canais','acq_presenca_clara','acq_rotina_relacionamento','acq_primeiro_contato_organizado','acq_nao_depende_uma_fonte'];
const MODELO_FIELDS = ['mod_servico_claro','mod_preco_criterios','mod_novo_servico_resolve','mod_agenda_comporta'];

// Cada score composto vem com status + avisos, nunca um número "inventado"
// quando falta dado que a fórmula original (calculate() do mapa/index.html)
// usava como modificador.
export function calcularScoresCompostos(respostas) {
  const avisos = [];

  const estrutura = pctChecks(respostas, ESTRUTURA_FIELDS);

  const financasBase = pctChecks(respostas, FINANCAS_FIELDS);
  const receita = num(respostas.receita_atual);
  const custos = num(respostas.custos_mensais);
  const retiradaDesejada = num(respostas.goal_retirada);
  let financas = financasBase;
  let financasStatus = 'ok';
  if (receita !== null && receita > 0 && custos !== null) {
    const margem = clamp(((receita - custos) / receita) * 100, -100, 100);
    financas = clamp(financas + (margem >= 30 ? 8 : margem < 10 ? -12 : 0));
    if (retiradaDesejada !== null && receita - custos >= retiradaDesejada) financas = clamp(financas + 8);
  } else {
    financasStatus = 'parcial';
    avisos.push({ campo: 'financas', motivo: 'custos_mensais ou receita_atual não informado — modificador de margem não aplicado' });
  }

  const posicionamento = pctRatings(respostas, POSICIONAMENTO_FIELDS);
  if (posicionamento === null) avisos.push({ campo: 'posicionamento', motivo: 'nem todas as notas de posicionamento foram respondidas' });

  const acquisitionBase = pctChecks(respostas, ACQUISITION_FIELDS);
  const channelConc = num(respostas.concentracao_canal);
  let acquisition = acquisitionBase;
  let acquisitionStatus = 'ok';
  if (channelConc !== null) {
    acquisition = clamp(acquisitionBase - (channelConc >= 75 ? 18 : channelConc >= 55 ? 8 : 0));
  } else {
    acquisitionStatus = 'parcial';
    avisos.push({ campo: 'captacao', motivo: 'concentracao_canal não informado — modificador de concentração não aplicado' });
  }

  const modelo = pctRatings(respostas, MODELO_FIELDS);
  if (modelo === null) avisos.push({ campo: 'modelo', motivo: 'nem todas as notas de modelo foram respondidas' });

  const modeloDesejado = respostas.modelo_desejado ?? null;
  const diversificacaoSinal = modeloDesejado === null ? null : (modeloDesejado === 'individual' ? 0 : 100);
  if (diversificacaoSinal === null) avisos.push({ campo: 'produto_mix', motivo: 'modelo_desejado não informado' });

  return {
    valores: {
      captacao_score: acquisition,
      financas_score: financas,
      posicionamento_score: posicionamento,
      modelo_score: modelo,
      estrutura_score: estrutura,
      diversificacao_sinal: diversificacaoSinal,
    },
    statusParcial: { financas: financasStatus, captacao: acquisitionStatus },
    avisos,
  };
}

// pesosPorPonto: [{ ponto_latente, variavel, peso }] (linhas ativas de pesos_ponto_latente)
export function calcularPontosLatentes(respostas, pesosPorPonto) {
  const { valores, avisos } = calcularScoresCompostos(respostas);

  const pontos = ['captar', 'precificar', 'posicionar', 'produto_mix', 'esteira', 'escalar'];
  const scores = {};

  for (const ponto of pontos) {
    const regras = pesosPorPonto.filter((p) => p.ponto_latente === ponto);
    if (regras.length === 0) {
      scores[ponto] = { valor: null, status: 'sem_regra_configurada', variaveis: [] };
      continue;
    }
    let somaPesos = 0;
    let somaPonderada = 0;
    const faltando = [];
    const usadas = [];
    for (const r of regras) {
      const v = valores[r.variavel];
      if (v === null || v === undefined) {
        faltando.push(r.variavel);
        continue;
      }
      somaPonderada += v * r.peso;
      somaPesos += Math.abs(r.peso);
      usadas.push(r.variavel);
    }
    if (usadas.length === 0) {
      scores[ponto] = { valor: null, status: 'dados_insuficientes', variaveis_faltando: faltando };
    } else {
      scores[ponto] = {
        valor: somaPesos > 0 ? somaPonderada / somaPesos : somaPonderada,
        status: faltando.length > 0 ? 'parcial' : 'ok',
        variaveis_usadas: usadas,
        variaveis_faltando: faltando,
      };
    }
  }

  const validos = Object.entries(scores).filter(([, s]) => s.valor !== null);
  validos.sort((a, b) => b[1].valor - a[1].valor);

  const pontoLatentePrincipal = validos[0]?.[0] ?? null;
  const pontoLatenteComplementar = validos[1]?.[0] ?? null;

  return {
    motor_versao: MOTOR_VERSAO,
    status: pontoLatentePrincipal ? 'calculado' : 'dados_insuficientes',
    ponto_latente_principal: pontoLatentePrincipal,
    ponto_latente_complementar: pontoLatenteComplementar,
    scores,
    avisos,
    // momento_clinica NUNCA é definido aqui — decisão D3. Fica a cargo do admin
    // (ou de uma regra validada futura), sempre fora deste motor.
  };
}
