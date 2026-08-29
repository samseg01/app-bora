import { frescorUI } from "@/lib/frescor";
import type { MapaPin } from "@/lib/types";

/**
 * O mapa abstrato do design — grid e faixas simulando ruas — com os pins reais
 * projetados dentro. Sem tiles, sem chave de API, sem dependência externa.
 *
 * MapLibre/Leaflet só quando zoom e pan virarem necessidade medida; até lá isto
 * é fiel ao design e já exercita a geo de verdade que vem do PostGIS.
 */

/** Projeta lat/lng em porcentagem dentro da bbox dos pins, com margem para não colar nas bordas. */
function projetar(pins: MapaPin[]) {
  const lats = pins.map((p) => p.lugar.lat);
  const lngs = pins.map((p) => p.lugar.lng);
  const minLat = Math.min(...lats);
  const maxLat = Math.max(...lats);
  const minLng = Math.min(...lngs);
  const maxLng = Math.max(...lngs);

  // Um pin só (ou todos no mesmo ponto) não tem extensão para normalizar: centraliza.
  const spanLat = maxLat - minLat || 1;
  const spanLng = maxLng - minLng || 1;
  const margem = 14;
  const util = 100 - margem * 2;

  return pins.map((pin) => ({
    pin,
    left:
      lngs.length === 1 || maxLng === minLng
        ? 50
        : margem + ((pin.lugar.lng - minLng) / spanLng) * util,
    // Latitude cresce para o norte; o eixo Y da tela cresce para baixo.
    top:
      lats.length === 1 || maxLat === minLat
        ? 50
        : margem + ((maxLat - pin.lugar.lat) / spanLat) * util,
  }));
}

export function MapaEstilizado({
  pins,
  etiqueta,
  className = "",
  children,
  selecionadoId,
  onSelecionar,
}: {
  pins: MapaPin[];
  etiqueta?: string;
  className?: string;
  children?: React.ReactNode;
  /** Quando informado, o pin correspondente ganha anel de foco. */
  selecionadoId?: string | null;
  /** Só passado pela tela de mapa, que é client component. Sem isso os pins são inertes. */
  onSelecionar?: (lugarId: string) => void;
}) {
  const posicionados = pins.length > 0 ? projetar(pins) : [];

  return (
    <div
      className={`relative overflow-hidden bg-sunken ${className}`}
      style={{
        backgroundImage:
          "linear-gradient(rgba(255,255,255,.035) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,.035) 1px, transparent 1px)",
        backgroundSize: "38px 38px",
      }}
    >
      {/* Faixas inclinadas: as "ruas" do design. Decorativas. */}
      <div className="absolute inset-y-0 left-[38%] w-2.5 -skew-x-12 bg-white/5" />
      <div className="absolute inset-x-0 top-[44%] h-2 skew-y-6 bg-white/5" />

      {etiqueta && (
        <span className="absolute top-3 left-3 z-3 rounded-full bg-surface/70 px-2.5 py-1 text-[11px] font-semibold text-text-faint">
          {etiqueta}
        </span>
      )}

      {posicionados.map(({ pin, left, top }) => {
        const ui = frescorUI(pin.role_ativo?.frescor ?? pin.frescor);
        const temRole = pin.role_ativo !== null;
        const classe = `absolute z-4 -translate-x-1/2 -translate-y-1/2 rounded-full ${
          temRole ? "h-3.5 w-3.5" : "h-2.5 w-2.5"
        } ${ui ? ui.pin : "bg-pin-off"} ${ui?.pulsa ? "pulse-agora" : ""} ${
          selecionadoId === pin.lugar.id ? "ring-3 ring-white/70" : ""
        }`;
        const posicao = { left: `${left}%`, top: `${top}%` };

        return onSelecionar ? (
          <button
            key={pin.lugar.id}
            type="button"
            aria-label={pin.lugar.nome}
            onClick={() => onSelecionar(pin.lugar.id)}
            className={classe}
            style={posicao}
          />
        ) : (
          <div key={pin.lugar.id} title={pin.lugar.nome} className={classe} style={posicao} />
        );
      })}

      {children}
    </div>
  );
}
