"use client";

import { useSyncExternalStore } from "react";
import type { PapelUsuario, UsuarioPublic } from "./types";

/**
 * Sessão do lado do cliente.
 *
 * O token fica em `localStorage` e não em cookie httpOnly porque o backend é uma API
 * separada e o frontend consome direto do navegador — não há sessão de servidor para
 * proteger. A contrapartida é conhecida (XSS lê o token), e o que a mitiga aqui é o
 * app não renderizar HTML de terceiros.
 *
 * O `papel` viaja dentro do JWT, então dá para decidir o que mostrar sem uma ida à
 * rede. **Isso é só para a UI**: quem autoriza de verdade é o backend, que valida a
 * assinatura. Aqui a assinatura nunca é verificada — seria teatro, já que quem
 * controla o navegador controla o localStorage.
 */

const CHAVE = "boraroles.token";

export interface Sessao {
  token: string;
  papel: PapelUsuario;
  /** Epoch em segundos. */
  exp: number;
}

/** Lê o payload do JWT sem verificar assinatura (ver nota acima). */
function lerPayload(token: string): { sub: string; papel: PapelUsuario; exp: number } | null {
  try {
    const [, corpo] = token.split(".");
    if (!corpo) return null;
    const json = atob(corpo.replace(/-/g, "+").replace(/_/g, "/"));
    const p = JSON.parse(json);
    if (typeof p.exp !== "number" || typeof p.papel !== "string") return null;
    return p;
  } catch {
    return null;
  }
}

/**
 * O trio para `useSyncExternalStore`. O localStorage é uma fonte externa: ler durante o
 * render é impuro e o React Compiler recusa; ler num efeito e chamar setState também.
 * Assinar a fonte é o caminho certo, e de quebra o servidor devolve "deslogado" sem
 * divergir da hidratação.
 */
export function assinarToken(aoMudar: () => void): () => void {
  // `storage` só dispara em outras abas — é exatamente o caso de sair em uma e a outra saber.
  window.addEventListener("storage", aoMudar);
  return () => window.removeEventListener("storage", aoMudar);
}

export function lerToken(): string | null {
  try {
    return window.localStorage.getItem(CHAVE);
  } catch {
    // Navegador com armazenamento bloqueado: trata como deslogado.
    return null;
  }
}

/** No servidor ninguém está logado — não há localStorage para consultar. */
export function tokenNoServidor(): null {
  return null;
}

/** Puro: decodifica e valida validade, sem tocar em nada. */
export function sessaoDe(token: string | null): Sessao | null {
  if (!token) return null;
  const p = lerPayload(token);
  if (!p) return null;
  // Token vencido não serve para nada.
  if (p.exp * 1000 <= Date.now()) return null;
  return { token, papel: p.papel, exp: p.exp };
}

export function salvarSessao(token: string): void {
  try {
    window.localStorage.setItem(CHAVE, token);
  } catch {
    /* sem armazenamento: a sessão dura só esta página */
  }
}

export function limparSessao(): void {
  try {
    window.localStorage.removeItem(CHAVE);
  } catch {
    /* idem */
  }
}

/**
 * Para onde voltar depois de entrar. A auth é preguiçosa: a pessoa só chega no login
 * porque tentou fazer algo, e tem que voltar para lá — não para a home.
 */
const VOLTA = "boraroles.volta";

export function guardarDestino(caminho: string): void {
  try {
    window.sessionStorage.setItem(VOLTA, caminho);
  } catch {
    /* segue sem */
  }
}

export function consumirDestino(): string {
  try {
    const d = window.sessionStorage.getItem(VOLTA);
    window.sessionStorage.removeItem(VOLTA);
    return d || "/";
  } catch {
    return "/";
  }
}

export type { UsuarioPublic };

/**
 * A sessão atual, assinando o localStorage. Devolve null no servidor e no primeiro
 * render do cliente — depois da hidratação entra o valor real, sem divergência.
 */
export function useSessao(): Sessao | null {
  const token = useSyncExternalStore(assinarToken, lerToken, tokenNoServidor);
  return sessaoDe(token);
}
