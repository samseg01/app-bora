"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useSessao } from "@/lib/auth";
import { meusSinais } from "@/lib/meus";

/**
 * O "Tô indo" da linha da home (visualização desktop).
 *
 * Continua sendo um **link para o detalhe**, não uma ação: sinalizar é um compromisso, e
 * o lugar de assumi-lo é a tela que mostra o rolê inteiro. O que ele passou a fazer é
 * dizer a verdade sobre o que já aconteceu — antes dizia "Tô indo" mesmo para quem já
 * tinha marcado, convidando a pessoa a fazer de novo algo que ela já fez.
 *
 * Enquanto a resposta não chega, mostra "Tô indo": é o estado da esmagadora maioria dos
 * cards, e piscar do marcado para o não-marcado seria pior que esperar.
 */
export function BotaoToIndo({ roleId }: { roleId: string }) {
  const sessao = useSessao();
  const token = sessao?.token;
  const [marcado, setMarcado] = useState(false);

  useEffect(() => {
    if (!token) return;
    let vivo = true;
    void meusSinais(token).then((sinais) => {
      if (vivo) setMarcado(sinais.some((s) => s.role_id === roleId));
    });
    return () => {
      vivo = false;
    };
  }, [token, roleId]);

  return (
    <Link
      href={`/role/${roleId}`}
      className={`flex items-center justify-center gap-1.5 rounded-2xl py-2.5 text-center text-[13px] font-bold ${
        marcado
          ? "border border-magenta/45 bg-magenta/12 text-magenta-soft"
          : "bg-magenta text-white"
      }`}
    >
      {marcado && (
        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={3}>
          <path d="M5 13l4 4L19 7" />
        </svg>
      )}
      {marcado ? "Tá marcado" : "Tô indo"}
    </Link>
  );
}
