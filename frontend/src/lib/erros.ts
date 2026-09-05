import { ApiError, ApiOffline } from "./api";

/**
 * A frase que o painel do curador mostra quando algo falha ao salvar.
 *
 * Existe por causa de 05/09: o `PATCH /curador/lugares` estourava 500 e a tela dizia
 * "Não deu pra salvar. Tenta de novo." — texto de campo errado para um servidor caindo.
 * Quem estava na frente do formulário conferiu os campos, mudou valores e tentou de novo,
 * três vezes, porque a tela mandou fazer exatamente isso. O bug só apareceu no log da API.
 *
 * **O painel do curador é superfície de trabalho, não o app público.** Aqui dizer o número
 * do status ajuda: quem usa esta tela é quem consegue agir sobre a informação — e, no
 * campo, é quem vai ter de contar depois o que aconteceu. A regra do `conceito.md` sobre
 * não expor bastidor vale para a tela de quem sai à noite, não para a de quem opera.
 */
export function porQueFalhou(erro: unknown, acao = "salvar"): string {
  if (erro instanceof ApiOffline) {
    return `Sem resposta da API. Confere a conexão e tenta ${acao} de novo.`;
  }

  if (erro instanceof ApiError) {
    // 5xx é defeito nosso. Mandar conferir campo aqui é mandar procurar no lugar errado.
    if (erro.status >= 500) {
      return `Erro ${erro.status} no servidor — não é campo errado. Tenta de novo; se repetir, está no log da API.`;
    }
    if (erro.status === 401) return "Sua sessão expirou. Entra de novo.";
    if (erro.status === 403) return "Sua conta não é de curador.";
    // 4xx com mensagem do servidor: ela é mais específica do que qualquer texto genérico
    // que eu escrevesse aqui — o servidor sabe qual campo recusou.
    if (erro.detalhe) return `${erro.detalhe} (${erro.status})`;
    return `Não deu pra ${acao} (${erro.status}).`;
  }

  return `Não deu pra ${acao}. Tenta de novo.`;
}
