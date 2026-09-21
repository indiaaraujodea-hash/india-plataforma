# MAPA DE INTEGRAÇÃO DA METODOLOGIA — Clínica de Valor / INDIA

Análise dos materiais enviados. Nenhum código foi escrito. Nenhuma regra foi alterada, simplificada ou inventada. Onde uma regra não está explícita, isso é sinalizado na Seção D, não preenchido por suposição.

---

## A. INVENTÁRIO DOS MATERIAIS

Foram recebidos **6 materiais**, que se organizam em 3 camadas cronológicas/funcionais:

| # | Arquivo | Camada |
|---|---|---|
| 1 | `Matriz-Mae_v2_FINAL__1___4_.xlsx` | Motor de decisão v1 (planilha, ligada ao Google Forms) |
| 2 | `MANUAL_DA_CLÍNICA_COMO_NEGÓCIO_NA_ACP_Completo.docx` | Conteúdo/metodologia-mãe (texto) |
| 3 | `Clinica_Como_Negocio_Interface_Google_Sites__3_.zip` | Protótipo "Raio-X" v1 (HTML isolado, sem gravação de dados) |
| 4 | `quanto-vale-minha-sessao-hospedagem__1_.zip` | Calculadora "sessão" standalone |
| 5 | `Clinica_de_Valor_Portal_MVP.zip` | **Protótipo mais recente e mais completo**: portal com 5 páginas (Início, Meu Mapa, Ferramentas, Manual, Meu Plano), já com envio de diagnóstico para uma planilha via Google Apps Script |
| 6 | Link Google Sites (edição) | Não foi aberto — é um link de edição que exige login da proprietária; você indicou "somente essas" referindo-se aos dois zips, então tratei os zips como as fontes válidas |

O arquivo #5 (**Portal MVP**) contém, dentro de si, versões atualizadas de #3 (o Mapa) e do próprio Manual (#2, convertido em HTML navegável), além das duas calculadoras completas que faltavam na primeira leva de materiais. Por isso ele é tratado como a versão **mais atual** do protótipo de interface, e #3 como uma versão **anterior**, para fins de comparação na Seção D.

### A.1 — Matriz-Mãe v2 (xlsx) — 9 abas

| Aba | Conteúdo |
|---|---|
| `Respostas ao formulário 1` | Cabeçalho de um Forms com 55 colunas (versão com uma pergunta a mais — "Existe um terceiro serviço") — **diferente** da aba `Respostas_Brutas` (ver D.1) |
| `Respostas_Brutas` | Respostas reais do Forms atual — 54 colunas, 3 respondentes registrados |
| `Respostas_Brutas_antiga` | Estrutura de um Forms anterior (53 colunas) — versão descontinuada |
| `Legenda` | Notas da autora da planilha: mudanças de versão, suposições assumidas, correções aplicadas |
| `Variaveis` | 9 variáveis calculadas (V1–V9) a partir de `Respostas_Brutas`, por fórmula |
| `Pesos_Decisao` | Matriz de pesos (heurística, manual) que liga as 9 variáveis a 7 "Decisões" |
| `Pontuacao` | Score de cada uma das 7 decisões por cliente = `SUMPRODUCT` das variáveis × pesos |
| `Diagnostico` | Escolhe a decisão de **maior** score (só 1, não 2) |
| `Historico` | Aba manual, vazia — para registrar checkpoints e resultado real |

### A.2 — Manual da Clínica Como Negócio na ACP (docx)

22 capítulos em 7 Partes, mais uma Parte VII de "Manual de Aplicação" com 13 ferramentas anunciadas — **das quais só 10 têm conteúdo no arquivo** (ver D.6). Índice completo na Seção B.4.

### A.3 — Portal Clínica de Valor MVP (zip) — a peça mais nova

```
index.html          → Home institucional (Início → Meu Mapa → Ferramentas/Manual → Meu Plano)
mapa/index.html      → "Meu Mapa" — versão 2 do Raio-X, com:
                        - captura de nome e e-mail
                        - envio do resultado para um Google Apps Script (grava em planilha)
                        - PDF do resultado
                        - link direto para a ferramenta certa + capítulo certo do Manual + Meu Plano
ferramentas/index.html → Lista as 2 calculadoras
ferramentas/sessao.html → Calculadora "Quanto vale minha sessão" (idêntica ao zip #4)
ferramentas/grupo.html  → Calculadora "Quanto vale meu serviço em grupo" (nova, só aqui)
manual/index.html    → O texto do docx (#2), convertido em HTML, navegável por capítulo (?cap=N)
plano/index.html      → "Meu Plano" — formulário (movimento, ação, prazo, indicador) salvo em localStorage
README.txt           → Confirma: "Arquivos prontos para publicação em Netlify [...] Meu Plano desta
                        versão salva no navegador (localStorage), não em banco externo."
```

