"use client";

import { useState } from "react";
import { api } from "@/lib/api";
import { useSessao } from "@/lib/auth";
import type { LugarPublic } from "@/lib/types";

/**
 * Corrigir a ficha de um lugar já cadastrado.
 *
 * Nasceu cobrindo só endereço e coordenada, e isso virou um buraco na mesma tarde: a
 * migration 0004 acrescentou descrição, instagram, horário, preço e a foto — e os lugares
 * cadastrados antes dela não tinham como receber nada disso. Cadastrar de novo para
 * preencher um campo perderia os salvos e comentários já ligados àquele lugar.
 *
 * Fora daqui de propósito: nome e categoria. Errar esses dois é cadastro errado, e o
 * certo é tirar do ar e refazer — não emendar.
 */
const CAMPO =
  "w-full rounded-xl border border-white/10 bg-sunken px-3 py-2.5 text-[13px] text-text outline-none placeholder:text-muted-3 focus:border-white/25";

function soIdentificador(entrada: string): string {
  return entrada
    .trim()
    .replace(/^@/, "")
    .replace(/^https?:\/\/(www\.)?instagram\.com\//, "")
    .replace(/\/$/, "");
}

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
  const [descricao, setDescricao] = useState(lugar.descricao ?? "");
  const [instagram, setInstagram] = useState(lugar.instagram ?? "");
  const [horario, setHorario] = useState(lugar.horario_funcionamento ?? "");
  const [programacao, setProgramacao] = useState(lugar.programacao ?? "");
  const [preco, setPreco] = useState(lugar.preco_longneck ?? "");
  const [foto, setFoto] = useState(lugar.fotos?.[0] ?? "");
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
    const valor = preco.toString().trim().replace(",", ".");
    if (valor && !Number.isFinite(Number(valor))) {
      setErro("O preço precisa ser um número: 12,00");
      return;
    }
    setSalvando(true);
    setErro(null);
    try {
      const atualizado = await api.atualizarLugar(sessao.token, lugar.id, {
        endereco: endereco.trim() || null,
        descricao: descricao.trim() || null,
        instagram: soIdentificador(instagram) || null,
        horario_funcionamento: horario.trim() || null,
        programacao: programacao.trim() || null,
        preco_longneck: valor ? Number(valor) : null,
        fotos: foto.trim() ? [foto.trim()] : null,
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

  return (
    <div className="mt-3 flex w-full flex-col gap-2 border-t border-white/8 pt-3">
      <textarea
        rows={3}
        className={`${CAMPO} resize-none leading-relaxed`}
        value={descricao}
        onChange={(e) => setDescricao(e.target.value)}
        placeholder="o que é a casa"
        maxLength={2000}
      />
      <input
        className={CAMPO}
        value={endereco}
        onChange={(e) => setEndereco(e.target.value)}
        placeholder="endereço"
        maxLength={255}
      />
      <div className="flex gap-2">
        <input
          className={`${CAMPO} flex-1`}
          value={horario}
          onChange={(e) => setHorario(e.target.value)}
          placeholder="ter a dom, 18h–02h"
          maxLength={255}
        />
        <input
          className={`${CAMPO} w-24 shrink-0`}
          value={preco}
          onChange={(e) => setPreco(e.target.value)}
          placeholder="12,00"
          inputMode="decimal"
        />
      </div>
      <textarea
        rows={2}
        className={`${CAMPO} resize-none leading-relaxed`}
        value={programacao}
        onChange={(e) => setProgramacao(e.target.value)}
        placeholder="toda semana: quinta é forró"
        maxLength={2000}
      />
      <input
        className={CAMPO}
        value={instagram}
        onChange={(e) => setInstagram(e.target.value)}
        placeholder="@perfil"
        maxLength={80}
      />
      {/* URL enquanto não há armazenamento de arquivo (item 45 do TODO). Quando existir,
          o campo continua o mesmo — só muda de onde a URL vem. */}
      <input
        className={CAMPO}
        value={foto}
        onChange={(e) => setFoto(e.target.value)}
        placeholder="url da foto do lugar"
      />
      <input
        className={`${CAMPO} font-mono`}
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
