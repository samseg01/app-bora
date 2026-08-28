"use client";

import { useEffect } from "react";

/**
 * Registra o service worker (`public/sw.js`).
 *
 * Só em produção. Em desenvolvimento um SW ativo intercepta os assets do Turbopack e
 * transforma hot reload em depuração de cache — problema que não se paga, já que o que
 * ele resolve (abrir rápido com sinal ruim na rua) não acontece no localhost.
 *
 * Falha em silêncio de propósito: sem service worker o app funciona igual, só perde a
 * tolerância a rede ruim. Erro de registro não é assunto de quem está tentando sair de
 * casa — vai para o console e para.
 */
export function RegistrarSW() {
  useEffect(() => {
    if (process.env.NODE_ENV !== "production") return;
    if (!("serviceWorker" in navigator)) return;

    const registrar = () => {
      void navigator.serviceWorker.register("/sw.js").catch((e) => {
        console.error("[sw] registro falhou", e);
      });
    };

    // Depois do load: registrar durante o carregamento disputa banda com a primeira
    // tela, que é justamente a que precisa chegar rápido.
    if (document.readyState === "complete") {
      registrar();
      return;
    }
    window.addEventListener("load", registrar);
    return () => window.removeEventListener("load", registrar);
  }, []);

  return null;
}
