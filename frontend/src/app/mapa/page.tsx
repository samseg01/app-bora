import { Desktop, Mobile } from "@/components/viewport";
import { MapaDesktop } from "@/views/desktop/mapa";
import { MapaMobile } from "@/views/mobile/mapa";
import { AvisoOffline } from "@/components/ui/aviso-offline";
import { api, ApiOffline } from "@/lib/api";
import { BAIRRO_EXEMPLO, COMENTARIOS_EXEMPLO, PINS_EXEMPLO } from "@/lib/fixtures";
import type { ComentarioResumo, MapaPin } from "@/lib/types";

export const dynamic = "force-dynamic";

const BAIRRO = BAIRRO_EXEMPLO;

async function carregar(): Promise<{
  pins: MapaPin[];
  comentarios?: Record<string, ComentarioResumo[]>;
  offline: boolean;
}> {
  try {
    return { pins: await api.mapa(BAIRRO), offline: false };
  } catch (erro) {
    if (erro instanceof ApiOffline && process.env.NODE_ENV !== "production") {
      // Com a API no ar, os comentários de cada pin sairiam de GET /lugares/{id} na
      // seleção — uma chamada por pin. Fica para quando a tela tiver dado real.
      const comentarios = Object.fromEntries(
        PINS_EXEMPLO.filter((p) => p.total_comentarios > 0).map((p) => [
          p.lugar.id,
          COMENTARIOS_EXEMPLO.slice(0, p.total_comentarios),
        ]),
      );
      return { pins: PINS_EXEMPLO, comentarios, offline: true };
    }
    throw erro;
  }
}

export default async function MapaPage() {
  const { pins, comentarios, offline } = await carregar();

  return (
    <>
      {offline && <AvisoOffline />}
      <Mobile>
        <MapaMobile pins={pins} bairro={BAIRRO} comentarios={comentarios} />
      </Mobile>
      <Desktop>
        <MapaDesktop pins={pins} bairro={BAIRRO} comentarios={comentarios} />
      </Desktop>
    </>
  );
}
