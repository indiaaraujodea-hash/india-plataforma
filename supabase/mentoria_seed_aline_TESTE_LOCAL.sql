-- SOMENTE PARA O AMBIENTE DE REVISÃO LOCAL. Não rodar em produção.
-- Importa os dados reais da Aline Sampaio da Silva (Forms de 23/09 +
-- números do Plano Mestre), com origem e data por campo, preservando os
-- conflitos em vez de resolvê-los.

insert into public.mentoria_individual (id, nome_completo, email_previsto, user_id, status, cadencia_encontros, iniciada_em, criado_em)
values (
  '00000000-a11e-0000-0000-000000000001',
  'Aline Sampaio da Silva',
  null, -- e-mail real ainda não confirmado pela India; user_id fica null até ativação
  null,
  'ativa',
  'quinzenal',
  '2026-10-01',
  now()
);

insert into public.mentoria_diagnosticos (id, mentoria_id, ciclo, respostas, analise, conflitos, status, gerado_em)
values (
  '00000000-a11e-0000-0000-000000000002',
  '00000000-a11e-0000-0000-000000000001',
  1,
  '{
    "portfolio_servicos": {"valor": [{"servico":"Atendimento clínico","valores":[70,100,120,150,200],"formato":"Presencial e Online","recorrencia":"Único","n_clientes":55,"receita_estimada":"13 mil/14 mil"}], "fonte":"formulario", "data_referencia":"2026-09-23", "confianca":"declarado"},
    "servico_maior_renda": {"valor":"A Clínica","fonte":"formulario","data_referencia":"2026-09-23","confianca":"declarado"},
    "servico_mais_energia": {"valor":"Clínica","fonte":"formulario","data_referencia":"2026-09-23","confianca":"declarado"},
    "depende_um_servico": {"valor": true, "fonte":"formulario","data_referencia":"2026-09-23","confianca":"declarado"},
    "faturamento_medio_2m": {"valor": 14000, "fonte":"formulario","data_referencia":"2026-09-23","confianca":"declarado"},
    "faturamento_maior_6m": {"valor": 90000, "fonte":"formulario","data_referencia":"2026-09-23","confianca":"ambiguo","aviso":"Destoa de todos os outros relatórios financeiros (Organizze/Psicomanager, R$10-18 mil/mês). Não usar em cálculo até confirmar a pergunta/período com a Aline."},
    "faturamento_menor_6m": {"valor": 11000, "fonte":"formulario","data_referencia":"2026-09-23","confianca":"declarado"},
    "receita_fixa_previsivel": {"valor": null, "fonte":"formulario","data_referencia":"2026-09-23","confianca":"ausente","aviso":"Respondeu \"Ainda não sei\""},
    "receita_variavel": {"valor": null, "fonte":"formulario","data_referencia":"2026-09-23","confianca":"ausente","aviso":"Respondeu \"Ainda não sei\""},
    "atendimentos_semana_atual": {"valor":"30 a 40 (faixa, não número único)","fonte":"formulario","data_referencia":"2026-09-23","confianca":"declarado"},
    "capacidade_sustenta_emocional": {"valor": null, "fonte":"formulario","data_referencia":"2026-09-23","confianca":"ausente","aviso":"Respondeu \"Não sei\""},
    "dias_trabalha_semana": {"valor": 6, "fonte":"formulario","data_referencia":"2026-09-23","confianca":"declarado"},
    "tem_limite_definido": {"valor": false, "fonte":"formulario","data_referencia":"2026-09-23","confianca":"declarado"},
    "valor_minimo_cobrado": {"valor": 70, "fonte":"formulario","data_referencia":"2026-09-23","confianca":"declarado"},
    "valor_maximo_cobrado": {"valor": 200, "fonte":"formulario","data_referencia":"2026-09-23","confianca":"declarado"},
    "valor_medio_real": {"valor": 70, "fonte":"formulario","data_referencia":"2026-09-23","confianca":"declarado","aviso":"Não fecha com o faturamento informado (R$13-14mil com 30-40 atendimentos/semana implicaria ticket médio maior). Provável subestimação — a confirmar com a Aline, não corrigido automaticamente."},
    "ultimo_reajuste": {"valor":"Março","fonte":"formulario","data_referencia":"2026-09-23","confianca":"declarado"},
    "tem_regra_reajuste": {"valor": true, "fonte":"formulario","data_referencia":"2026-09-23","confianca":"declarado","aviso":"Regra declarada é anual, mas a própria Aline diz que na prática reajusta a cada dois anos — regra não cumprida."},
    "surpresa_numeros": {"valor": 3, "fonte":"formulario","data_referencia":"2026-09-23","confianca":"declarado"},
    "perfil_atual": {"valor":"Pessoas que precisam muito de ajuda","fonte":"formulario","data_referencia":"2026-09-23","confianca":"declarado"},
    "perfil_desejado": {"valor":"Pessoas que entendem o perfil da terapia","fonte":"formulario","data_referencia":"2026-09-23","confianca":"declarado"},
    "perfil_desgastante": {"valor":"Quem não entende a terapia, paga menos, etc.","fonte":"formulario","data_referencia":"2026-09-23","confianca":"declarado"},
    "autoridade_digital": {"valor": 2, "fonte":"formulario","data_referencia":"2026-09-23","confianca":"declarado","aviso":"Pergunta tratada como escala 1-5 por suposição da Matriz-Mãe — confirmar com a Aline se é isso mesmo que ela quis dizer."},
    "faturamento_almejado": {"valor": 22500, "fonte":"formulario","data_referencia":"2026-09-23","confianca":"declarado","aviso":"Respondeu \"20/25 mil\" — meio da faixa usado como referência, faixa completa preservada no plano."},
    "atendimentos_semana_desejados": {"valor": null, "fonte":"formulario","data_referencia":"2026-09-23","confianca":"ausente","aviso":"Respondeu com horários (seg-qui 14h-20h, sex 9h-18h), não um número — calculado como ~33/semana no Plano Mestre, mas isso é inferência, não resposta direta."},
    "depender_so_clinica": {"valor": true, "fonte":"formulario","data_referencia":"2026-09-23","confianca":"declarado"},
    "outros_servicos_desejo": {"valor":"Ampliar para dançaterapia e outros formatos","fonte":"formulario","data_referencia":"2026-09-23","confianca":"declarado"},
    "dias_semana_desejados": {"valor": 5, "fonte":"formulario","data_referencia":"2026-09-23","confianca":"declarado"},
    "modelo_atual_conduz_objetivo": {"valor": false, "fonte":"formulario","data_referencia":"2026-09-23","confianca":"declarado"},
    "mudancas_90_dias": {"valor":"\"Eu gostaria de muita coisa, mas eu me perco\" — resposta vaga, sem mudança concreta nomeada.","fonte":"formulario","data_referencia":"2026-09-23","confianca":"declarado"},
    "sou_uma_psicologa_que": {"valor":"ama o que faz, sempre tá disponível, gosta de viver esse trabalho","fonte":"formulario","data_referencia":"2026-09-23","confianca":"declarado"},
    "quero_construir_2_anos": {"valor":"gostaria de ser respeitada e ter vida","fonte":"formulario","data_referencia":"2026-09-23","confianca":"declarado"},
    "ajustar_imediatamente": {"valor":"\"Muitas coisas.....\" — resposta vaga, sem prioridade concreta nomeada.","fonte":"formulario","data_referencia":"2026-09-23","confianca":"declarado"},
    "carteira_ativos_confirmado": {"valor": {"ativos":52,"com_agenda_futura":47,"sem_agenda_a_revisar":5}, "fonte":"plano_mestre (cruzamento com relatórios de gestão)","data_referencia":"2026-09-24","confianca":"confirmado"},
    "agendamentos_totais": {"valor": 1009, "fonte":"plano_mestre","data_referencia":"2026-09-24","confianca":"confirmado"},
    "presencas": {"valor": 694, "fonte":"plano_mestre","data_referencia":"2026-09-24","confianca":"confirmado"},
    "ausencias": {"valor": 70, "fonte":"plano_mestre","data_referencia":"2026-09-24","confianca":"confirmado"},
    "cancelamentos_cliente": {"valor": {"total":199,"percentual":19.7}, "fonte":"plano_mestre","data_referencia":"2026-09-24","confianca":"confirmado","aviso":"Não tratado como receita perdida — não se sabe quantos eram cobrados."},
    "cancelamentos_profissional": {"valor": 40, "fonte":"plano_mestre","data_referencia":"2026-09-24","confianca":"confirmado"},
    "modalidade_atendimento": {"valor": {"online_pct":76.6,"presencial_pct":23.4}, "fonte":"plano_mestre","data_referencia":"2026-09-24","confianca":"confirmado"},
    "google_reputacao": {"valor": {"nota":5.0,"avaliacoes":80}, "fonte":"plano_mestre","data_referencia":"2026-09-24","confianca":"confirmado"},
    "instagram": {"valor": {"seguidores":1582,"posts":36}, "fonte":"plano_mestre","data_referencia":"2026-09-24","confianca":"confirmado"},
    "financeiro_organizze": {"valor": {"jun":14010,"jul":15765,"ago":14825.70,"set_parcial":10135}, "fonte":"plano_mestre (relatório Organizze)","data_referencia":"2026-09-24","confianca":"confirmado"},
    "financeiro_psicomanager": {"valor": "R$13,1 mil a R$18 mil/mês (abr-ago)", "fonte":"plano_mestre (relatório Psicomanager)","data_referencia":"2026-09-24","confianca":"confirmado"},
    "carteira_por_faixa_valor": {"valor": {"70":14,"100":9,"120":6,"150":7,"200":0,"total":36}, "fonte":"plano_mestre (agosto)","data_referencia":"2026-09-24","confianca":"confirmado"}
  }'::jsonb,
  '{
    "demanda_captacao": {
      "conclusao": "Captação ativa, mas concentrada em poucos canais e com autoridade digital autoavaliada baixa.",
      "dado": "9 pacientes novos nos últimos 60 dias; Instagram com 1.582 seguidores e 36 posts; Google com nota 5,0 e 80 avaliações.",
      "conta": "Dado direto — sem cálculo.",
      "data_referencia": "2026-09-23 (novos pacientes, formulário) / 2026-09-24 (Instagram e Google, Plano Mestre)",
      "tipo": "confirmado_e_declarado"
    },
    "conversao": {
      "conclusao": "Sem dado suficiente para medir conversão por canal.",
      "dado": "Não há registro de quantos contatos cada canal gerou nem quantos viraram pacientes.",
      "conta": "—",
      "data_referencia": null,
      "tipo": "ausente",
      "a_confirmar": "Perguntar: quantos contatos por canal (Google, Instagram, indicação) nos últimos 30 dias, e quantos fecharam atendimento."
    },
    "financeiro_caixa": {
      "conclusao": "Faturamento mensal na faixa de R$13 a 18 mil, com uma resposta do formulário (R$90 mil de maior faturamento em 6 meses) que destoa de tudo o mais e não deve ser usada.",
      "dado": "Organizze: jun R$14.010, jul R$15.765, ago R$14.825,70, set (parcial) R$10.135. Psicomanager: abr-ago entre R$13,1 mil e R$18 mil.",
      "conta": "Sem cálculo — números direto dos relatórios.",
      "data_referencia": "2026-09-24 (Plano Mestre, relatórios Organizze/Psicomanager)",
      "tipo": "confirmado",
      "conflito_relacionado": "faturamento_maior_6m (R$90 mil, formulário) — marcado ambíguo, não usado aqui."
    },
    "capacidade_agenda": {
      "conclusao": "Atende 30 a 40 sessões/semana em 6 dias, sem limite definido; agenda-alvo desejada é de ~33/semana em 5 dias.",
      "dado": "1.009 agendamentos totais, 694 presenças, 70 ausências, 199 cancelamentos do cliente (19,7%), 40 cancelamentos profissionais.",
      "conta": "Percentual de cancelamento = 199 / 1.009 = 19,7%.",
      "data_referencia": "2026-09-24 (Plano Mestre)",
      "tipo": "confirmado"
    },
    "concentracao_receita": {
      "conclusao": "Carteira concentrada na faixa de menor valor (R$70): 14 de 36 pacientes mapeados por faixa em agosto.",
      "dado": "R$70: 14 · R$100: 9 · R$120: 6 · R$150: 7 · R$200: 0.",
      "conta": "Soma direta por faixa — sem inferência.",
      "data_referencia": "2026-09-24 (Plano Mestre, coluna Agosto)",
      "tipo": "confirmado"
    },
    "previsibilidade": {
      "conclusao": "Não sabe separar receita fixa de variável; e há um conflito não resolvido sobre o tamanho real da carteira.",
      "dado": "Respondeu \"ainda não sei\" para receita fixa/variável. Carteira: 55 (formulário) vs. 52 ativos / 47 com agenda futura / 5 a revisar (Plano Mestre).",
      "conta": "—",
      "data_referencia": "2026-09-23 (formulário) / 2026-09-24 (Plano Mestre)",
      "tipo": "conflito",
      "a_confirmar": "Conferir os 55 nomes do formulário contra a lista de 52 ativos do sistema de gestão — são a mesma base? A diferença de 3 é gente que saiu, ou erro de contagem?"
    }
  }'::jsonb,
  '[
    {
      "campo": "tamanho_da_carteira",
      "descricao": "Formulário (23/09) diz 55 pacientes. Plano Mestre (análise interna, 24/09) diz 52 ativos, 47 com agenda futura, 5 sem agenda a revisar.",
      "valores": {"formulario": 55, "plano_mestre": {"ativos": 52, "com_agenda_futura": 47, "sem_agenda_a_revisar": 5}},
      "resolvido": false,
      "acao_sugerida": "Perguntar à Aline se os 55 do formulário incluem pacientes já encerrados, ou se é uma contagem diferente da base do sistema de gestão."
    },
    {
      "campo": "faturamento_maior_6m",
      "descricao": "Formulário diz R$90 mil de maior faturamento em 6 meses — nenhum outro relatório (Organizze, Psicomanager) chega perto desse valor (todos entre R$10 e R$18 mil/mês).",
      "valores": {"formulario": 90000, "organizze_psicomanager_faixa": "R$10.135 a R$18.000"},
      "resolvido": false,
      "acao_sugerida": "Confirmar com a Aline: foi engano de digitação, um mês excepcional real, ou ela entendeu a pergunta como faturamento acumulado/anual em vez de mensal?"
    }
  ]'::jsonb,
  'rascunho',
  '2026-09-26 12:00:00-03'
);
