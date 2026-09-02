"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { api } from "@/lib/api";
import { useSessao } from "@/lib/auth";

/**
 * Tirar um rolê do ar antes da hora.
 *
 * Pede confirmação num segundo toque em vez de abrir diálogo: o botão fica ao lado de
 * "Editar" numa lista, e apagar por engano numa lista é fácil demais.
 *
 * O uso normal não é este — todo rolê some sozinho no horário de término. Isto serve
 * para quando a informação estava errada, e é aí que apagar é a ação certa: rolê errado
 * no ar custa mais que rolê ausente.
 */
export function TirarDoAr({ roleId }: { roleId: string }) {
  const sessao = useSessao();
  const router = useRouter();
  const [confirmando, setConfirmando] = useState(false);
  const [ocupado, setOcupado] = useState(false);

  async function remover() {
    if (!sessao) return;
    setOcupado(true);
    try {
      await api.removerRole(sessao.token, roleId);
      router.refresh();
    } finally {
      setOcupado(false);
      setConfirmando(false);
    }
  }

  if (confirmando) {
    return (
      <div className="flex shrink-0 gap-1.5">
        <button
          type="button"
          onClick={remover}
          disabled={ocupado}
          className="rounded-[12px]  bg-text px-3 py-2 text-xs font-bold text-bg disabled:opacity-60"
        >
          {ocupado ? "…" : "Confirmar"}
        </button>
        <button
          type="button"
          onClick={() => setConfirmando(false)}
          className="rounded-[12px]  border border-linha px-3 py-2 text-xs font-semibold text-muted-2"
        >
          Não
        </button>
      </div>
    );
  }

  return (
    <button
      type="button"
      onClick={() => setConfirmando(true)}
      className="rounded-[12px] shrink-0 border border-linha px-3 py-2 text-xs font-semibold text-muted-2 transition-colors hover:border-linha-forte hover:text-text-soft"
    >
      Tirar do ar
    </button>
  );
}
