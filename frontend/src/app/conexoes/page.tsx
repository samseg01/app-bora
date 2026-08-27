import { Desktop, Mobile } from "@/components/viewport";
import { ConexoesDesktop, type DadosConexoes } from "@/views/desktop/conexoes";
import { ConexoesMobile } from "@/views/mobile/conexoes";
import {
  BAIRRO_EXEMPLO,
  CONEXOES_EXEMPLO,
  FORA_AGORA_EXEMPLO,
  SALVOS_CONEXOES_EXEMPLO,
  SALVOS_DO_CURADOR_EXEMPLO,
} from "@/lib/fixtures";

/**
 * Aba de Conexões. Design em `docs/front-end-ideias/conexoes/`, plano em
 * `docs/plano-conexoes.md`.
 *
 * Roda inteiramente com dado de exemplo: nenhuma das rotas de que ela precisa existe
 * no backend (itens 27–30 do TODO da raiz), e todas exigiriam login de qualquer forma.
 *
 * `?vazio=1` mostra o estado sem nenhuma conexão. É a tela mais importante da feature
 * e, com dado de exemplo, seria inalcançável de outro jeito. Sai quando a API existir.
 */
export const dynamic = "force-dynamic";

async function carregar(vazio: boolean): Promise<DadosConexoes> {
  return {
    foraAgora: vazio ? [] : FORA_AGORA_EXEMPLO,
    salvos: vazio ? [] : SALVOS_CONEXOES_EXEMPLO,
    conexoes: vazio ? [] : CONEXOES_EXEMPLO.filter((c) => c.status === "aceita"),
    pendentes: vazio ? [] : CONEXOES_EXEMPLO.filter((c) => c.status === "pendente"),
    salvosDoCurador: SALVOS_DO_CURADOR_EXEMPLO,
    curador: "Léo",
    bairro: BAIRRO_EXEMPLO,
    // Lido aqui, fora de qualquer componente: `Date.now()` durante o render é impuro.
    agora: Date.now(),
  };
}

export default async function ConexoesPage({ searchParams }: PageProps<"/conexoes">) {
  const { vazio } = await searchParams;
  const dados = await carregar(vazio === "1");

  return (
    <>
      <Mobile>
        <ConexoesMobile {...dados} />
      </Mobile>
      <Desktop>
        <ConexoesDesktop {...dados} />
      </Desktop>
    </>
  );
}
