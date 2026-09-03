"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import type { Map as MapLibreMap, Marker } from "maplibre-gl";
import "maplibre-gl/dist/maplibre-gl.css";
import { MapaEstilizado } from "./mapa-estilizado";
import { pinDaCategoria } from "@/lib/categorias";
import { frescorDominaOPin, frescorUI } from "@/lib/frescor";
import type { MapaPin } from "@/lib/types";

/**
 * Mapa de verdade: MapLibre GL com o basemap **dark-matter da CARTO**.
 *
 * Por que este basemap: é escuro, dessaturado e **não exige chave de API** — uma
 * credencial a menos no deploy.
 *
 * ⚠️ **A justificativa original expirou em 02/09.** Ele foi escolhido para conviver com
 * o `#08060f` arroxeado do sistema antigo e para fazer os pins magenta/âmbar/ciano
 * saltarem. O sistema agora é monocromático sobre preto puro, e o dark-matter tem um
 * viés azulado que pode ficar visível contra `#000000` — além de os pins terem virado
 * branco e cinza, que é um contraste bem menor sobre um mapa cinza-azulado do que
 * magenta era. **Precisa ser olhado em tela de verdade**; se brigar, as saídas são
 * trocar o estilo por um neutro ou aplicar `filter: grayscale()` no container.
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

/** O nome do lugar vem do banco e vira HTML aqui — escapar antes, sempre. */
function escapar(texto: string): string {
  const div = document.createElement("div");
  div.textContent = texto;
  return div.innerHTML;
}

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
  const router = useRouter();
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
  /**
   * A sonda achou o canvas fora de sincronia com o container. Existe porque a pior
   * falha deste componente é silenciosa: o mapa dispara `load`, se declara pronto e
   * desenha num canvas de 400x300 fora da vista. Sem este sinal, "pronto" e "quebrado"
   * são indistinguíveis olhando a tela.
   */
  const [suspeito, setSuspeito] = useState(false);

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
          const r = raiz.current;
          // O canvas é medido em pixels de dispositivo; a caixa, em CSS.
          const dpr = window.devicePixelRatio || 1;
          const alturaCaixa = cont?.clientHeight ?? 0;
          if (alturaCaixa === 0 || Math.abs(c.height / dpr - alturaCaixa) > 8) {
            setSuspeito(true);
          }
          const resumo =
            `canvas ${c.width}x${c.height} · caixa ${cont?.clientWidth}x${cont?.clientHeight} · ` +
            `raiz ${r?.clientWidth}x${r?.clientHeight} · ` +
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
    // A raiz é quem carrega as classes de dimensão; o container do MapLibre é um filho
    // `absolute inset-0` cuja ALTURA vinha resolvendo para zero nas composições em flex.
    // Medido em campo: `caixa 366x0` com a raiz visivelmente alta na tela, e o MapLibre
    // caindo no fallback interno de 400x300. `height:100%` num filho absoluto depende de
    // a altura do bloco contêiner ser definida, e num item de flex ela nem sempre é.
    // Então não dependemos mais de porcentagem: o observador já mediu a raiz, e a medida
    // vai direto para o container em pixels.
    const dimensionar = (width: number, height: number) => {
      if (!alvo || height <= 0) return;
      alvo.style.width = `${Math.round(width)}px`;
      alvo.style.height = `${Math.round(height)}px`;
    };

    const ro = new ResizeObserver(([entrada]) => {
      const { width, height } = entrada.contentRect;
      dimensionar(width, height);
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
      dimensionar(r.width, r.height);
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
      const { Marker: MarcadorGL, Popup: PopupGL } = await import("maplibre-gl");
      if (!vivo || !mapa.current) return;

      marcadores.current.forEach((mk) => mk.remove());
      marcadores.current = pins.map((pin) => {
        // Sem rolê o pin caía sempre em `bg-pin-off`, mesmo com o lugar aceso por sinal
        // próprio — um bar cheio numa terça ficava apagado para sempre. O frescor do rolê
        // vem primeiro por ser mais específico; o do lugar é a rede de segurança.
        const frescor = pin.role_ativo?.frescor ?? pin.frescor;
        const ui = frescorUI(frescor);

        const el = document.createElement("button");
        el.type = "button";
        el.setAttribute("aria-label", pin.lugar.nome);
        el.className = [
          "rounded-full border border-black/40 shadow-lg",
          // Tamanho E cor, como no hi-fi: os pins de lá eram 10px sem frescor, 14px
          // em warm/new e 16px em live. É redundância deliberada — um mapa lido de
          // relance, com o braço estendido na rua, precisa que o "está bombando"
          // chegue pelo tamanho antes de a cor ser processada.
          //
          // A camada 1 tinha achatado isso em dois tamanhos, porque sem cor a
          // escala inteira estava carregando sozinha o trabalho de três estados.
          frescor === "live" ? "h-4 w-4" : frescor === "warm" ? "h-3.5 w-3.5" : "h-3 w-3",
          // Sem frescor o pin mostra a CATEGORIA, não um cinza. O mapa de um bairro
          // sem rolê ficava inteiro apagado, dizendo sem querer que não havia nada
          // ali — quando havia casas que alguém foi visitar a pé.
          frescorDominaOPin(frescor) && ui ? ui.pin : pinDaCategoria(pin.lugar.categoria),
          ui?.pulsa ? "pulse-live" : "",
          selecionadoId === pin.lugar.id ? "ring-3 ring-white/70" : "",
          onSelecionar ? "cursor-pointer" : "cursor-default",
        ].join(" ");
        if (onSelecionar) {
          el.addEventListener("click", (e) => {
            e.stopPropagation();
            onSelecionarRef.current?.(pin.lugar.id);
          });
        }

        // Banner do pin: o pin sozinho é um ponto colorido sem nome, e na home e no
        // detalhe do rolê — que não têm gaveta — tocar nele não levava a lugar nenhum.
        // O balão inteiro é o link para a ficha da casa.
        const balao = document.createElement("a");
        balao.href = `/lugar/${pin.lugar.id}`;
        balao.className = "balao-pin";
        balao.innerHTML =
          `<strong>${escapar(pin.lugar.nome)}</strong>` +
          `<span>${escapar(pin.role_ativo ? pin.role_ativo.titulo : pin.lugar.categoria)}</span>`;
        // Navegação do lado do cliente: `<a>` puro recarregaria o app inteiro. Continua
        // sendo âncora de verdade, então abrir em nova aba e copiar link seguem valendo.
        balao.addEventListener("click", (e) => {
          if (e.metaKey || e.ctrlKey || e.shiftKey || e.button !== 0) return;
          e.preventDefault();
          router.push(`/lugar/${pin.lugar.id}`);
        });

        return new MarcadorGL({ element: el })
          .setLngLat([pin.lugar.lng, pin.lugar.lat])
          .setPopup(
            new PopupGL({
              closeButton: false,
              closeOnClick: true,
              offset: 14,
              maxWidth: "15rem",
              className: "popup-bora",
            }).setDOMContent(balao),
          )
          .addTo(mapa.current!);
      });
    })();

    return () => {
      vivo = false;
    };
  }, [pins, selecionadoId, onSelecionar, pronto, router]);

  return (
    <div ref={raiz} className={`relative overflow-hidden ${className}`}>
      {/* Base: o mapa abstrato, visível até o real carregar — e permanentemente se ele falhar. */}
      <div className={`absolute inset-0 transition-opacity ${pronto ? "opacity-0" : "opacity-100"}`}>
        <MapaEstilizado pins={pins} className="h-full w-full" />
      </div>

      {/* Sem classe de altura de propósito: o tamanho vem em pixels do ResizeObserver
          (ver `dimensionar` acima). Tanto `inset-0` sozinho quanto `h-full` resolveram
          para altura 0 aqui, em momentos diferentes, e o MapLibre não avisa — ele só cai
          num fallback interno de 400x300 e desenha fora da vista. */}
      <div ref={container} className="absolute top-0 left-0" />

      {etiqueta && (
        <span className="pointer-events-none absolute top-3 left-3 z-3 rounded-full bg-surface/80 px-2.5 py-1 text-[11px] font-semibold text-text-faint backdrop-blur-sm">
          {etiqueta}
        </span>
      )}

      {children}

      {/* Em dev, aparece enquanto o mapa não está pronto, quando houve erro, ou quando a
          sonda viu o canvas fora de sincronia com o container. Esse último caso é o que
          importa: um mapa "pronto" desenhando fora da vista era invisível na tela, e por
          isso custou três rodadas de depuração. Mapa saudável não mostra nada.
          Vai no topo porque a gaveta do lugar selecionado ocupa o rodapé. */}
      {(!pronto || erro || suspeito) && process.env.NODE_ENV !== "production" && (
        <div className="rounded-[12px] pointer-events-none absolute inset-x-3 top-12 z-5 border border-text-dim/40 bg-surface/95 px-3 py-2 font-mono text-[11px] leading-snug text-text-faint">
          [mapa] {pronto ? "pronto" : "carregando"} · {diag}
          {erro ? ` · erro: ${erro}` : ""}
        </div>
      )}
    </div>
  );
}
