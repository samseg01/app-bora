import { Desktop, Mobile } from "@/components/viewport";
import { HomeDesktop } from "@/views/desktop/home";
import { HomeMobile } from "@/views/mobile/home";
import { AvisoOffline } from "@/components/ui/aviso-offline";
import { api, ApiOffline } from "@/lib/api";
import { BAIRRO_PILOTO } from "@/lib/config";
import {
  BAIRRO_EXEMPLO,
  COMENTARIOS_EXEMPLO,
  PINS_EXEMPLO,
  ROLES_EXEMPLO,
} from "@/lib/fixtures";
import type { MapaPin, RoleDescoberta } from "@/lib/types";

/**
 * Tela 2c — home. Busca os dados uma vez, no servidor, e entrega os mesmos dados às
 * duas visualizações. É o ponto onde a partição fica barata: uma busca, duas
 * composições.
 *
 * O bairro ainda é fixo — o piloto não foi escolhido (../TODO.md item 1) e não há
 * endpoint de bairros. Vira localStorage + onboarding na fase 2.
 */

/**
 * Descoberta e frescor são de agora — esta rota nunca deve ser pré-renderizada em
 * build. Sem isto o Next tenta gerar a página estaticamente e falha ao alcançar a API.
 */
export const dynamic = "force-dynamic";

interface Dados {
  roles: RoleDescoberta[];
  pins: MapaPin[];
  /** O bairro real quando a API responde; o do exemplo quando ela não responde. */
  bairro: string;
  offline: boolean;
}

async function carregar(): Promise<Dados> {
  try {
    const [roles, pins] = await Promise.all([
      api.descoberta(BAIRRO_PILOTO),
      api.mapa(BAIRRO_PILOTO),
    ]);
    return { roles, pins, bairro: BAIRRO_PILOTO, offline: false };
  } catch (erro) {
    // Só a API fora do ar cai em dado de exemplo, e só fora de produção. Qualquer
    // outro erro (4xx, 5xx) é problema de verdade e deve estourar.
    if (erro instanceof ApiOffline && process.env.NODE_ENV !== "production") {
      return { roles: ROLES_EXEMPLO, pins: PINS_EXEMPLO, bairro: BAIRRO_EXEMPLO, offline: true };
    }
    throw erro;
  }
}

export default async function Home() {
  const { roles, pins, bairro, offline } = await carregar();

  return (
    <>
      {offline && <AvisoOffline />}
      <Mobile>
        <HomeMobile roles={roles} pins={pins} bairro={bairro} />
      </Mobile>
      <Desktop>
        <HomeDesktop
          roles={roles}
          pins={pins}
          bairro={bairro}
          // O motivo pra ir agora vem da API (coluna `descricao`). O card social
          // continua só no exemplo: citar quem sinalizou quebraria o anonimato
          // prometido no detalhe (ver ../TODO.md item 4a).
          comentario={offline ? COMENTARIOS_EXEMPLO[0] : undefined}
        />
      </Desktop>
    </>
  );
}
