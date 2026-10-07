-- Seed: diagnostic_fields (catálogo de field_id estáveis do formulário — decisão D8)
--
-- Revisão: as perguntas que pediam metas ("quanto quer faturar/retirar") e
-- percentuais diretos ("% dos 3 maiores pacientes", "% do canal principal")
-- foram substituídas por perguntas de REALIDADE ATUAL e QUANTIDADES que a
-- profissional consegue responder sem cálculo prévio — o sistema deriva os
-- indicadores (margem, concentração de canal) a partir delas.

-- Remove do catálogo os field_id descontinuados (não afeta diagnósticos já
-- respondidos: "respostas" é imutável e continua guardando o que foi enviado).
delete from public.diagnostic_fields
where field_id in ('goal_faturamento', 'goal_retirada', 'max_atendimentos', 'concentracao_top3', 'concentracao_canal');

insert into public.diagnostic_fields (field_id, etapa, ordem, label, tipo) values
  ('respondent_nome', 'identidade', 1, 'Seu nome', 'text'),
  ('respondent_email', 'identidade', 2, 'Seu melhor e-mail', 'email'),
  ('modelo_desejado', 'identidade', 3, 'Qual modelo você deseja hoje?', 'select'),
  ('receita_atual', 'economia_atual', 1, 'Faturamento médio mensal atual', 'number'),
  ('custos_mensais', 'economia_atual', 2, 'Custos fixos mensais da clínica', 'number'),
  ('custos_variaveis', 'economia_atual', 3, 'Custos variáveis mensais, se souber', 'number'),
  ('valor_medio_sessao', 'economia_atual', 4, 'Valor médio por sessão', 'number'),
  ('pacientes_atuais', 'economia_atual', 5, 'Quantidade média de atendimentos por semana', 'number'),
  ('retirada_atual', 'economia_atual', 6, 'Quanto você retira atualmente por mês', 'number'),
  ('capacidade_agenda', 'economia_atual', 7, 'Quantos atendimentos por semana sua agenda comporta hoje (capacidade atual)', 'number'),
  ('pacientes_ativos_total', 'pacientes_canais', 1, 'Quantos pacientes/clientes ativos você tem hoje?', 'number'),
  ('pacientes_concentrados_qtd', 'pacientes_canais', 2, 'Quantos desses pacientes representam uma parte importante da sua receita?', 'number'),
  ('novos_pacientes_3meses', 'pacientes_canais', 3, 'Quantos pacientes novos chegaram nos últimos 3 meses?', 'number'),
  ('canal_indicacao_qtd', 'pacientes_canais', 4, 'Desses novos pacientes, quantos vieram de indicação?', 'number'),
  ('canal_instagram_qtd', 'pacientes_canais', 5, 'Desses novos pacientes, quantos vieram do Instagram/redes sociais?', 'number'),
  ('canal_google_qtd', 'pacientes_canais', 6, 'Desses novos pacientes, quantos vieram do Google/site?', 'number'),
  ('canal_outro_qtd', 'pacientes_canais', 7, 'Desses novos pacientes, quantos vieram de outro canal?', 'number'),
  ('estrutura_contrato', 'estrutura', 1, 'Contrato / acordo terapêutico estruturado', 'checkbox'),
  ('estrutura_prontuario', 'estrutura', 2, 'Prontuário com rotina sustentável', 'checkbox'),
  ('estrutura_cadastro', 'estrutura', 3, 'Cadastro inicial padronizado', 'checkbox'),
  ('estrutura_cancelamento', 'estrutura', 4, 'Política de cancelamento e reagendamento clara', 'checkbox'),
  ('estrutura_reajuste', 'estrutura', 5, 'Regra de reajuste definida', 'checkbox'),
  ('estrutura_agenda_inclui', 'estrutura', 6, 'Agenda inclui prontuário, supervisão e estudo', 'checkbox'),
  ('estrutura_protocolos', 'estrutura', 7, 'Protocolos para situações recorrentes', 'checkbox'),
  ('financas_contas_separadas', 'financas', 1, 'Contas pessoais e da clínica estão separadas', 'checkbox'),
  ('financas_custo_conhecido', 'financas', 2, 'Você sabe o custo mensal real da clínica', 'checkbox'),
  ('financas_retirada_previsivel', 'financas', 3, 'Existe retirada / pró-labore minimamente previsível', 'checkbox'),
  ('financas_reserva', 'financas', 4, 'Existe reserva financeira da clínica', 'checkbox'),
  ('financas_acompanha_indicadores', 'financas', 5, 'Você acompanha faturamento, ticket e ocupação mensalmente', 'checkbox'),
  ('financas_ponto_equilibrio', 'financas', 6, 'Você conhece seu ponto de equilíbrio', 'checkbox'),
  ('pos_publico_claro', 'posicionamento', 1, 'Tenho clareza de quem atendo melhor e em quais contextos meu trabalho faz mais sentido', 'rating'),
  ('pos_diferenciais', 'posicionamento', 2, 'Consigo nomear meus diferenciais sem depender apenas de formação ou abordagem', 'rating'),
  ('pos_presenca_coerente', 'posicionamento', 3, 'Minha presença profissional comunica de forma coerente quem sou e para quem trabalho', 'rating'),
  ('pos_entendem_por_que_agora', 'posicionamento', 4, 'Quem chega entende por que poderia me procurar agora, sem eu precisar explicar tudo no privado', 'rating'),
  ('pos_comunica_valor', 'posicionamento', 5, 'Minha comunicação ajuda a pessoa a perceber adequação e valor, em vez de comparar apenas preço', 'rating'),
  ('acq_sabe_origem', 'captacao', 1, 'Sei de onde vieram meus últimos 10 pacientes / contatos', 'checkbox'),
  ('acq_dois_canais', 'captacao', 2, 'Tenho pelo menos 2 canais ativos de descoberta ou indicação', 'checkbox'),
  ('acq_presenca_clara', 'captacao', 3, 'Minha presença online permite entender rapidamente o que ofereço', 'checkbox'),
  ('acq_rotina_relacionamento', 'captacao', 4, 'Tenho uma rotina de relacionamento / parcerias / presença, não apenas postagens pontuais', 'checkbox'),
  ('acq_primeiro_contato_organizado', 'captacao', 5, 'Meu primeiro contato é organizado e reduz dúvidas sobre funcionamento, formato e próximos passos', 'checkbox'),
  ('acq_nao_depende_uma_fonte', 'captacao', 6, 'A entrada de novos pacientes não depende quase totalmente de uma única pessoa ou fonte', 'checkbox'),
  ('mod_servico_claro', 'modelo', 1, 'Meu serviço principal está claro em formato, público e condições de atendimento', 'rating'),
  ('mod_preco_criterios', 'modelo', 2, 'O preço praticado hoje é sustentado por critérios, e não apenas pelo que acho que o mercado aceita', 'rating'),
  ('mod_novo_servico_resolve', 'modelo', 3, 'Se eu criar outro serviço, sei qual problema de modelo ele resolverá', 'rating'),
  ('mod_agenda_comporta', 'modelo', 4, 'Minha agenda e energia atuais comportam expansão sem comprometer o serviço principal', 'rating'),
  ('energia_desgaste', 'fechamento', 1, 'Como está seu desgaste com a agenda atual?', 'select'),
  ('sensacao_atual', 'fechamento', 2, 'Hoje, qual sensação mais descreve sua clínica?', 'select')

on conflict (field_id) do update set etapa = excluded.etapa, ordem = excluded.ordem, label = excluded.label, tipo = excluded.tipo;