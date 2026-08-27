"use client";

import { useState } from "react";
import Link from "next/link";
import { MapaReal } from "@/components/ui/mapa-real";
import { DesktopShell } from "./shell";
import { frescorUI } from "@/lib/frescor";
import { hora, idade } from "@/lib/tempo";
import type { ComentarioResumo, MapaPin } from "@/lib/types";

/**
 * Mapa em tela cheia, visualização desktop. A diferença de fundo em relação ao
 * telefone: a lista do bairro deixa de ser uma gaveta que cobre o mapa e vira coluna
 * permanente ao lado dele — dá para varrer a lista e ver onde cada coisa fica ao
 * mesmo tempo, que é o que o telefone nunca permite.
 */
export function MapaDesktop({
  pins,
  bairro,
  comentarios,
}: {
  pins: MapaPin[];
  bairro: string;
  comentarios?: Record<string, ComentarioResumo[]>;
}) {
  const primeiroComRole = pins.find((p) => p.role_ativo) ?? pins[0];
  const [selecionadoId, setSelecionadoId] = useState<string | null>(
    primeiroComRole?.lugar.id ?? null,
  );
  const selecionado = pins.find((p) => p.lugar.id === selecionadoId) ?? null;
  const comRole = pins.filter((p) => p.role_ativo).length;

  return (
    <DesktopShell>
      <section className="flex w-[348px] shrink-0 flex-col border-r border-white/7">
        <div className="px-6 pt-7 pb-4">
          <h1 className="font-display text-[30px] leading-none uppercase">O bairro agora</h1>
          {pins.length > 0 ? (
            <p className="mt-2 text-[12.5px] text-muted-2">
              {pins.length} {pins.length === 1 ? "lugar curado" : "lugares curados"} · {comRole} com
              movimento
            </p>
          ) : (
            <p className="mt-2 text-[12.5px] text-muted-2">nenhum lugar curado ainda</p>
          )}
        </div>

        <div className="flex flex-col gap-2 px-4">
          {pins.length === 0 && (
            <p className="px-2 text-[13px] leading-relaxed text-muted text-pretty">
              O mapa fica vazio até alguém andar por aqui. É de propósito: pino sem visita
              não é informação.
            </p>
          )}
          {pins.map((pin) => {
            const ui = frescorUI(pin.role_ativo?.frescor ?? null);
            const ativo = pin.lugar.id === selecionadoId;
            return (
              <button
                key={pin.lugar.id}
                type="button"
                onClick={() => setSelecionadoId(pin.lugar.id)}
                className={`flex items-center gap-3 rounded-[18px] border p-3 text-left transition-colors ${
                  ativo ? "border-magenta/35 bg-card" : "border-transparent hover:bg-card/60"
                }`}
              >
                <div className="h-13 w-13 shrink-0 rounded-2xl bg-gradient-to-br from-violet to-plum" />
                <div className="min-w-0 flex-1">
                  <div className="truncate text-[14.5px] font-bold">{pin.lugar.nome}</div>
                  <div className="mt-0.5 truncate text-xs text-muted-2">
                    {pin.lugar.categoria} ·{" "}
                    {pin.total_comentarios === 0
                      ? "sem comentário"
                      : `${pin.total_comentarios} ${pin.total_comentarios === 1 ? "comentário" : "comentários"}`}
                  </div>
                </div>
                <span
                  className={`h-2.5 w-2.5 shrink-0 rounded-full ${ui ? ui.pin : "bg-pin-off"} ${ui?.pulsa ? "pulse-agora" : ""}`}
                />
              </button>
            );
          })}
        </div>
      </section>

      <section className="relative min-w-0 flex-1">
        <MapaReal
          pins={pins}
          etiqueta={`${bairro} · agora`}
          className="h-dvh"
          selecionadoId={selecionadoId}
          onSelecionar={setSelecionadoId}
        />

        {selecionado && (
          <div className="absolute top-7 right-7 flex w-[332px] flex-col gap-3.5 rounded-[22px] border border-white/9 bg-sunken/96 p-5">
            <div>
              <div className="text-lg font-bold">{selecionado.lugar.nome}</div>
              <div className="mt-1 text-xs text-muted-2">
                {selecionado.lugar.categoria}
                {selecionado.lugar.endereco ? ` · ${selecionado.lugar.endereco}` : ""}
              </div>
            </div>

            {selecionado.role_ativo && (
              <div className="flex items-center gap-2 rounded-2xl bg-magenta/12 px-3 py-2.5">
                <span
                  className={`h-[7px] w-[7px] rounded-full ${frescorUI(selecionado.role_ativo.frescor)?.pin ?? "bg-pin-off"} ${
                    selecionado.role_ativo.frescor === "live" ? "pulse-agora" : ""
                  }`}
                />
                <span className="text-[12.5px] font-semibold text-magenta-soft">
                  {selecionado.role_ativo.titulo} · até {hora(selecionado.role_ativo.data_fim)}
                </span>
              </div>
            )}

            {comentarios?.[selecionado.lugar.id]?.length ? (
              <div className="flex flex-col gap-3 border-t border-white/8 pt-3.5">
                {comentarios[selecionado.lugar.id].map((c) => (
                  <div key={c.created_at} className="flex items-start gap-2.5">
                    <div className="h-7 w-7 shrink-0 rounded-full bg-gradient-to-br from-violet to-cyan" />
                    <p className="text-[12.5px] leading-snug text-text-dim">
                      “{c.texto}” —{" "}
                      <span className="font-semibold text-white">{c.autor_nome}</span>,{" "}
                      {idade(c.created_at)}
                    </p>
                  </div>
                ))}
              </div>
            ) : null}

            <div className="flex gap-2.5">
              {selecionado.role_ativo ? (
                <Link
                  href={`/role/${selecionado.role_ativo.id}`}
                  className="flex-1 rounded-2xl bg-magenta py-3 text-center text-[13px] font-bold text-white"
                >
                  Ver o rolê
                </Link>
              ) : (
                <span className="flex-1 rounded-2xl border border-white/10 py-3 text-center text-[13px] font-semibold text-muted-3">
                  Sem rolê hoje
                </span>
              )}
              <a
                href={`https://www.google.com/maps/dir/?api=1&destination=${selecionado.lugar.lat},${selecionado.lugar.lng}`}
                target="_blank"
                rel="noreferrer"
                className="rounded-2xl border border-white/18 px-4.5 py-3 text-[13px] font-semibold text-text-soft"
              >
                Rota
              </a>
            </div>
          </div>
        )}
      </section>
    </DesktopShell>
  );
}