O próprio README confirma o que a arquitetura aprovada já previa: isso é um protótipo de front-end, sem persistência real — exatamente o que a plataforma INDIA precisa substituir por um banco de dados de verdade, sob controle da proprietária.

---

## B. MAPA DE INTEGRAÇÃO — material por material

### B.1 — Matriz-Mãe (xlsx)

**1. Função:** motor de cálculo que transforma respostas do Forms em uma "decisão prioritária" por cliente.
**2. Etapa da jornada:** DIAGNÓSTICO → GARGALO (mas só entrega 1 gargalo, não 2 — ver D.2).
**3. Recebe:** as 54 respostas de `Respostas_Brutas` (uma linha por cliente).
**4. Produz:** 9 variáveis normalizadas (V1–V9) → 7 scores (`Pontuacao`) → 1 decisão de maior score (`Diagnostico`).
**5. Dimensões/gargalos que usa** (as 7 "Decisões" de `Pesos_Decisao`): **Captar, Precificar, Posicionar, Produto-Vitrine, Mix, Esteira, Escalar**.
**6. Como pode entrar na plataforma:** a lógica (fórmulas de V1–V9 e o `SUMPRODUCT` de pesos) é 100% portável para código — são fórmulas determinísticas, não fórmulas de IA. O que **não** é portável automaticamente é a tabela `Pesos_Decisao`: a própria aba diz, na linha 10, *"Pesos de exemplo, heurísticos. Ajuste com base na sua experiência — esta aba nunca é automática."* — ou seja, os pesos atuais são um rascunho da autora, não uma regra validada.
**7. Relação com outros materiais:** as 9 variáveis (V1–V9) vêm das perguntas do Forms, que são uma **versão reduzida/diferente** do "Diagnóstico da Clínica" (Ferramenta 1) do Manual — ver D.3. As 7 "Decisões" desta aba **não** correspondem aos 6 "movimentos" do Portal MVP nem às 6 áreas da "Roda da Sustentabilidade" do Manual — ver D.4 (conflito central a resolver).
**8. Gaps:** ver Seção D (D.1, D.2, D.3, D.4, D.5).

**Detalhe técnico das 9 variáveis (V1–V9), tal como calculadas hoje:**

| Var | Nome | Fórmula (resumo fiel) | Fonte no Forms |
|---|---|---|---|
| V1 | GapReceita (0–1) | `(faturamento_almejado − faturamento_médio_2meses) / faturamento_almejado` | col. T (atual) e AS (meta) |
| V2 | ClientesAtuais (0–1, /20) | `(nº clientes serviço1 + nº clientes serviço2) / 20`, com `MIN(1, …)` | col. I e O |
| V3 | TempoAtuacao (0–1, /15 anos) | `(ano_atual − ano_que_começou_a_atuar) / 15`, limitado a [0,1] | col. D |
| V4 | DependeUmServico (0/1) | 1 se a resposta de dependência contém "Sim" | col. S |
| V5 | TaxaOcupacao (0–1) | `atendimentos_por_semana / capacidade_máxima_real` | col. Y / col. Z |
| V6 | TemMaisDeUmServico (0/1) | 1 se existe "Nome do serviço 2" preenchido | col. K |
| V7 | SemRegraReajuste (0/1) | 1 se a resposta sobre regra de reajuste contém "Não" | col. AH |
| V8 | IdentificouDiferencial (0/1) | 1 se a resposta sobre motivo de escolha contém "Sim" | col. AL |
| V9 | AutoridadeDigital (0–1, normalizado) | `(nota_1a5 − 1) / 4` | col. AN |

**Pesos_Decisao (matriz completa, tal como está hoje — heurística, não validada):**

| Decisão | V1 | V2 | V3 | V4 | V5 | V6 | V7 | V8 | V9 |
|---|--:|--:|--:|--:|--:|--:|--:|--:|--:|
| Captar | 3 | −2 | −1 | 1 | 1 | −1 | 0 | 0 | 1 |
| Precificar | 1 | 0 | 0 | 0 | −1 | 0 | 3 | 1 | 1 |
| Posicionar | 0 | 0 | 1 | 3 | 1 | 0 | 0 | 2 | 0 |
| Produto-Vitrine | 1 | 0 | 0 | 1 | 0 | 2 | 0 | 1 | 0 |
| Mix | 1 | −1 | 0 | 1 | 0 | 2 | 0 | 1 | 0 |
| Esteira | 0 | 1 | 1 | 0 | −1 | 2 | 0 | 1 | 1 |
| Escalar | 0 | 2 | 2 | 0 | −2 | 0 | −1 | 2 | 2 |

