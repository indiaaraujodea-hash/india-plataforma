-- Campos do diagnóstico da Mentoria Individual, a partir do Caderno
-- Diagnóstico real usado com a Aline. Reutilizável para futuras
-- mentoradas — nenhum campo aqui é específico dela.
insert into public.mentoria_diagnostic_fields (field_id, etapa, ordem, label, tipo, opcoes) values
-- Parte 1 — Raio-X do negócio hoje
('portfolio_servicos', 'raio_x', 1, 'Portfólio de serviços (serviço, valor, formato, recorrência, nº de clientes, receita mensal estimada)', 'tabela', null),
('servico_maior_renda', 'raio_x', 2, 'Qual serviço representa a maior parte da sua renda atual?', 'text', null),
('servico_mais_energia', 'raio_x', 3, 'Qual serviço demanda mais energia e tempo da sua parte?', 'text', null),
('depende_um_servico', 'raio_x', 4, 'Existe uma dependência significativa de um único serviço para a sustentabilidade do negócio?', 'checkbox', null),
('faturamento_medio_2m', 'raio_x', 5, 'Faturamento médio dos últimos 2 meses', 'number', null),
('faturamento_maior_6m', 'raio_x', 6, 'Maior faturamento nos últimos 6 meses', 'number', null),
('faturamento_menor_6m', 'raio_x', 7, 'Menor faturamento nos últimos 6 meses', 'number', null),
('receita_fixa_previsivel', 'raio_x', 8, 'Receita média mensal previsível (fixa)', 'number', null),
('receita_variavel', 'raio_x', 9, 'Receita instável (variável)', 'number', null),
('atendimentos_semana_atual', 'raio_x', 10, 'Quantos atendimentos você realiza por semana atualmente?', 'text', null),
('capacidade_sustenta_emocional', 'raio_x', 11, 'Quantos atendimentos você consegue sustentar emocionalmente por semana?', 'text', null),
('dias_trabalha_semana', 'raio_x', 12, 'Quantos dias você trabalha por semana?', 'number', null),
('tem_limite_definido', 'raio_x', 13, 'Existe um limite máximo de atendimentos/dias definido por você?', 'checkbox', null),
('qual_limite', 'raio_x', 14, 'Se sim, qual é esse limite?', 'text', null),
('valor_minimo_cobrado', 'raio_x', 15, 'Valor mínimo cobrado por serviço', 'number', null),
('valor_maximo_cobrado', 'raio_x', 16, 'Valor máximo cobrado por serviço', 'number', null),
('valor_medio_real', 'raio_x', 17, 'Valor médio real cobrado', 'number', null),
('ultimo_reajuste', 'raio_x', 18, 'Quando foi realizado o último reajuste de valores?', 'text', null),
('tem_regra_reajuste', 'raio_x', 19, 'Existe uma regra clara e definida para o reajuste de preços?', 'checkbox', null),
('qual_regra_reajuste', 'raio_x', 20, 'Se sim, qual é essa regra?', 'text', null),
('surpresa_numeros', 'raio_x', 21, 'De 0 a 5, teve alguma surpresa em descrever os números aqui?', 'rating', null),
-- Parte 2 — Identidade profissional e posicionamento
('motivo_escolha_paciente', 'posicionamento', 1, 'Qual o principal motivo pelo qual seus clientes escolhem seu atendimento?', 'textarea', null),
('perfil_atual', 'posicionamento', 2, 'Qual é o perfil predominante dos pacientes que você atende atualmente?', 'text', null),
('perfil_desejado', 'posicionamento', 3, 'Com qual perfil de paciente você deseja atuar no futuro?', 'text', null),
('perfil_desgastante', 'posicionamento', 4, 'Existe algum perfil de paciente que você considera desgastante ou fora do que deseja?', 'textarea', null),
('autoridade_digital', 'posicionamento', 5, 'Como você avalia sua autoridade digital hoje (redes sociais, conteúdo, visibilidade online)?', 'rating', null),
-- Parte 3 — Visão e mapa de direção
('faturamento_almejado', 'visao', 1, 'Qual é o faturamento mensal que você almeja alcançar?', 'number', null),
('atendimentos_semana_desejados', 'visao', 2, 'Quantos atendimentos semanais você deseja realizar?', 'number', null),
('depender_so_clinica', 'visao', 3, 'Você pretende depender exclusivamente da clínica individual?', 'checkbox', null),
('outros_servicos_desejo', 'visao', 4, 'Deseja ter outros serviços além da clínica individual? Quais?', 'textarea', null),
('dias_semana_desejados', 'visao', 5, 'Quantos dias por semana você deseja trabalhar?', 'number', null),
('modelo_atual_conduz_objetivo', 'visao', 6, 'Seu modelo de negócio atual conduz a esses objetivos?', 'checkbox', null),
('mudancas_90_dias', 'visao', 7, 'Se "Não", quais mudanças precisam ser implementadas nos próximos 90 dias?', 'textarea', null),
-- Parte 4 — Declarações estratégicas
('sou_uma_psicologa_que', 'declaracoes', 1, 'Eu sou uma psicóloga que...', 'textarea', null),
('quero_construir_2_anos', 'declaracoes', 2, 'Nos próximos 2 anos, quero construir...', 'textarea', null),
('ajustar_imediatamente', 'declaracoes', 3, 'Para isso, preciso ajustar imediatamente...', 'textarea', null)
on conflict (field_id) do update set etapa=excluded.etapa, ordem=excluded.ordem, label=excluded.label, tipo=excluded.tipo, opcoes=excluded.opcoes;
