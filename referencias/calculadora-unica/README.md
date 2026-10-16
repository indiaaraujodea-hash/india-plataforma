# Calculadora única — material de referência

Enviados pela proprietária em 16/10/2026 (dois zips: `calculadora-unica.zip` e
`calculadora-unica_1.zip`), como material-fonte da calculadora "Quanto
preciso cobrar?" (sessão individual + serviço em grupo numa tela só).

## Arquivos

- **`modelo-frequencia-grupo.html`** (de `calculadora-unica.zip`) — grupo
  calculado por frequência de encontro (Mensal / Quinzenal / Semanal) e
  divisão de horas entre atendimento individual e grupo. Tem uma tabela
  comparativa "E se a meta fosse outra?" (mostra o valor de sessão/grupo
  para metas de R$5mil/10mil/15mil/20mil).
- **`modelo-percentual-grupo.html`** (de `calculadora-unica_1.zip`) — grupo
  calculado por um slider de % do faturamento que vem do grupo (5–95%),
  sem a tabela comparativa, com um botão final "Quero fazer meu Mapa ACP da
  Clínica Sustentável agora →".

## Relação com o código em produção

A calculadora publicada em `docs/minha-mentoria/calculadora.html` (aba
Ferramentas da Mentoria) foi construída a partir de
**`modelo-percentual-grupo.html`** — são quase idênticos (56 linhas de
diferença). O modelo de frequência (`modelo-frequencia-grupo.html`) **não**
foi usado na versão publicada.

Na adaptação para a plataforma, foram removidos do modelo original:
- os "chips" de status (ok/quase/abaixo) que coloriam o resultado;
- a tabela comparativa "E se a meta fosse outra?";
- o botão final "Quero fazer meu Mapa ACP da Clínica Sustentável agora →".

E foram adicionados: integração com o shell da plataforma (`assets/css/shell.css`,
fonte Cambria, PWA), link "← Voltar para Minha Mentoria", e o gate de
autenticação/mentoria ativa (`requireAuth` + checagem de `mentoria_individual`).

Pendente de decisão da proprietária: se a tabela comparativa e/ou o botão do
Mapa devem voltar para a versão publicada.
