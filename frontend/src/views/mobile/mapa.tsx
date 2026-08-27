"use client";

import { useState } from "react";
import Link from "next/link";
import { MapaReal } from "@/components/ui/mapa-real";
import { MobileShell } from "./shell";
import { frescorUI } from "@/lib/frescor";
import { hora, idade } from "@/lib/tempo";
import type { ComentarioResumo, MapaPin } from "@/lib/types";

/**
 * Tela 2f — mapa em tela cheia. O lugar selecionado sobe numa gaveta sobre o mapa,
 * porque no telefone não há largura para lista e mapa ao mesmo tempo.
 *
 * O filtro "Comentado agora" do design não existe aqui: `total_comentarios` é total
 * histórico, sem janela de tempo (ver ../TODO.md). "Salvos" espera a fase 3.
 */
export function MapaMobile({
  pins,
  bairro,
  comentarios,
}: {
  pins: MapaPin[];
  bairro: string;
  comentarios?: Record<string, ComentarioResumo[]>;
}) {
  const [soComRole, setSoComRole] = useState(false);
  const [selecionadoId, setSelecionadoId] = useState<string | null>(
    pins.find((p) => p.role_ativo)?.lugar.id ?? null,
  );

  const visiveis = soComRole ? pins.filter((p) => p.role_ativo) : pins;
  const selecionado = visiveis.find((p) => p.lugar.id === selecionadoId) ?? null;

  return (
    <MobileShell>
      <div className="relative flex-1">
        <MapaReal
          pins={visiveis}
          className="h-full min-h-100"
          selecionadoId={selecionadoId}
          onSelecionar={setSelecionadoId}
        />

        <div className="absolute inset-x-4 top-4 flex gap-2">
          <button
            type="button"
            onClick={() => setSoComRole(false)}
            className={`rounded-full px-3.5 py-2 text-xs font-semibold ${
              soComRole ? "border border-white/10 bg-sunken/90 text-text-faint" : "bg-magenta text-white"
            }`}
          >
            Todos
          </button>
          <button
            type="button"
            onClick={() => setSoComRole(true)}
            className={`rounded-full px-3.5 py-2 text-xs font-semibold ${
              soComRole ? "bg-magenta text-white" : "border border-white/10 bg-sunken/90 text-text-faint"
            }`}
          >
            Com rolê
          </button>
          <span className="ml-auto rounded-full bg-surface/70 px-3 py-2 text-[11px] font-semibold text-text-faint">
            {bairro}
          </span>
        </div>

        {selecionado && (
          <div className="absolute inset-x-4 bottom-4 flex flex-col gap-3 rounded-[22px] border border-white/9 bg-sunken/95 p-4">
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <div className="truncate text-[17px] font-bold">{selecionado.lugar.nome}</div>
                <div className="mt-0.5 text-xs text-muted-2">
                  {selecionado.lugar.categoria} ·{" "}
                  {selecionado.total_comentarios === 0
                    ? "sem comentário"
                    : `${selecionado.total_comentarios} ${selecionado.total_comentarios === 1 ? "comentário" : "comentários"}`}
                </div>
              </div>
              {selecionado.role_ativo && (
                <span
                  className={`mt-1.5 h-2.5 w-2.5 shrink-0 rounded-full ${frescorUI(selecionado.role_ativo.frescor)?.pin ?? "bg-pin-off"}`}
                />
              )}
            </div>

            {comentarios?.[selecionado.lugar.id]?.[0] && (
              <div className="flex items-start gap-2.5 border-t border-white/8 pt-3">
                <div className="h-7 w-7 shrink-0 rounded-full bg-gradient-to-br from-violet to-cyan" />
                <p className="text-[12.5px] leading-snug text-text-dim">
                  “{comentarios[selecionado.lugar.id][0].texto}” —{" "}
                  <span className="font-semibold text-white">
                    {comentarios[selecionado.lugar.id][0].autor_nome}
                  </span>
                  , {idade(comentarios[selecionado.lugar.id][0].created_at)}
                </p>
              </div>
            )}

            <div className="flex gap-2.5">
              {selecionado.role_ativo ? (
                <Link
                  href={`/role/${selecionado.role_ativo.id}`}
                  className="flex-1 rounded-2xl bg-magenta py-3 text-center text-[13.5px] font-bold text-white"
                >
                  Ver o rolê · até {hora(selecionado.role_ativo.data_fim)}
                </Link>
              ) : (
                <span className="flex-1 rounded-2xl border border-white/10 py-3 text-center text-[13.5px] font-semibold text-muted-3">
                  Sem rolê hoje
                </span>
              )}
              <a
                href={`https://www.google.com/maps/dir/?api=1&destination=${selecionado.lugar.lat},${selecionado.lugar.lng}`}
                target="_blank"
                rel="noreferrer"
                className="rounded-2xl border border-white/18 px-4 py-3 text-[13.5px] font-semibold text-text-soft"
              >
                Rota
              </a>
            </div>
          </div>
        )}
      </div>
    </MobileShell>
  );
}
