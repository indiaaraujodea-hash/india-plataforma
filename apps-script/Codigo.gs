// Recebe os envios do portal (Meu Mapa e calculadoras) e grava na planilha
// "Diagnósticos — Mapa da Clínica de Valor".
// Cole este código no Apps Script e publique uma NOVA VERSÃO da implantação existente.
const PLANILHA_ID = "1VatJbL3L96HLdtR3SUXMwZgEYDCX-iM5SEUlhKEZ6JA";

function pegarAba(nome, cabecalho) {
  const planilha = SpreadsheetApp.openById(PLANILHA_ID);
  let aba = planilha.getSheetByName(nome);
  // Cria a aba automaticamente na primeira utilização
  if (!aba) {
    aba = planilha.insertSheet(nome);
    aba.appendRow(cabecalho);
    aba.setFrozenRows(1);
  }
  return aba;
}

function doPost(e) {
  try {
    const dados = JSON.parse(e.postData.contents);

    if (dados.tipo === "calculadora") {
      pegarAba("Calculadoras", [
        "Data e hora",
        "Calculadora",
        "Nome",
        "E-mail",
        "Valores preenchidos",
        "Resultado"
      ]).appendRow([
        new Date(),
        dados.calculadora || "",
        dados.nome || "",
        dados.email || "",
        dados.entradas || "",
        dados.resultado || ""
      ]);
    } else {
      pegarAba("Diagnósticos", [
        "Data e hora",
        "Nome",
        "E-mail",
        "Meta de faturamento",
        "Receita atual",
        "Preço médio da sessão",
        "Pacientes atuais",
        "Capacidade máxima",
        "Estrutura",
        "Financeiro",
        "Posicionamento / Narrativa",
        "Captação",
        "Modelo / Oferta",
        "Energia",
        "Movimento principal",
        "Movimento de apoio",
        "Não priorizar agora",
        "Resultado completo"
      ]).appendRow([
        new Date(),
        dados.nome || "",
        dados.email || "",
        dados.metaFaturamento || "",
        dados.receitaAtual || "",
        dados.precoSessao || "",
        dados.pacientesAtuais || "",
        dados.capacidadeMaxima || "",
        dados.estrutura || "",
        dados.financeiro || "",
        dados.posicionamento || "",
        dados.captacao || "",
        dados.modelo || "",
        dados.energia || "",
        dados.movimentoPrincipal || "",
        dados.movimentoApoio || "",
        dados.naoPriorizar || "",
        dados.resultadoCompleto || ""
      ]);
    }

    return ContentService
      .createTextOutput(JSON.stringify({ status: "sucesso" }))
      .setMimeType(ContentService.MimeType.JSON);

  } catch (erro) {
    console.error(erro);
    return ContentService
      .createTextOutput(JSON.stringify({
        status: "erro",
        mensagem: erro.toString()
      }))
      .setMimeType(ContentService.MimeType.JSON);
  }
}

// Rode esta função uma vez pelo botão "Executar" para autorizar e testar:
// deve aparecer uma linha de teste na aba "Calculadoras".
function testar() {
  doPost({ postData: { contents: JSON.stringify({
    tipo: "calculadora", calculadora: "TESTE", nome: "Teste", email: "",
    entradas: "teste", resultado: "teste"
  }) } });
}
