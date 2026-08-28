import { BAIRROS } from "./bairros";
import type { LugarProximo } from "./types";

/**
 * "Onde eu estou" traduzido para "que recorte é esse".
 *
 * Mora em `lib/` porque é regra de negócio, não apresentação — e porque é exatamente o
 * tipo de coisa que atravessa a migração para nativo prevista no ADR-001: o
 * `navigator.geolocation` daqui vira a API de localização do dispositivo, e nada mais
 * muda.
 *
 * **A coordenada não é guardada em lugar nenhum.** Vai como parâmetro de consulta,
 * responde, e morre. Não há cookie, `localStorage` nem coluna — e o backend também não
 * a registra. Num app que promete anonimato no sinal de presença, pedir localização e
 * guardá-la seria contradizer a promessa no primeiro toque.
 */

export type FalhaLocalizacao =
  | "sem-suporte"
  | "negado"
  | "indisponivel"
  | "demorou"
  | "erro-rede";

export class ErroLocalizacao extends Error {
  constructor(readonly tipo: FalhaLocalizacao) {
    super(tipo);
    this.name = "ErroLocalizacao";
  }
}

/**
 * Os dois limites que separam "você está aqui", "dá pra ir andando" e "fica longe".
 *
 * O primeiro valor era 1500 m, escolhido no escritório. O teste em campo derrubou na
 * hora: a tela disse "VOCÊ ESTÁ AQUI" para alguém a 1,4 km — uns 17 minutos de
 * caminhada. "Aqui" precisa querer dizer aqui.
 *
 * Há um limite conceitual embutido, que a copy não pode atropelar (item 38 do TODO):
 * medimos a distância até o **lugar curado mais próximo**, não até a fronteira do
 * bairro. Alguém pode estar dentro da Vila Madalena e a 1 km do lugar mais próximo que
 * a gente visitou. Por isso só o círculo bem apertado se dá ao luxo de dizer "aqui"; o
 * resto fala de distância, que é o que de fato sabemos.
 */
export const RAIO_DENTRO_M = 700;
/** Até aqui ainda é decisão de caminhada; além disso, é decisão de transporte. */
export const RAIO_A_PE_M = 3000;

/** Minutos de caminhada a ~5 km/h. Para este produto "20 min a pé" decide mais que "1,6 km". */
export function minutosAPe(metros: number): number {
  return Math.max(1, Math.round(metros / 83));
}

export interface Achado {
  /** O recorte atendido mais próximo. `null` quando nada por perto é bairro que o app cobre. */
  bairro: string | null;
  distancia_m: number | null;
  /**
   * `aqui` — em cima do recorte. `a-pe` — longe o bastante para andar, perto o bastante
   * para valer. `longe` — o app não atende a região dela hoje, e a tela diz isso.
   */
  proximidade: "aqui" | "a-pe" | "longe";
  /** Os primeiros lugares curados, do mais perto ao mais longe — o "locais próximos". */
  lugares: LugarProximo[];
}

export function pedirPosicao(): Promise<{ lat: number; lng: number }> {
  return new Promise((resolver, rejeitar) => {
    // Fora de contexto seguro (HTTP em rede local, por exemplo) o objeto nem existe.
    if (typeof navigator === "undefined" || !navigator.geolocation) {
      rejeitar(new ErroLocalizacao("sem-suporte"));
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (pos) => resolver({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
      (erro) => {
        const tipo: FalhaLocalizacao =
          erro.code === erro.PERMISSION_DENIED
            ? "negado"
            : erro.code === erro.TIMEOUT
              ? "demorou"
              : "indisponivel";
        rejeitar(new ErroLocalizacao(tipo));
      },
      // Alta precisão custa bateria e segundos, e aqui basta saber o bairro.
      { enableHighAccuracy: false, timeout: 12_000, maximumAge: 60_000 },
    );
  });
}

/**
 * Decide o que a resposta do backend significa para esta tela.
 *
 * Só considera lugares de bairros que o app **realmente atende**: o banco pode ter
 * lugares de outros recortes (o seed fictício da Vila Madalena, por exemplo), e sugerir
 * um bairro que não está na lista deixaria a pessoa num beco.
 */
export function interpretar(proximos: LugarProximo[]): Achado {
  const atendidos = proximos.filter((p) => BAIRROS.some((b) => b.nome === p.lugar.bairro));
  const primeiro = atendidos[0];

  const metros = primeiro?.distancia_m ?? null;
  return {
    bairro: primeiro?.lugar.bairro ?? null,
    distancia_m: metros,
    proximidade:
      metros === null || metros > RAIO_A_PE_M
        ? "longe"
        : metros <= RAIO_DENTRO_M
          ? "aqui"
          : "a-pe",
    lugares: atendidos.slice(0, 3),
  };
}

/** "700 m" ou "4,5 km" — a unidade que a pessoa usa para decidir se vai a pé. */
export function distanciaLegivel(metros: number): string {
  if (metros < 1000) return `${Math.round(metros / 10) * 10} m`;
  const km = metros / 1000;
  return `${km.toFixed(km < 10 ? 1 : 0).replace(".", ",")} km`;
}
