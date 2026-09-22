-- Seed: pesos_ponto_latente (motor DECOUPLED/configurável — decisão D2)
--
-- Isto NÃO é a metodologia validada. É um mapeamento provisório mínimo,
-- 1 variável por ponto_latente, peso 1, só para permitir testar o fluxo
-- Diagnóstico → Meu Relatório de ponta a ponta enquanto as regras reais
-- não são aprovadas (D1/D2/D3 ainda em validação).
--
-- 'esteira' e 'escalar' propositalmente NÃO têm nenhuma linha aqui: o formulário
-- atual (perguntas preservadas por D1) não coleta nada que sustente essas duas
-- categorias, então o motor deve reportá-las como dado insuficiente, nunca inventar
-- um score. Ver pendências metodológicas na entrega.
--
-- variavel = chave calculada pelo motor (diagnostico-engine.js), NÃO um field_id
-- bruto do formulário — são os mesmos scores compostos 0-100 que o app já calcula
-- hoje (estrutura, finanças, posicionamento, captação, modelo) mais um sinal 0/100
-- de diversificação de serviço, derivado do campo modelo_desejado já existente.

insert into public.pesos_ponto_latente (versao, ponto_latente, variavel, peso, ativo, status) values
  (1, 'captar',      'captacao_score',       1, true, 'rascunho_referencia_historica'),
  (1, 'precificar',  'financas_score',       1, true, 'rascunho_referencia_historica'),
  (1, 'posicionar',  'posicionamento_score', 1, true, 'rascunho_referencia_historica'),
  (1, 'produto_mix', 'diversificacao_sinal', 1, true, 'rascunho_referencia_historica')
on conflict (versao, ponto_latente, variavel) do update set peso = excluded.peso, ativo = excluded.ativo, status = excluded.status;

-- Seed: pesos_ponto_latente_historico_referencia — matriz ORIGINAL da Matriz-Mãe
-- (Matriz-Mae_v2_FINAL_3.xlsx, aba Pesos_Decisao). Guardada só para consulta da
-- proprietária. O motor do app nunca lê esta tabela.

insert into public.pesos_ponto_latente_historico_referencia (decisao_historica, variavel_historica, peso) values
  ('Captar','V1_GapReceita',3), ('Captar','V2_ClientesAtuais',-2), ('Captar','V3_TempoAtuacao',-1),
  ('Captar','V4_DependeUmServico',1), ('Captar','V5_TaxaOcupacao',-1), ('Captar','V6_TemMaisDeUmServico',-1),
  ('Captar','V7_SemRegraReajuste',0), ('Captar','V8_IdentificouDiferencial',0), ('Captar','V9_AutoridadeDigital',1),

  ('Precificar','V1_GapReceita',1), ('Precificar','V2_ClientesAtuais',0), ('Precificar','V3_TempoAtuacao',0),
  ('Precificar','V4_DependeUmServico',0), ('Precificar','V5_TaxaOcupacao',-1), ('Precificar','V6_TemMaisDeUmServico',0),
  ('Precificar','V7_SemRegraReajuste',3), ('Precificar','V8_IdentificouDiferencial',1), ('Precificar','V9_AutoridadeDigital',1),

  ('Posicionar','V1_GapReceita',0), ('Posicionar','V2_ClientesAtuais',0), ('Posicionar','V3_TempoAtuacao',1),
  ('Posicionar','V4_DependeUmServico',3), ('Posicionar','V5_TaxaOcupacao',1), ('Posicionar','V6_TemMaisDeUmServico',0),
  ('Posicionar','V7_SemRegraReajuste',0), ('Posicionar','V8_IdentificouDiferencial',-2), ('Posicionar','V9_AutoridadeDigital',0),

  ('Produto-Vitrine','V1_GapReceita',1), ('Produto-Vitrine','V2_ClientesAtuais',0), ('Produto-Vitrine','V3_TempoAtuacao',0),
  ('Produto-Vitrine','V4_DependeUmServico',1), ('Produto-Vitrine','V5_TaxaOcupacao',0), ('Produto-Vitrine','V6_TemMaisDeUmServico',2),
  ('Produto-Vitrine','V7_SemRegraReajuste',0), ('Produto-Vitrine','V8_IdentificouDiferencial',1), ('Produto-Vitrine','V9_AutoridadeDigital',0),

  ('Mix','V1_GapReceita',1), ('Mix','V2_ClientesAtuais',-1), ('Mix','V3_TempoAtuacao',0),
  ('Mix','V4_DependeUmServico',1), ('Mix','V5_TaxaOcupacao',0), ('Mix','V6_TemMaisDeUmServico',2),
  ('Mix','V7_SemRegraReajuste',0), ('Mix','V8_IdentificouDiferencial',1), ('Mix','V9_AutoridadeDigital',0),

  ('Esteira','V1_GapReceita',0), ('Esteira','V2_ClientesAtuais',1), ('Esteira','V3_TempoAtuacao',1),
  ('Esteira','V4_DependeUmServico',0), ('Esteira','V5_TaxaOcupacao',-1), ('Esteira','V6_TemMaisDeUmServico',2),
  ('Esteira','V7_SemRegraReajuste',0), ('Esteira','V8_IdentificouDiferencial',1), ('Esteira','V9_AutoridadeDigital',1),

  ('Escalar','V1_GapReceita',0), ('Escalar','V2_ClientesAtuais',2), ('Escalar','V3_TempoAtuacao',2),
  ('Escalar','V4_DependeUmServico',0), ('Escalar','V5_TaxaOcupacao',-2), ('Escalar','V6_TemMaisDeUmServico',0),
  ('Escalar','V7_SemRegraReajuste',-1), ('Escalar','V8_IdentificouDiferencial',2), ('Escalar','V9_AutoridadeDigital',2)
on conflict (decisao_historica, variavel_historica) do update set peso = excluded.peso;

-- Seed: ponto_latente_ferramenta_map — só o que o próprio docx de referência confirma;
-- as demais ficam null/pendente até o mapa final ser aprovado (D5 do doc de textos).
insert into public.ponto_latente_ferramenta_map (ponto_latente, ferramenta, status) values
  ('precificar', 'calculadora_sessao', 'pendente_validacao'),
  ('produto_mix', 'calculadora_grupo', 'pendente_validacao'),
  ('captar', null, 'pendente_validacao'),
  ('posicionar', null, 'pendente_validacao'),
  ('esteira', null, 'pendente_validacao'),
  ('escalar', null, 'pendente_validacao')
on conflict (ponto_latente) do update set ferramenta = excluded.ferramenta, status = excluded.status;

-- Seed: ponto_latente_capitulo_map — fica vazia (capitulo_numero null) para as 6 linhas.
-- Não escolho um capítulo específico por conta própria: o doc de referência diz
-- "capítulo validado" sem apontar o número, e isso depende do mapa final aprovado.
insert into public.ponto_latente_capitulo_map (ponto_latente, capitulo_numero, status) values
  ('captar', null, 'pendente_validacao'),
  ('precificar', null, 'pendente_validacao'),
  ('posicionar', null, 'pendente_validacao'),
  ('produto_mix', null, 'pendente_validacao'),
  ('esteira', null, 'pendente_validacao'),
  ('escalar', null, 'pendente_validacao')
on conflict (ponto_latente) do update set status = excluded.status;
