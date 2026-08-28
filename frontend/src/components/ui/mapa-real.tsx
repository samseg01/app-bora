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
  const raiz = useRef<HTMLDivElement>(null);
  const container = useRef<HTMLDivElement>(null);
  const mapa = useRef<MapLibreMap | null>(null);
  const marcadores = useRef<Marker[]>([]);
  const [pronto, setPronto] = useState(false);
  /**
   * Só em desenvolvimento: mostra na tela por que o mapa não subiu. A primeira
   * versão engolia o erro, o que tornava impossível depurar sem abrir o console.
   */
  const [erro, setErro] = useState<string | null>(null);
  /** Diagnóstico de desenvolvimento: o que o ResizeObserver mediu e em que fase estamos. */
  const [diag, setDiag] = useState("montando");

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
    // Observamos a RAIZ, não o filho `absolute inset-0`: a raiz é quem carrega as
    // classes de dimensão (`h-dvh`, `flex-1`, `min-h-*`), e um filho absoluto pode
    // reportar contentRect de altura 0 antes do layout assentar — foi exatamente o
    // que aconteceu: "medido 836x0", e o mapa nunca inicializava.
    const el = raiz.current;
    const alvo = container.current;
    if (!el || !alvo) return;

    let cancelado = false;
    let limpezaGlobal: (() => void) | null = null;

    async function iniciar() {
      if (mapa.current || cancelado || !container.current) return;
      // O MapLibre exige container com altura; sem isso ele monta e não desenha nada.
      if (container.current.getBoundingClientRect().height === 0) {
        setDiag("container sem altura");
        return;
      }
      let MapaGL, AttributionControl, LngLatBounds;
      try {
        ({ Map: MapaGL, AttributionControl, LngLatBounds } = await import("maplibre-gl"));
      } catch (e) {
        console.error("[mapa] falha ao carregar maplibre-gl", e);
        setErro(`import maplibre-gl: ${e instanceof Error ? e.message : String(e)}`);
        return;
      }
      if (cancelado || !container.current || mapa.current) return;

      // Sem WebGL o MapLibre monta e nunca desenha. Distinguir isso de um bug nosso
      // importa: em ambiente headless/VM é comum não haver, e a degradação para o mapa
      // abstrato é a resposta certa.
      const teste = document.createElement("canvas");
      if (!teste.getContext("webgl2") && !teste.getContext("webgl")) {
        setDiag("sem WebGL neste navegador");
        setErro("WebGL indisponível");
        return;
      }

      // Erros globais durante a subida do mapa (o `map.on("error")` não pega tudo).
      const onErro = (ev: ErrorEvent) => setErro((a) => a ?? `erro: ${ev.message.slice(0, 120)}`);
      window.addEventListener("error", onErro);
      limpezaGlobal = () => window.removeEventListener("error", onErro);

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
        setDiag("construído, aguardando estilo");

        // O MapLibre mede o container na construção e, se der zero, cai num fallback
        // interno de 400x300 — foi o que aconteceu (canvas 836x300). Como o layout do
        // filho `absolute inset-0` só assenta depois, remedimos no frame seguinte.
        requestAnimationFrame(() => {
          if (!cancelado && mapa.current) mapa.current.resize();
        });

        m.on("styledata", () => setDiag("estilo carregado, aguardando render"));

        // Sonda: depois de alguns segundos, reporta o estado INTERNO do mapa — na tela,
        // não só no console. Um mapa que dispara `load` e mesmo assim não desenha era
        // indistinguível de um que nunca subiu; o canvas e o centro dizem qual é.
        setTimeout(() => {
          if (cancelado || !mapa.current) return;
          const c = mapa.current.getCanvas();
          const cont = container.current;
          const centro = mapa.current.getCenter();
          const resumo =
            `canvas ${c.width}x${c.height} · caixa ${cont?.clientWidth}x${cont?.clientHeight} · ` +
            `centro ${centro.lng.toFixed(4)},${centro.lat.toFixed(4)} · ` +
            `zoom ${mapa.current.getZoom().toFixed(1)} · estilo=${mapa.current.isStyleLoaded()}`;
          console.log(`[mapa] ${resumo}`);
          setDiag(resumo);
        }, 4000);

        const enquadrar = () => {
          const atuais = pinsRef.current;
          if (atuais.length === 0) return;

          // Um pin só — ou vários no mesmo ponto — dá bounds de área zero, e o
          // `fitBounds` resolve isso para zoom infinito / centro NaN: o mapa carrega,
          // dispara `load`, e desenha nada. É o caso do bairro piloto, que começa com
          // um lugar; a Vila Madalena fictícia, com seis, nunca expôs a falha.
          const lngs = atuais.map((p) => p.lugar.lng);
          const lats = atuais.map((p) => p.lugar.lat);
          const semExtensao =
            Math.max(...lngs) === Math.min(...lngs) && Math.max(...lats) === Math.min(...lats);

          if (semExtensao) {
            m.setCenter([lngs[0], lats[0]]);
            m.setZoom(15.5);
            return;
          }

          const b = new LngLatBounds();
          atuais.forEach((p) => b.extend([p.lugar.lng, p.lugar.lat]));
          m.fitBounds(b, { padding: 56, maxZoom: 16, animate: false });
        };

        m.on("load", () => {
          if (cancelado) return;
          enquadrar();
          setPronto(true);
        });

        // Tentei revelar no primeiro evento `render` para não depender do `load`, que é
        // mais exigente. Foi pior: em ambiente sem GPU o `render` dispara com o canvas
        // ainda vazio, e o mapa abstrato — que é a degradação — sumia dando lugar a um
        // retângulo em branco. `load` (estilo + primeiro render completo) é o único
        // sinal que garante que há mapa desenhado. Mantido.

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
      setDiag(`medido ${Math.round(width)}x${Math.round(height)}`);
      if (width > 0 && height > 0) {
        if (mapa.current) mapa.current.resize();
        else {
          setDiag(`iniciando (${Math.round(width)}x${Math.round(height)})`);
          void iniciar();
        }
      } else if (mapa.current) {
        destruir();
      }
    });
    ro.observe(el);
    // Fallback: se o RO não entregar nada, medir na mão logo após o primeiro frame.
    requestAnimationFrame(() => {
      if (mapa.current || cancelado) return;
      const r = el.getBoundingClientRect();
      setDiag(`rAF ${Math.round(r.width)}x${Math.round(r.height)}`);
      if (r.width > 0 && r.height > 0) void iniciar();
    });

    return () => {
      cancelado = true;
      ro.disconnect();
      limpezaGlobal?.();
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
    <div ref={raiz} className={`relative overflow-hidden ${className}`}>
      {/* Base: o mapa abstrato, visível até o real carregar — e permanentemente se ele falhar. */}
      <div className={`absolute inset-0 transition-opacity ${pronto ? "opacity-0" : "opacity-100"}`}>
        <MapaEstilizado pins={pins} className="h-full w-full" />
      </div>

      {/* `absolute inset-0` sozinho estava resolvendo para clientHeight 0, e o MapLibre
          então caía no fallback interno de 400x300 e nunca terminava de carregar.
          `h-full w-full` dá altura explícita a partir da raiz, que tem dimensão. */}
      <div ref={container} className="absolute inset-0 h-full w-full" />

      {etiqueta && (
        <span className="pointer-events-none absolute top-3 left-3 z-3 rounded-full bg-surface/80 px-2.5 py-1 text-[11px] font-semibold text-text-faint backdrop-blur-sm">
          {etiqueta}
        </span>
      )}

      {children}

      {/* Em dev o diagnóstico aparece SEMPRE, não só quando `pronto` é falso: a falha do
          pin único era justamente um mapa que se declarava pronto e desenhava vazio, e
          nesse estado a caixa ficava escondida — o sintoma apagava a própria pista.
          Vai no topo porque a gaveta do lugar selecionado ocupa o rodapé. */}
      {process.env.NODE_ENV !== "production" && (
        <div className="pointer-events-none absolute inset-x-3 top-12 z-5 rounded-xl border border-amber/40 bg-surface/95 px-3 py-2 font-mono text-[11px] leading-snug text-amber">
          [mapa] {pronto ? "pronto" : "carregando"} · {diag}
          {erro ? ` · erro: ${erro}` : ""}
        </div>
      )}
    </div>
  );
}