Score da decisão = soma de (variável × peso) para as 9 variáveis. `Diagnostico` escolhe a decisão de maior score como "Prioridade" — **uma só**, não duas.

---

### B.2 — Manual da Clínica Como Negócio na ACP (docx)

**1. Função:** é a metodologia em si — o "porquê" e o "como" por trás de cada gargalo e cada ferramenta. É texto, não código.
**2. Etapa da jornada:** alimenta CAMINHO, CONTEÚDO e FERRAMENTA — é o que a plataforma deve abrir depois que o Mapa aponta uma prioridade.
**3. Recebe:** nada (é conteúdo estático, mas com 2 ferramentas internas que coletam dados em papel — Ferramenta 1 e Ferramenta 2).
**4. Produz:** capítulos de leitura + 10 ferramentas de aplicação (planilhas/checklists em papel, hoje).
**5. Dimensões que usa:** ver a "Roda da Sustentabilidade" (Ferramenta 2) — 6 áreas: **Identidade e posicionamento, Estrutura da clínica, Comunicação e captação, Sustentabilidade financeira, Segurança profissional, Crescimento**. Essa é a taxonomia "oficial" do Manual — e é uma **terceira** taxonomia, diferente das 7 Decisões da Matriz-Mãe e dos 7 Movimentos do Portal MVP (ver D.4).
**6. Como pode entrar na plataforma:** como conteúdo — cada capítulo vira "Meu Caminho" / conteúdo de manual; as ferramentas viram formulários dentro de "Minhas Ferramentas". O Portal MVP já fez essa conversão (ver B.3) — o texto está idêntico ao docx.
**7. Relação com outros materiais:** a Ferramenta 1 (Diagnóstico da Clínica) é conceitualmente o "avô" do Diagnóstico do Forms/Matriz-Mãe, mas tem perguntas **diferentes e mais amplas** — inclui "Valor social" (vagas com desconto) e "Desgaste emocional por paciente", que **não existem** em nenhuma variável V1–V9 nem no Raio-X do Portal (ver D.3). A Ferramenta 8 (Cálculo de Honorários) é o "manual" de que nasceu a calculadora "Quanto vale minha sessão" — mesma lógica de ponto de equilíbrio (ver B.5).
**8. Gaps:** Parte II nunca é nomeada com o cabeçalho "PARTE II" no texto (ver D.7); a Parte VII para no meio (Ferramenta 10 de 13 anunciadas — ver D.6).

### B.3 — Portal Clínica de Valor MVP — "Meu Mapa" (mapa/index.html)

