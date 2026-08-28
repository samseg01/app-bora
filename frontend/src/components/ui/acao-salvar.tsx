"use client";

import { useEffect, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import { api, ApiError } from "@/lib/api";
import { guardarDestino, useSessao } from "@/lib/auth";
import { invalidarMeus, meusSalvos } from "@/lib/meus";

/**
 * Salvar um lugar no caderninho.
 *
 * Deslogado, o toque leva para entrar guardando o destino — é a auth preguiçosa do
 * plano: o app é público até você querer algo que é seu.
 *
 * `POST /salvos` devolve 409 quando já existe. Tratamos como sucesso: do ponto de vista
 * de quem tocou, o lugar está salvo, e mostrar erro seria contar um problema que não é
 * dela.
 */
export function AcaoSalvar({
  lugarId,
  variante = "pill",
}: {
  lugarId: string;
  variante?: "pill" | "botao";
}) {
  const sessao = useSessao();
  const router = useRouter();
  const caminho = usePathname();
  const token = sessao?.token;

  const [doServidor, setDoServidor] = useState<boolean | null>(null);
  const [ocupado, setOcupado] = useState(false);

  // Deslogado é sempre "não salvo", e isso se deriva no render — chamar setState no
  // corpo do efeito para dizer o óbvio é impuro e o React Compiler recusa.
  const salvo = token ? doServidor : false;

  useEffect(() => {
    if (!token) return;
    let vivo = true;
    // Compartilhado: numa home com cinco cards isto é uma chamada, não cinco.
    void meusSalvos(token).then((lista) => {
      if (vivo) setDoServidor(lista.some((s) => s.lugar_id === lugarId));
    });
    return () => {
      vivo = false;
    };
  }, [token, lugarId]);

  async function alternar() {
    if (!token) {
      guardarDestino(caminho);
      router.push("/entrar");
      return;
    }
    setOcupado(true);
    try {
      if (salvo) {
        await api.dessalvar(token, lugarId);
        setDoServidor(false);
      } else {
        await api.salvar(token, lugarId);
        setDoServidor(true);
      }
      invalidarMeus();
      router.refresh();
    } catch (e) {
      // 409 = já estava salvo; para quem tocou, o resultado é o mesmo.
      if (e instanceof ApiError && e.status === 409) setDoServidor(true);
      invalidarMeus();
    } finally {
      setOcupado(false);
    }
  }

  const rotulo = salvo ? "salvo" : "salvar";
  const base =
    variante === "pill"
      ? "flex shrink-0 items-center gap-1.5 rounded-full border px-3 py-2 text-xs font-semibold"
      : "flex w-full items-center justify-center gap-2 rounded-2xl border py-3 text-[13.5px] font-semibold";

  return (
    <button
      type="button"
      onClick={alternar}
      disabled={ocupado || salvo === null}
      aria-pressed={salvo === true}
      className={`${base} transition-colors disabled:opacity-50 ${
        salvo
          ? "border-magenta/45 bg-magenta/12 text-magenta-soft"
          : "border-white/18 text-text-soft hover:border-white/32"
      }`}
    >
      <svg
        width="14"
        height="14"
        viewBox="0 0 24 24"
        fill={salvo ? "#ff6fa0" : "none"}
        stroke="#ff6fa0"
        strokeWidth={2.2}
      >
        <path d="M12 21s-7-4.5-7-10a4 4 0 017-2.5A4 4 0 0119 11c0 5.5-7 10-7 10z" />
      </svg>
      {rotulo}
    </button>
  );
}
