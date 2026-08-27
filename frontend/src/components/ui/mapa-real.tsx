"use client";

import { useEffect, useRef, useState } from "react";
import type { Map as MapLibreMap, Marker } from "maplibre-gl";
import "maplibre-gl/dist/maplibre-gl.css";
import { MapaEstilizado } from "./mapa-estilizado";
import { frescorUI } from "@/lib/frescor";
import type { MapaPin } from "@/lib/types";

/**
 * Mapa de verdade: MapLibre GL com o basemap **dark-matter da CARTO**.
 *
 * Por que este basemap: é escuro e dessaturado, então convive com o `#08060f` do app
 * em vez de brigar com ele, e faz os pins magenta/âmbar/ciano saltarem. E **não exige
 * chave de API** — uma credencial a menos no deploy.
 *
 * ## Os dois contextos WebGL
 *
 * As duas partições (mobile e desktop) renderizam a mesma árvore, então ingenuamente
 * haveria **dois mapas na mesma página** — dois contextos WebGL, dos quais o navegador
 * concede poucos. A solução aqui não é escolher a partição em JS (o que traria de volta
 * o flash de hidratação que a partição por CSS evita): é **iniciar o mapa só quando o
 * container tem tamanho**. A partição escondida está em `display:none`, logo tem
 * 0×0, logo nunca instancia nada. Redimensionar a janela through do breakpoint faz o
 * antigo se destruir e o novo nascer, sozinhos.
 *
 * ## Degradação
 *
 * Enquanto o estilo não carrega — e para sempre, se ele falhar — o mapa abstrato
 * (`MapaEstilizado`) fica por baixo com os pins projetados. Isso importa num app de
 * rua: sinal ruim não pode virar retângulo vazio.
 *
 * A atribuição da CARTO/OpenStreetMap é obrigatória por licença. Ela fica em modo
 * compacto, mas **não pode ser removida**.
 */

const ESTILO = "https://basemaps.cartocdn.com/gl/dark-matter-gl-style/style.json";

interface Props {
  pins: MapaPin[];
  etiqueta?: string;
  className?: string;
  children?: React.ReactNode;
  selecionadoId?: string | null;
  onSelecionar?: (lugarId: string) => void;
}

