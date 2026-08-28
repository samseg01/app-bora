"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { api, ApiError } from "@/lib/api";
import { useSessao } from "@/lib/auth";
import type { LugarPublic } from "@/lib/types";

/**
 * Publicar um rolê. É esta tela que substitui a planilha quando ela travar — o curador
 * volta da rua e publica do celular, sem `seed.py` nem SQL.
 *
 * O campo do **motivo pra ir** é o maior de propósito: é o que faz alguém sair de casa,
 * e num bar sem agenda ele carrega sozinho o card inteiro.
 *
 * Não há campo de categoria aqui: ela é do lugar, e o rolê herda. O seletor mostra a
 * categoria junto do nome para que a herança fique visível na hora de escolher.
 *
 * Horário vira data hoje. Depois da meia-noite conta como o dia seguinte, senão o rolê
 * nasceria terminado e a `/descoberta` não o veria — mesma regra do seed.
 */
const CAMPO =
  "w-full rounded-2xl border border-white/10 bg-sunken px-3.5 py-3 text-[13.5px] text-text outline-none placeholder:text-muted-3 focus:border-white/25";

function hojeAs(hhmm: string): Date {
  const [h, m] = hhmm.split(":").map(Number);
  const d = new Date();
  d.setHours(h, m, 0, 0);
  if (h < 6) d.setDate(d.getDate() + 1);
  return d;
}

export function FormPublicar({
  lugares,
  bairro,
  compacto = false,
}: {
  lugares: LugarPublic[];
  bairro: string;
  compacto?: boolean;
}) {
  const sessao = useSessao();
  const router = useRouter();

  const [lugarId, setLugarId] = useState(lugares[0]?.id ?? "");
  const [titulo, setTitulo] = useState("");
  const [descricao, setDescricao] = useState("");
  const [inicio, setInicio] = useState("21:00");
  const [fim, setFim] = useState("02:00");
  const [estado, setEstado] = useState<"parado" | "enviando" | "feito">("parado");
  const [erro, setErro] = useState<string | null>(null);

  const semLugares = lugares.length === 0;

  async function publicar(e: React.FormEvent) {
    e.preventDefault();
    if (!sessao) return;
    setEstado("enviando");
    setErro(null);
    try {
      const dInicio = hojeAs(inicio);
      const dFim = hojeAs(fim);
      if (dFim <= dInicio) dFim.setDate(dFim.getDate() + 1);

      // A categoria é do LUGAR, não do rolê: um boteco continua boteco em qualquer
      // noite. Antes o formulário perguntava de novo aqui, e o resultado era o Bar do
      // China cadastrado como "forró" publicando rolê como "Bar".
      const categoria = lugares.find((l) => l.id === lugarId)?.categoria ?? "Bar";

      await api.criarRole(sessao.token, {
        lugar_id: lugarId,
        titulo: titulo.trim(),
        descricao: descricao.trim() || null,
        categoria,
        data_inicio: dInicio.toISOString(),
        data_fim: dFim.toISOString(),
      });
      setEstado("feito");
      setTitulo("");
      setDescricao("");
      router.refresh();
    } catch (err) {
      setEstado("parado");
      setErro(
        err instanceof ApiError && err.status === 403
          ? "Sua conta não é de curador."
          : "Não deu pra publicar. Confere os campos e tenta de novo.",
      );
    }
  }

  if (semLugares) {
    return (
      <div className="flex flex-col gap-3 rounded-[22px] border border-white/7 bg-card-alt p-5.5">
        <h2 className="font-display text-[26px] leading-none uppercase">Publicar rolê</h2>
        {/* Os asteriscos de markdown apareciam literalmente na tela: isto é JSX, não
            texto formatado. E a instrução era beco sem saída — "cadastre em Lugares"
            sem link, na única tela em que a pessoa precisa exatamente disso. */}
        <p className="text-xs leading-relaxed text-muted-2">
          Nenhum lugar cadastrado em {bairro} ainda. Um rolê acontece <em>em</em> um lugar, então
          o lugar vem primeiro.
        </p>
        <Link
          href="/curador/lugares"
          className="rounded-2xl bg-magenta py-3 text-center text-[13.5px] font-bold text-white"
        >
          Cadastrar o primeiro lugar
        </Link>
      </div>
    );
  }

  return (
    <form
      onSubmit={publicar}
      className={`flex flex-col gap-3.5 rounded-[22px] border border-white/7 bg-card-alt p-5.5 ${
        compacto ? "" : "h-full"
      }`}
    >
      <div>
        <h2 className="font-display text-[26px] leading-none uppercase">Publicar rolê</h2>
        <p className="mt-2 text-xs leading-relaxed text-muted-2">
          Você acabou de sair de lá. Escreva enquanto está fresco.
        </p>
      </div>

      <label className="flex flex-col gap-1.5">
        <span className="rotulo text-muted-3">lugar</span>
        <select className={CAMPO} value={lugarId} onChange={(e) => setLugarId(e.target.value)}>
          {lugares.map((l) => (
            <option key={l.id} value={l.id}>
              {l.nome} · {l.categoria}
            </option>
          ))}
        </select>
      </label>

      <label className="flex flex-col gap-1.5">
        <span className="rotulo text-muted-3">título</span>
        <input
          className={CAMPO}
          value={titulo}
          onChange={(e) => setTitulo(e.target.value)}
          placeholder="Chopp em dobro até 22h"
          required
          maxLength={160}
        />
      </label>

      <label className="flex flex-col gap-1.5">
        <span className="flex items-baseline justify-between">
          <span className="rotulo text-amber">motivo pra ir</span>
          <span className="text-[11px] text-muted-3">o que você viu lá</span>
        </span>
        <textarea
          rows={compacto ? 3 : 4}
          value={descricao}
          onChange={(e) => setDescricao(e.target.value)}
          className={`${CAMPO} resize-none border-amber/35 leading-relaxed`}
          placeholder="Balcão antigo, cerveja gelada e sem couvert."
          maxLength={2000}
        />
      </label>

      <div className="flex gap-2.5">
        <label className="flex flex-1 flex-col gap-1.5">
          <span className="rotulo text-muted-3">começa</span>
          <input type="time" className={CAMPO} value={inicio} onChange={(e) => setInicio(e.target.value)} />
        </label>
        <label className="flex flex-1 flex-col gap-1.5">
          <span className="rotulo text-muted-3">termina</span>
          <input type="time" className={CAMPO} value={fim} onChange={(e) => setFim(e.target.value)} />
        </label>
      </div>

      <div className="mt-auto flex flex-col gap-2.5">
        <button
          type="submit"
          disabled={estado === "enviando"}
          className="rounded-2xl bg-magenta py-3.5 text-[14.5px] font-bold text-white disabled:opacity-60"
        >
          {estado === "enviando" ? "Publicando…" : `Publicar em ${bairro}`}
        </button>
        <p className="text-center text-[11.5px] leading-snug text-muted-3">
          {erro ??
            (estado === "feito"
              ? "No ar. Some sozinho no horário de término."
              : "Some sozinho no horário de término. Nada de despublicar na mão.")}
        </p>
      </div>
    </form>
  );
}
