"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { BAIRROS, salvarBairro } from "@/lib/bairros";

/**
 * Trocar de bairro no próprio cabeçalho, sem sair da tela.
 *
 * Antes isso levava para `/abertura`. Navegar de página inteira para escolher entre
 * dois recortes é peso demais — e o nome do bairro no topo já é onde a pessoa olha para
 * saber onde está, então é onde ela espera poder mudar.
 *
 * `/abertura` continua existindo para a primeira visita, quando a escolha é o assunto da
 * tela e vem acompanhada do posicionamento do produto.
 */
export function SeletorBairro({
  atual,
  tamanho = "mobile",
}: {
  atual: string;
  /** O desktop tem hover e mais espaço; o telefone precisa de alvo maior. */
  tamanho?: "mobile" | "desktop";
}) {
  const router = useRouter();
  const [aberto, setAberto] = useState(false);
  const caixa = useRef<HTMLDivElement>(null);

  // Fechar ao clicar fora ou apertar Esc: um popover que só fecha no próprio botão
  // prende a pessoa, sobretudo no telefone.
  useEffect(() => {
    if (!aberto) return;
    function noDocumento(e: MouseEvent) {
      if (caixa.current && !caixa.current.contains(e.target as Node)) setAberto(false);
    }
    function naTecla(e: KeyboardEvent) {
      if (e.key === "Escape") setAberto(false);
    }
    document.addEventListener("mousedown", noDocumento);
    document.addEventListener("keydown", naTecla);
    return () => {
      document.removeEventListener("mousedown", noDocumento);
      document.removeEventListener("keydown", naTecla);
    };
  }, [aberto]);

  function escolher(nome: string) {
    setAberto(false);
    if (nome === atual) return;
    salvarBairro(nome);
    router.refresh();
  }

  return (
    <div ref={caixa} className="relative">
      <button
        type="button"
        onClick={() => setAberto((v) => !v)}
        aria-expanded={aberto}
        aria-haspopup="listbox"
        className={`flex items-center gap-1.5 font-bold text-text hover:text-magenta-soft ${
          tamanho === "desktop" ? "text-[17px]" : "text-[17px]"
        }`}
      >
        <svg width="13" height="13" viewBox="0 0 24 24" fill="#ff3d81" className="shrink-0">
          <path d="M12 2C8 2 5 5 5 9c0 5 7 13 7 13s7-8 7-13c0-4-3-7-7-7zm0 9.5A2.5 2.5 0 1112 6a2.5 2.5 0 010 5.5z" />
        </svg>
        {atual}
        <svg
          width="12"
          height="12"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth={2.5}
          className={`shrink-0 text-muted-2 transition-transform ${aberto ? "rotate-180" : ""}`}
        >
          <path d="M6 9l6 6 6-6" />
        </svg>
      </button>

      {aberto && (
        <div
          role="listbox"
          aria-label="Escolher bairro"
          className="absolute top-full left-0 z-20 mt-2 w-[17rem] overflow-hidden rounded-[18px] border border-white/10 bg-card-alt shadow-2xl shadow-black/60"
        >
          {BAIRROS.map((b, i) => {
            const ativo = b.nome === atual;
            return (
              <button
                key={b.nome}
                type="button"
                role="option"
                aria-selected={ativo}
                onClick={() => escolher(b.nome)}
                className={`flex w-full items-start gap-3 px-4 py-3.5 text-left transition-colors hover:bg-white/4 ${
                  i > 0 ? "border-t border-white/6" : ""
                }`}
              >
                <div className="min-w-0 flex-1">
                  <div className={`text-[14.5px] font-bold ${ativo ? "text-magenta" : ""}`}>
                    {b.nome}
                  </div>
                  <div className="mt-0.5 text-[11.5px] leading-snug text-muted-3">
                    {b.descricao}
                  </div>
                </div>
                {ativo && (
                  <svg
                    width="15"
                    height="15"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="#ff3d81"
                    strokeWidth={3}
                    className="mt-1 shrink-0"
                  >
                    <path d="M5 13l4 4L19 7" />
                  </svg>
                )}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