export function MapaReal({
  pins,
  etiqueta,
  className = "",
  children,
  selecionadoId,
  onSelecionar,
}: Props) {
  const container = useRef<HTMLDivElement>(null);
  const mapa = useRef<MapLibreMap | null>(null);
  const marcadores = useRef<Marker[]>([]);
  const [pronto, setPronto] = useState(false);
  /**
   * Só em desenvolvimento: mostra na tela por que o mapa não subiu. A primeira
   * versão engolia o erro, o que tornava impossível depurar sem abrir o console.
   */
  const [erro, setErro] = useState<string | null>(null);

  // Guardados em ref para o efeito de inicialização não depender deles e reiniciar o
  // mapa a cada render. A sincronia vai num efeito próprio: escrever em ref durante o
  // render é impuro e o React Compiler recusa.
  const pinsRef = useRef(pins);
  const onSelecionarRef = useRef(onSelecionar);

  useEffect(() => {
    pinsRef.current = pins;
    onSelecionarRef.current = onSelecionar;
  });

  useEffect(() => {
    const el = container.current;
    if (!el) return;

    let cancelado = false;

    async function iniciar() {
      if (mapa.current || cancelado || !container.current) return;
      let MapaGL, AttributionControl, LngLatBounds;
      try {
        ({ Map: MapaGL, AttributionControl, LngLatBounds } = await import("maplibre-gl"));
      } catch (e) {
        console.error("[mapa] falha ao carregar maplibre-gl", e);
        setErro(`import maplibre-gl: ${e instanceof Error ? e.message : String(e)}`);
        return;
      }
      if (cancelado || !container.current || mapa.current) return;

      try {
        const m = new MapaGL({
          container: container.current,
          style: ESTILO,
          center: [-46.6417, -23.5445], // centro de SP; o fitBounds abaixo corrige
          zoom: 14,
          attributionControl: false,
        });
        m.addControl(new AttributionControl({ compact: true }));
        mapa.current = m;

        m.on("load", () => {
          if (cancelado) return;
          const atuais = pinsRef.current;
          if (atuais.length > 0) {
            const b = new LngLatBounds();
            atuais.forEach((p) => b.extend([p.lugar.lng, p.lugar.lat]));
            m.fitBounds(b, { padding: 56, maxZoom: 16, animate: false });
          }
          setPronto(true);
        });

        // Estilo indisponível (rede ruim, CDN bloqueado): fica o mapa abstrato por baixo.
        m.on("error", (e) => {
          const msg = (e as { error?: { message?: string } }).error?.message ?? "erro desconhecido";
          console.error("[mapa] maplibre:", msg, e);
          setErro(msg);
        });
      } catch (e) {
        console.error("[mapa] falha ao instanciar", e);
        setErro(`new Map: ${e instanceof Error ? e.message : String(e)}`);
      }
    }

    function destruir() {
      marcadores.current.forEach((mk) => mk.remove());
      marcadores.current = [];
      mapa.current?.remove();
      mapa.current = null;
      setPronto(false);
    }

    // O gatilho é o tamanho: a partição escondida é 0×0 e nunca instancia mapa nenhum.
    const ro = new ResizeObserver(([entrada]) => {
      const { width, height } = entrada.contentRect;
      if (width > 0 && height > 0) {
        if (mapa.current) mapa.current.resize();
        else void iniciar();
      } else if (mapa.current) {
        destruir();
      }
    });
    ro.observe(el);

    return () => {
      cancelado = true;
      ro.disconnect();
      destruir();
    };
  }, []);

  // Marcadores: refeitos quando os pins ou a seleção mudam.
  useEffect(() => {
    const m = mapa.current;
    if (!m || !pronto) return;

    let vivo = true;
    void (async () => {
      const { Marker: MarcadorGL } = await import("maplibre-gl");
      if (!vivo || !mapa.current) return;

      marcadores.current.forEach((mk) => mk.remove());
      marcadores.current = pins.map((pin) => {
        const ui = frescorUI(pin.role_ativo?.frescor ?? null);
        const temRole = pin.role_ativo !== null;

        const el = document.createElement("button");
        el.type = "button";
        el.setAttribute("aria-label", pin.lugar.nome);
        el.className = [
          "rounded-full border border-black/40 shadow-lg",
          temRole ? "h-3.5 w-3.5" : "h-2.5 w-2.5",
          ui ? ui.pin : "bg-pin-off",
          ui?.pulsa ? "pulse-agora" : "",
          selecionadoId === pin.lugar.id ? "ring-3 ring-white/70" : "",
          onSelecionar ? "cursor-pointer" : "cursor-default",
        ].join(" ");
        if (onSelecionar) {
          el.addEventListener("click", (e) => {
            e.stopPropagation();
            onSelecionarRef.current?.(pin.lugar.id);
          });
        }

        return new MarcadorGL({ element: el })
          .setLngLat([pin.lugar.lng, pin.lugar.lat])
          .addTo(mapa.current!);
      });
    })();

    return () => {
      vivo = false;
    };
  }, [pins, selecionadoId, onSelecionar, pronto]);

  return (
    <div className={`relative overflow-hidden ${className}`}>
      {/* Base: o mapa abstrato, visível até o real carregar — e permanentemente se ele falhar. */}
      <div className={`absolute inset-0 transition-opacity ${pronto ? "opacity-0" : "opacity-100"}`}>
        <MapaEstilizado pins={pins} className="h-full w-full" />
      </div>

      <div ref={container} className="absolute inset-0" />

      {etiqueta && (
        <span className="pointer-events-none absolute top-3 left-3 z-3 rounded-full bg-surface/80 px-2.5 py-1 text-[11px] font-semibold text-text-faint backdrop-blur-sm">
          {etiqueta}
        </span>
      )}

      {children}

      {erro && process.env.NODE_ENV !== "production" && (
        <div className="absolute inset-x-3 bottom-3 z-5 rounded-xl border border-amber/40 bg-surface/95 px-3 py-2 text-[11px] leading-snug text-amber">
          mapa não carregou: {erro}
        </div>
      )}
    </div>
  );
}
