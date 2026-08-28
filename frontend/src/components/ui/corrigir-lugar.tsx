"use client";

import { useState } from "react";
import { api } from "@/lib/api";
import { useSessao } from "@/lib/auth";
import type { LugarPublic } from "@/lib/types";

/**
 * Corrigir endereço e coordenada de um lugar já cadastrado.
 *
 * O `PATCH /curador/lugares/{id}` existe no backend desde o esqueleto e nunca teve
 * formulário. Na prática isso significava que um erro cometido na calçada — coordenada
 * colada da quadra errada, endereço em branco — só se arrumava com SQL. Numa rotina cuja
 * premissa é cadastrar em campo, com pressa e sinal ruim, errar é o caso normal, não a
 * exceção.
 *
 * Só endereço e coordenada: nome e categoria erradas são cadastro errado, e aí o certo é
 * tirar do ar e refazer. Estes dois são os que se descobre depois, olhando o pin no mapa.
 */
export function CorrigirLugar({
  lugar,
  aoSalvar,
}: {
  lugar: LugarPublic;
  aoSalvar: (atualizado: LugarPublic) => void;
}) {
  const sessao = useSessao();
  const [aberto, setAberto] = useState(false);
  const [endereco, setEndereco] = useState(lugar.endereco ?? "");
  const [coords, setCoords] = useState(`${lugar.lat}, ${lugar.lng}`);
  const [erro, setErro] = useState<string | null>(null);
  const [salvando, setSalvando] = useState(false);

  async function salvar() {
    if (!sessao) return;
    const [lat, lng] = coords.split(",").map((n) => Number(n.trim()));
    if (!Number.isFinite(lat) || !Number.isFinite(lng)) {
      setErro("Cole as coordenadas do Google Maps: -23.5441, -46.6396");
      return;
    }
    setSalvando(true);
    setErro(null);
    try {
      const atualizado = await api.atualizarLugar(sessao.token, lugar.id, {
        endereco: endereco.trim() || null,
        lat,
        lng,
      });
      aoSalvar(atualizado);
      setAberto(false);
    } catch {
      setErro("Não deu pra salvar. Tenta de novo.");
    } finally {
      setSalvando(false);
    }
  }

  if (!aberto) {
    return (
      <button
        type="button"
        onClick={() => setAberto(true)}
        className="shrink-0 text-[11.5px] font-semibold text-muted-2 hover:text-magenta-soft"
      >
        corrigir
      </button>
    );
  }

  const campo =
    "w-full rounded-xl border border-white/10 bg-sunken px-3 py-2.5 text-[13px] text-text outline-none placeholder:text-muted-3 focus:border-white/25";

  return (
    <div className="mt-3 flex w-full flex-col gap-2 border-t border-white/8 pt-3">
      <input
        className={campo}
        value={endereco}
        onChange={(e) => setEndereco(e.target.value)}
        placeholder="endereço (opcional)"
        maxLength={255}
      />
      <input
        className={`${campo} font-mono`}
        value={coords}
        onChange={(e) => setCoords(e.target.value)}
        placeholder="-23.5441, -46.6396"
      />
      <div className="flex gap-2">
        <button
          type="button"
          onClick={salvar}
          disabled={salvando}
          className="flex-1 rounded-xl bg-magenta py-2.5 text-[13px] font-bold text-white disabled:opacity-60"
        >
          {salvando ? "Salvando…" : "Salvar"}
        </button>
        <button
          type="button"
          onClick={() => setAberto(false)}
          className="rounded-xl border border-white/14 px-4 py-2.5 text-[13px] font-semibold text-muted-2"
        >
          Cancelar
        </button>
      </div>
      {erro && <p className="text-[11.5px] text-amber">{erro}</p>}
    </div>
  );
}
