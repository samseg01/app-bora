import { Desktop, Mobile } from "@/components/viewport";
import { Porta } from "@/components/ui/porta";
import { SalvosDesktop, type ItemSalvo } from "@/views/desktop/salvos";
import { SalvosMobile } from "@/views/mobile/salvos";
import { PINS_EXEMPLO, SALVOS_EXEMPLO } from "@/lib/fixtures";

/**
 * Tela 2g. Atrás da porta desde que o login existe, mas o conteúdo ainda é de
 * exemplo: `GET /salvos` devolve só `lugar_id`, então montar a lista de verdade custa
 * uma chamada por item (item 16 de ../TODO.md). Ligar na API depois de enriquecer a rota.
 */
export default function SalvosPage() {
  const itens: ItemSalvo[] = SALVOS_EXEMPLO.map((lugar) => ({
    lugar,
    role: PINS_EXEMPLO.find((p) => p.lugar.id === lugar.id)?.role_ativo ?? null,
  }));

  return (
    <Porta
      titulo="Seus lugares salvos"
      descricao="O caderninho é só seu — ninguém mais vê. Para isso, ele precisa saber quem é você."
    >
      <Mobile>
        <SalvosMobile itens={itens} />
      </Mobile>
      <Desktop>
        <SalvosDesktop itens={itens} />
      </Desktop>
    </Porta>
  );
}