**1. Função:** é o Raio-X funcional — a versão mais evoluída do diagnóstico interativo, já com captação de identidade (nome/e-mail) e gravação em planilha.
**2. Etapa da jornada:** DIAGNÓSTICO → MAPA → 2 GARGALOS (aqui sim, primário + apoio) → CAMINHO (aponta ferramenta + capítulo do manual).
**3. Recebe:** 12 campos numéricos/seleção (meta de faturamento, retirada desejada, teto de atendimentos, modelo desejado, faturamento atual, pacientes atuais, preço médio, custos mensais, concentração top-3 pacientes, concentração de canal, desgaste/energia) + 2 blocos de checklist (Estrutura: 7 itens; Finanças: 6 itens) + 2 blocos de nota 0–4 (Posicionamento: 5 perguntas; Modelo: 4 perguntas).
**4. Produz:** 6 scores (Estrutura, Finanças, Posicionamento e narrativa, Captação, Preço e modelo, Capacidade e energia) → 7 "prioridades" ponderadas → escolhe **primário + apoio + "não priorizar agora"** (isso sim são 2 gargalos + 1 explicitamente descartado).
**5. Dimensões/gargalos que usa (os 7 "Movimentos"):** **Estruturar, Organizar finanças, Captar, Posicionar e narrar valor, Rever preço e modelo, Crescer/diversificar, Proteger capacidade e energia**.
**6. Como pode entrar na plataforma:** é a lógica mais pronta para virar o motor real de "Meu Mapa" — já é JavaScript determinístico, dá 2 gargalos, e já mapeia cada gargalo para: um capítulo do Manual, e (quando aplicável) uma calculadora. A nota do próprio código diz: *"Priority = deficiency + strategic modifiers. Not a validated statistical model."* — ou seja, mesmo aviso da Matriz-Mãe: pesos heurísticos, não validados.
**7. Relação com outros materiais:** usa perguntas **totalmente diferentes** das do Forms/Matriz-Mãe (ver D.1/D.4) e das da Ferramenta 1 do Manual. Também é diferente da versão anterior (zip #3) — ver D.5.
**8. Gaps:** ver D.1, D.4, D.5, D.8.

**Tabela de prioridade → caminho (`pathMap`, tal como está no código):**

| Movimento primário | Capítulo do Manual apontado | Ferramenta apontada |
|---|---|---|
| Estruturar | Capítulo 6 | — |
| Organizar finanças | Capítulo 15 | Calculadora de sessão |
| Captar | Capítulo 12 | — |
| Posicionar e narrar valor | Capítulo 9 | — |
| Rever preço e modelo | Capítulo 14 | Calculadora de sessão |
| Crescer / diversificar | Capítulo 20 | Calculadora de grupo |
| Proteger capacidade e energia | Capítulo 3 | — |

**Regras de prioridade (lógica completa, fiel ao código):**

Base: `Estruturar = (100−Estrutura)×0.85`; `Organizar finanças = (100−Finanças)×0.9`; `Captar = (100−Captação)×0.78`; `Posicionar = (100−Posicionamento)×0.72`; `Rever preço = (100−Modelo)×0.78`; `Crescer = 15` (fixo); `Proteger capacidade = (100−Energia)×0.8`.

Modificadores aplicados em sequência:
- Estrutura < 50 → +28 em Estruturar, −10 em Crescer
- Finanças < 50 → +28 em Organizar finanças, −10 em Crescer
- Concentração top-3 pacientes ≥ 45% → +10 em Organizar finanças
- Concentração de canal ≥ 70% → +20 em Captar
- Posicionamento < 55 → +18 em Posicionar
- Energia ≤ 40 → +34 em Proteger capacidade, −18 em Captar, −12 em Crescer
- Ocupação < 70% e capacidade ≥ meta → +30 em Captar
- Ocupação ≥ 88% e meta > faturamento atual → +24 em Rever preço, −18 em Captar
- Capacidade < meta (gap negativo) → +34 em Rever preço; +30 em Crescer se modelo ≠ individual (senão +12); −12 em Captar
- Capacidade ≥ meta e modelo = individual → −22 em Crescer
- Gap negativo + ocupação ≥ 85% + estrutura ≥ 60 + finanças ≥ 60 → +22 em Crescer
- Modelo = misto + estrutura ≥ 60 + finanças ≥ 60 + modelo-score ≥ 55 → +10 em Crescer

Resultado: ordena os 7 scores; o maior é o **gargalo primário**, o segundo é o **gargalo de apoio**, o menor é o que aparece como **"não priorizar agora"**.

### B.4 — Índice funcional do Manual (Partes/Capítulos → possíveis gargalos)

Sem alterar o conteúdo — apenas relacionando cada capítulo às taxonomias de gargalo já existentes nos materiais (Matriz-Mãe / Portal / Roda da Sustentabilidade), para orientar o roteamento de conteúdo:

| Parte | Cap. | Título (como está no docx) | Roda da Sustentabilidade (Ferr. 2) | Movimento do Portal (mapa/index.html) | Decisão da Matriz-Mãe (aprox.) |
|---|---|---|---|---|---|
| I | 1 | Onde estou? O Diagnóstico da Clínica | Identidade e posicionamento | (todos — é o ponto de partida) | (alimenta todas as V) |
| I | 2 | Quem sou como psicóloga? Identidade, valores e propósito | Identidade e posicionamento | Posicionar e narrar valor | Posicionar |
| I | 3 | A Clínica Centrada na Pessoa: gestão também humanista | — (transversal) | Proteger capacidade e energia | — |
| I | 4 | A clínica também é um negócio | — (transversal) | — | — |
| II* | 5 | Estrutura física | Estrutura da clínica | Estruturar | — |
| II* | 6 | Estrutura administrativa | Estrutura da clínica | Estruturar | — |
| II* | 7 | A jornada da pessoa atendida | Comunicação e captação | Captar | Captar |
| II* | 8 | Protocolos da clínica | Estrutura da clínica | Estruturar | — |
| III | 9 | Posicionamento: por que escolhem você? | Identidade e posicionamento | Posicionar e narrar valor | Posicionar |
| III | 10 | Diferenciação, especialidade e modelo de negócio | Identidade e posicionamento | Posicionar / Crescer | Posicionar / Mix |
| III | 11 | Comunicação ética e presença profissional | Comunicação e captação | Posicionar e narrar valor | Posicionar |
| III | 12 | Relacionamentos que fortalecem a clínica | Comunicação e captação | Captar | Captar |
| IV | 13 | (sem título — relação com dinheiro) | Sustentabilidade financeira | Organizar finanças | Precificar |
| IV | 14 | Quanto vale o seu trabalho? Precificação sustentável | Sustentabilidade financeira | Rever preço e modelo | Precificar |
| IV | 15 | O financeiro da clínica | Sustentabilidade financeira | Organizar finanças | Precificar |
| V | 16 | PF, PJ e CNPJ | Segurança profissional | — (sem correspondência no Portal) | — |
| V | 17 | Contratos, recibos e documentação | Segurança profissional | — (sem correspondência) | — |
| V | 18 | Previdência e planejamento futuro | Segurança profissional | — (sem correspondência) | — |
| VI | 19 | Como crescer mantendo os princípios da ACP | Crescimento | Crescer / diversificar | Escalar |
| VI | 20 | Novos Serviços | Crescimento | Crescer / diversificar | Produto-Vitrine / Mix |
| VI | 21 | Supervisão, grupos, cursos e comunidade | Crescimento | Crescer / diversificar | Esteira / Escalar |
| VI | 22 | Planejamento da clínica para os próximos anos | — (transversal) | — (fecha o ciclo) | — |

\* A "Parte II" nunca é nomeada como cabeçalho no texto — ver D.7.

Observação: "Segurança profissional" (Caps. 16–18) é uma área inteira da Roda da Sustentabilidade **sem nenhum gargalo correspondente** nem na Matriz-Mãe, nem nos 7 Movimentos do Portal MVP. Ou seja, hoje a plataforma nunca apontaria uma usuária para esses capítulos via diagnóstico automático — só por navegação livre no Manual. Isso é uma lacuna real de cobertura, não uma opinião minha sobre o que deveria existir.

### B.5 — Calculadora "Quanto vale minha sessão"

**1. Função:** traduz o ponto de equilíbrio (Ferramenta 8 do Manual) em valor de sessão e valor/hora.
**2. Etapa da jornada:** FERRAMENTA, acionada a partir dos gargalos "Organizar finanças" e "Rever preço e modelo".
**3. Campos de entrada** (com valor padrão/min/max tal como estão no HTML):

| Campo | Padrão | Min | Max |
|---|--:|--:|--:|
| Pró-labore desejado (R$) | 8000 | 0 | — |
| Custos fixos mensais (R$) | 1800 | 0 | — |
| Reserva técnica (%) | 18 | 0 | 35 |
| Margem (%) | 10 | 0 | 30 |
| 13º (%) | 8,33 | 0 | 15 |
| Férias (%) | 11,11 | 0 | 20 |
| Sessões por semana | 18 | 4 | 40 |
| Duração da sessão (min) | 50 | 30 | 90 |
| Faltas (%) | 8 | 0 | 30 |
| Semanas trabalhadas/ano | 46 | 35 | 50 |

**4. Fórmula (fiel ao código):**
```
prolaboreTotal = prolabore × (1 + 13º% + férias%)
faturamentoMínimo = (prolaboreTotal + custosFixos) / (1 − reserva% − margem%)
sessõesMêsAgendadas = (sessõesSemana × semanasAno) / 12
sessõesMêsPagas = sessõesMêsAgendadas × (1 − faltas%)
valorSessão = faturamentoMínimo / sessõesMêsPagas
valorHora = valorSessão / (duração/60)
```
**5. Alertas embutidos:** se reserva% + margem% ≥ 100%, ou se valorSessão > R$ 600 (sugere revisar agenda ou considerar formatos como grupo/mentoria).
**6. Relação com o Manual:** é exatamente a mesma sequência da Ferramenta 8 (Custo fixo → Pró-labore desejado → Reserva mínima → Ponto de equilíbrio → valor de sessão), só que com 13º e férias explicitados e com faltas incorporadas ao cálculo — o Manual não detalha 13º/férias/faltas nesse nível, então a calculadora é **mais granular** que o texto do capítulo 14/Ferramenta 8, não contraditória a ele.

### B.6 — Calculadora "Quanto vale meu serviço em grupo"

**1. Função:** mesma lógica de ponto de equilíbrio da calculadora de sessão, mas dividido entre várias pessoas/grupos, com edição bidirecional (dá para digitar a mensalidade desejada e a calculadora recalcula o pró-labore implícito).
**2. Etapa da jornada:** FERRAMENTA, acionada a partir do gargalo "Crescer / diversificar".
**3. Campos de entrada:**

| Campo | Padrão | Min | Max |
|---|--:|--:|--:|
| Pró-labore desejado (R$) | 8000 | 0 | — |
| Custos fixos (R$) | 1800 | 0 | — |
| Reserva (%) | 18 | 0 | 35 |
| Margem (%) | 10 | 0 | 30 |
| 13º (%) | 8,33 | 0 | 15 |
| Férias (%) | 11,11 | 0 | 20 |
| Pessoas por grupo | 8 | 2 | 30 |
| Nº de grupos | 1 | 1 | 10 |
| Duração do encontro (h) | 2 | 1 | 8 |
| Frequência mensal (dias) | 4,33 (semanal) | 1 | 20 |

Botões de atalho de frequência: Quinzenal (2,17), Semanal (4,33), 2x/semana (8,66).

**4. Fórmula:**
```
faturamentoMínimo = mesma fórmula da calculadora de sessão
totalPessoas = pessoasPorGrupo × nºGrupos
valorEncontro/Turma = faturamentoMínimo / (frequênciaMensal × nºGrupos)
valorPorPessoaMês = faturamentoMínimo / totalPessoas
valorHora = valorEncontro/Turma / duração
```
Também permite o caminho inverso: editar `valorPorPessoaMês` recalcula o `prolabore` implícito.
**5. Alertas:** mesma trava de reserva+margem ≥ 100%; alerta se mensalidade/pessoa > R$ 2.500 (revisar tamanho do grupo antes de cortar pró-labore) ou < R$ 150 (grupo pode não sustentar o pró-labore).
**6. Relação com o Manual:** conecta-se aos Capítulos 19–21 (crescer em volume, não em tempo — grupos terapêuticos) e à Ferramenta 4 (Modelo de Negócio).

---

## C. MATRIZ DIAGNÓSTICO → DIRECIONAMENTO

**Atenção central desta seção:** existem hoje **3 taxonomias de gargalo diferentes** nos materiais, e elas não se equivalem 1-para-1. Isso é detalhado como decisão pendente em D.4. Abaixo, cada uma é registrada fielmente, sem tentar unificá-las por conta própria.

### C.1 — Matriz-Mãe (V1–V9 → 7 Decisões)
Ver tabela completa em B.1. Resultado: 1 decisão prioritária (maior score), sem 2º gargalo formal.

### C.2 — Portal MVP / Meu Mapa (6 scores → 7 Movimentos)
Ver tabela e regras completas em B.3. Resultado: gargalo primário + gargalo de apoio + 1 item explicitamente "não priorizar agora" — **este já entrega o formato de "2 gargalos prioritários" que a Arquitetura Conceitual exige**, a Matriz-Mãe (C.1) hoje não entrega.

### C.3 — Manual / Roda da Sustentabilidade (6 áreas, avaliação manual 0–10)
Ferramenta em papel, sem fórmula de priorização automática — a única "regra" explícita é qualitativa: *"a área com nota mais baixa não é, necessariamente, a primeira a ser trabalhada [...] Das áreas com nota baixa, qual delas, se resolvida, facilita a solução das outras?"* — ou seja, o próprio Manual reconhece que existem **dependências entre áreas**, mas não formaliza quais.

---

## D. LACUNAS QUE PRECISAM DA SUA DECISÃO

### D.1 — Qual questionário é a fonte da verdade?
Existem **3 conjuntos de perguntas diferentes** disputando o papel de "o Diagnóstico":
- O Google Forms atual (54 colunas, `Respostas_Brutas`) — alimenta a Matriz-Mãe.
- O questionário do "Meu Mapa" no Portal MVP (12 campos + 2 checklists + 2 blocos de nota) — completamente diferente do Forms, tanto nas perguntas quanto na lógica de pontuação.
- A Ferramenta 1 do Manual ("Diagnóstico da Clínica", em papel) — inclui "Valor social" e "Desgaste emocional por paciente", que não aparecem em nenhum dos outros dois.

**Pergunta:** qual desses é o diagnóstico oficial da plataforma? Os outros dois são descartados, viram ferramentas complementares, ou devem ser fundidos em um questionário único?

### D.2 — A Matriz-Mãe só entrega 1 gargalo; a arquitetura exige 2
A aba `Diagnostico` da Matriz-Mãe usa `MAX()` para escolher só a decisão de maior score — não há fórmula para um "segundo gargalo". Já o Portal MVP entrega gargalo primário + de apoio.
**Pergunta:** a lógica de "2 gargalos prioritários" deve seguir o padrão do Portal MVP (primário + apoio via ranking), aplicado à taxonomia da Matriz-Mãe? Ou você prefere outra regra?

### D.3 — As variáveis V1–V9 e as perguntas do "Meu Mapa" não se correspondem
Nenhuma das 9 variáveis da Matriz-Mãe (V1–V9) é calculada a partir das perguntas usadas no "Meu Mapa" do Portal, e vice-versa. Por exemplo: o "Meu Mapa" pergunta diretamente "meta de faturamento" e "pró-labore desejado", que não existem nas V1–V9; a Matriz-Mãe calcula "autoridade digital" e "tempo de atuação", que não existem no "Meu Mapa".
**Pergunta:** você quer que eu trate essas como a mesma coisa reformulada (nesse caso, preciso saber qual delas é a versão final), ou são etapas diferentes da jornada (por exemplo, um "diagnóstico rápido" vs. um "diagnóstico completo")?

### D.4 — Três taxonomias de gargalo, sem tabela de equivalência
- Matriz-Mãe: **Captar, Precificar, Posicionar, Produto-Vitrine, Mix, Esteira, Escalar**
- Portal MVP: **Estruturar, Organizar finanças, Captar, Posicionar e narrar valor, Rever preço e modelo, Crescer/diversificar, Proteger capacidade e energia**
- Manual (Roda da Sustentabilidade): **Identidade e posicionamento, Estrutura da clínica, Comunicação e captação, Sustentabilidade financeira, Segurança profissional, Crescimento**

Há sobreposições claras (Captar ≈ Captar/Comunicação e captação; Precificar ≈ Rever preço e modelo/Sustentabilidade financeira), mas nenhuma equivalência exata — e "Segurança profissional" (PF/PJ, contratos, previdência) não existe em nenhuma das outras duas listas (ver B.4).
**Pergunta:** você confirma que a taxonomia oficial da plataforma deve ser a dos **7 Movimentos do Portal MVP** (por ser a mais recente e a única com lógica de 2 gargalos já pronta)? Se sim, o que fazemos com "Segurança profissional" — vira um 8º movimento, ou fica de fora do diagnóstico automático e só acessível por navegação livre no Manual?

### D.5 — Raio-X v1 (zip #3) vs. Portal MVP (zip #5): qual prevalece?
Como você mesma antecipou: são o mesmo motor de cálculo (`calculate()` é byte-idêntico), mas a interface e a integração mudaram — v1 tem uma lista de recursos por gargalo (`resources{}`) com botão "Abrir recurso" que só mostra um alerta de placeholder; a versão do Portal MVP substitui isso por `pathMap{}`, que já linka de verdade para a calculadora certa e o capítulo certo do Manual, além de gravar nome/e-mail/resultado em planilha.
**Confirmação, não pergunta em aberto:** como a lógica de cálculo é idêntica nas duas e a do Portal MVP é estritamente mais completa (mesma base + integração real), vou considerar o **Portal MVP como a versão vigente do Raio-X**, e o zip v1 como histórico, a menos que você diga o contrário.

### D.6 — Manual de Aplicação incompleto
A Parte VII anuncia 13 ferramentas (Diagnóstico, Roda da Sustentabilidade, Canvas, Modelo de Negócio, Jornada, Checklist Física, Checklist Administrativo, Cálculo de Honorários, Planejamento Financeiro, Planejamento de 90 dias, **Plano Anual da Clínica, Indicadores, Playbooks**), mas o arquivo (tanto o .docx quanto o manual/index.html do Portal) termina na Ferramenta 10, referenciando a "Ferramenta 11 (Plano Anual)" que não existe no texto.
**Pergunta:** as Ferramentas 11–13 existem em outro documento que ainda não foi enviado, ou ainda estão por escrever?

### D.7 — "Parte II" nunca aparece como cabeçalho
O texto referencia "a Parte II" três vezes (ao fechar o Cap. 4, ao abrir o Cap. 5, ao fechar o Cap. 8), mas nunca existe um cabeçalho `**PARTE II — ...**` como existe para as demais partes. Os Capítulos 5–8 ficam "soltos" entre a Parte I e a Parte III.
**Pergunta:** isso é uma omissão no arquivo (e você tem o título da Parte II em outro lugar), ou a estrutura oficial pula direto de "Parte I" para "Parte III", tratando 5–8 como uma extensão da Parte I?

### D.8 — Suposições já assinaladas pela própria autora da Matriz-Mãe (aba Legenda), ainda não confirmadas
- V9 (Autoridade Digital) foi tratada como resposta numérica (1 a 5); se no Forms real essa pergunta for categórica (Baixa/Média/Alta), a fórmula está errada.
- `Respostas ao formulário 1` (55 colunas) e `Respostas_Brutas` (54 colunas) têm estruturas de coluna diferentes — a aba com respostas reais (`Respostas_Brutas`) não bate exatamente com o cabeçalho "oficial" do formulário (`Respostas ao formulário 1`), que tem uma pergunta a mais ("Existe um terceiro serviço").
**Pergunta:** essas duas pendências, já sinalizadas por você mesma na aba Legenda, seguem em aberto? Preciso da confirmação antes de tratar V9 e o mapeamento de colunas como definitivos.

### D.9 — Raio-X: pesos "não validados", explicitamente
Tanto a Matriz-Mãe (`Pesos_Decisao`, linha 10: "esta aba nunca é automática") quanto o código do Portal MVP (`// Priority = ... Not a validated statistical model.`) dizem, nas próprias palavras da metodologia, que os pesos atuais são heurísticos e não estatisticamente validados. A própria interface do Raio-X (nota no formulário) diz: *"os pesos desta versão são regras estratégicas iniciais [...] ainda não são um modelo estatístico validado."*
**Não é uma pergunta a responder agora** — é um registro para constar: a plataforma deve nascer com esses pesos como estão, mas a arquitetura de dados (Seção E) precisa deixar espaço para recalibrar pesos no futuro, com base no `Historico` real de resultados — o que já está previsto na Arquitetura Conceitual aprovada (dados estruturados desde o MVP para análises futuras).

---

## E. PROPOSTA DE DADOS A ARMAZENAR NO BANCO

Proposta de estrutura de dados — sujeita à sua aprovação e às decisões pendentes da Seção D (principalmente D.1 e D.4, que definem os campos exatos do diagnóstico).

**users**
- id, nome, e-mail, data de cadastro, produtos/módulos ativos (Clínica: ativo/inativo, Comunidade: ativo/inativo, Mentoria: ativo/inativo/tipo, Gestão: futuro), status de assinatura.

**diagnosticos** (um registro por diagnóstico realizado — nunca sobrescrito)
- id, user_id, data, tipo (Clínica de Valor / Diagnóstico Empresarial), respostas brutas (todas as respostas dadas, como estrutura fiel ao formulário usado — depende de D.1), scores calculados (por dimensão — depende de D.4), gargalo primário, gargalo de apoio, gargalo "não priorizar agora" (quando aplicável), texto do resultado gerado.

**mapas**
- id, diagnostico_id, dados do "Mapa" gerado a partir do diagnóstico (pode ser 1:1 com diagnósticos, ou uma entidade própria se o Mapa puder ser regenerado sem novo diagnóstico — depende de decisão de produto, não vou presumir).

**planos_30_dias**
- id, user_id, diagnostico_id (origem), movimento/gargalo trabalhado, ação definida, prazo, indicador de acompanhamento, status (em andamento / concluído / não concluído), data de criação, data de conclusão. Precisa aceitar também origem = "Movimento do Mês" (Comunidade), conforme já definido na Arquitetura Conceitual — mesmo ambiente de execução, sem sistema paralelo.

**checkpoints**
- id, plano_id, data, resultado (sucesso/falhou/em curso), observação — corresponde à aba `Historico` da Matriz-Mãe, hoje manual.

**ferramentas_uso** (opcional, para análise futura de qual ferramenta é usada em qual gargalo)
- id, user_id, ferramenta (ex.: calculadora de sessão, calculadora de grupo), inputs usados, outputs gerados, data. Permite, no futuro, cruzar "gargalo apontado" × "ferramenta de fato usada" × "resultado no checkpoint seguinte" — que é exatamente o tipo de dado que permitiria, com o tempo, validar ou recalibrar os pesos hoje heurísticos (D.9).

**comunidade_votacao** / **comunidade_aplicacao**
- já detalhados na Arquitetura Conceitual v1.0 aprovada — Movimento do Mês (temas, votos, tema vencedor) e Aplicação (insight, significado, decisão, ação, prazo — esta última alimenta `planos_30_dias`, não uma tabela própria).

**empresas_diagnosticos** (Diagnóstico Empresarial — estrutura análoga a `diagnosticos`, mas para o ecossistema de empresas, incluindo o estágio: Estruturação/Consolidação/Crescimento, e os 2 gargalos prioritários daquele diagnóstico, quando as regras forem fornecidas).

---

Aguardando suas respostas às perguntas da Seção D antes de qualquer implementação.
