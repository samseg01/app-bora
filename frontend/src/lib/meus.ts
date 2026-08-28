import { api } from "./api";
import type { SalvoDetalhe, SinalizacaoPublic } from "./types";

/**
 * O que é *meu* — salvos e sinais ativos — com uma busca só por tela.
 *
 * Cada `AcaoSalvar` buscava a própria lista de salvos. Numa tela com um botão isso é
 * invisível; na home de desktop, com cinco linhas, viram cinco chamadas idênticas — e
 * com o "Tô indo" precisando saber a mesma coisa sobre sinais, dez. Aqui as linhas
 * montam juntas, a primeira cria a promessa e as outras esperam a mesma.
 *
 * O cache é por token e vive enquanto a aba viver. Quem escreve (salvar, sinalizar,
 * cancelar) chama `invalidarMeus()`, e a próxima montagem busca de novo. Sem isso a
 * home mostraria "salvo" num lugar que você acabou de tirar do caderninho.
 */
let tokenDoCache = "";
let salvos: Promise<SalvoDetalhe[]> | null = null;
let sinais: Promise<SinalizacaoPublic[]> | null = null;

export function invalidarMeus(): void {
  salvos = null;
  sinais = null;
}

function trocouDeConta(token: string): void {
  if (token !== tokenDoCache) {
    tokenDoCache = token;
    invalidarMeus();
  }
}

/** Erro vira lista vazia de propósito: não saber o que é seu não pode quebrar a tela. */
export function meusSalvos(token: string): Promise<SalvoDetalhe[]> {
  trocouDeConta(token);
  salvos ??= api.salvos(token).catch(() => []);
  return salvos;
}

export function meusSinais(token: string): Promise<SinalizacaoPublic[]> {
  trocouDeConta(token);
  sinais ??= api.meusSinais(token).catch(() => []);
  return sinais;
}
