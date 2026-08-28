"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { api } from "@/lib/api";
import { guardarDestino, useSessao } from "@/lib/auth";

/**
 * Comentar num rolê — a contribuição que **todo mundo** pode dar.
 *
 * Vivia dentro da confirmação de sinalização (a tela 2e), e só aparecia depois de marcar
 * presença. Mas `POST /comentarios` aceita qualquer autenticado, e sinalizar é restrito a
 * curador e dono (ADR-0006): o resultado era que a única contribuição permitida a uma
 * conta comum estava trancada atrás da ação que ela não pode executar. Entrar no app não
 * destravava nada além de salvar.
 *
 * Agora fica no detalhe do rolê, por conta própria. Quem sinalizou também vê — comentar
 * depois de chegar continua sendo o caso mais comum, só não é mais o único.
 *
 * Deslogado leva para entrar guardando o destino, como o resto do app: público para ler,
 * conta só quando você quer deixar algo seu.
 */
export function ContarComoEsta({ roleId }: { roleId: string }) {
  const sessao = useSessao();
  const caminho = usePathname();
  const router = useRouter();

  const [abrindo, setAbrindo] = useState(false);
  const [texto, setTexto] = useState("");
  const [enviando, setEnviando] = useState(false);
  const [enviado, setEnviado] = useState(false);
  const [erro, setErro] = useState(false);

  async function enviar() {
    if (!sessao || !texto.trim()) return;
    setEnviando(true);
    setErro(false);
    try {
      await api.comentar(sessao.token, roleId, texto.trim());
      setEnviado(true);
      setTexto("");
      // O comentário aparece na lista do lugar, que é renderizada no servidor.
      router.refresh();
    } catch {
      setErro(true);
    } finally {
      setEnviando(false);
    }
  }

  if (enviado) {
    return (
      <p className="rounded-2xl border border-white/8 bg-card-alt px-4 py-3.5 text-center text-[13px] text-text-faint">
        Contado. Quem abrir esse lugar vê.
      </p>
    );
  }

  if (!sessao) {
    return (
      <Link
        href="/entrar"
        onClick={() => guardarDestino(caminho)}
        className="block rounded-2xl border border-white/16 py-3.5 text-center text-[14px] font-semibold text-text-soft"
      >
        Entrar para contar como está
      </Link>
    );
  }

  if (!abrindo) {
    return (
      <button
        type="button"
        onClick={() => setAbrindo(true)}
        className="w-full rounded-2xl border border-white/16 py-3.5 text-[14px] font-semibold text-text-soft hover:border-white/30"
      >
        Contar como está lá dentro
      </button>
    );
  }

  return (
    <div className="flex flex-col gap-2.5">
      <textarea
        rows={3}
        autoFocus
        value={texto}
        onChange={(e) => setTexto(e.target.value)}
        placeholder="fila andando, som bom, cabe gente…"
        maxLength={2000}
        className="w-full resize-none rounded-2xl border border-white/10 bg-sunken px-4 py-3 text-[13.5px] text-text outline-none placeholder:text-muted-3 focus:border-magenta"
      />
      <button
        type="button"
        onClick={enviar}
        disabled={enviando || !texto.trim()}
        className="rounded-2xl bg-magenta py-3 text-[14px] font-bold text-white disabled:opacity-50"
      >
        {enviando ? "Contando…" : "Contar"}
      </button>
      <p className="text-center text-[11.5px] leading-snug text-muted-3">
        {erro
          ? "Não deu pra enviar. Tenta de novo."
          : "Comentário é assinado com seu nome — diferente do sinal, que é anônimo."}
      </p>
    </div>
  );
}
