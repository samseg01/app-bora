import { Desktop, Mobile } from "@/components/viewport";
import { SalvosDesktop, type ItemSalvo } from "@/views/desktop/salvos";
import { SalvosMobile } from "@/views/mobile/salvos";
import { PINS_EXEMPLO, SALVOS_EXEMPLO } from "@/lib/fixtures";

/**
 * Tela 2g. Ainda inteiramente com dado de exemplo: `GET /salvos` exige token e o
 * login só chega na fase 3 (ver ../TODO.md). Quando existir, a lista virá da API —
 * e de preferência já enriquecida (item 16), senão são N chamadas a /lugares/{id}.
 */
export default function SalvosPage() {
  const itens: ItemSalvo[] = SALVOS_EXEMPLO.map((lugar) => ({
    lugar,
    role: PINS_EXEMPLO.find((p) => p.lugar.id === lugar.id)?.role_ativo ?? null,
  }));

  return (
    <>
      <Mobile>
        <SalvosMobile itens={itens} />
      </Mobile>
      <Desktop>
        <SalvosDesktop itens={itens} />
      </Desktop>
    </>
  );
}
