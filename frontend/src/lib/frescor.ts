import type { Frescor } from "./types";

/**
 * O único lugar que traduz o frescor da API em UI.
 *
 * **Reescrito em 02/09, e a mudança é de sistema, não de cor.** Antes eram três
 * cores saturadas competindo — magenta para `live`, âmbar para `warm`, ciano para
 * `new` —, e o resultado é que nenhuma significava nada: a tela ficava colorida
 * inteira e o olho não tinha para onde ir primeiro.
 *
 * **A cor voltou na camada 2 (02/09), e os três hexes são os do hi-fi**, sem
 * alteração — este é o único uso em que a cor antiga sempre apareceu sozinha e
 * sempre significou uma coisa só.
 *
 * | estado | cor | forma | por quê |
 * |---|---|---|---|
 * | `live` | magenta `#ff3d81` | ponto cheio, pulsando | é o produto inteiro: tem gente lá agora |
 * | `warm` | âmbar `#ffb443` | ponto cheio, parado | está acontecendo, sem a urgência |
 * | `new` | ciano `#1fd0ff` | **anel vazado** | é informação de catálogo, não de agora |
 *
 * **A forma ficou, mesmo com a cor de volta.** O anel vazado do `new` sobreviveu à
 * camada 1 e continua: ele diz "ainda não tem ninguém" pela própria ausência de
 * preenchimento, e é redundância barata com a cor. No sistema antigo o ciano
 * parecia tão vivo quanto o magenta, e era só isso que separava os dois — o mapa
 * lido de relance não distinguia.
 */
export interface FrescorUI {
  label: string;
  /** Classe Tailwind de cor de fundo do ponto. */
  ponto: string;
  /** Classe Tailwind de cor do pin no mapa. */
  pin: string;
  pulsa: boolean;
  /** Classe do texto do rótulo. Antes era sempre a mesma; agora acompanha a
      hierarquia, senão "Novo por aqui" leria com o mesmo peso de "Bombando agora". */
  texto: string;
}

const MAPA: Record<Frescor, FrescorUI> = {
  live: {
    label: "Bombando agora",
    ponto: "bg-live",
    pin: "bg-live",
    pulsa: true,
    texto: "text-live",
  },
  warm: {
    label: "Começando a encher",
    ponto: "bg-warm",
    pin: "bg-warm",
    pulsa: false,
    texto: "text-warm",
  },
  new: {
    label: "Novo por aqui",
    // Anel vazado: a ausência de preenchimento é a mensagem, e ela sobrevive à
    // volta da cor — as duas juntas são mais legíveis de relance que qualquer uma.
    ponto: "border-[1.5px] border-novo ring-inset",
    pin: "bg-novo",
    pulsa: false,
    texto: "text-novo",
  },
};

/** null = ausência de sinal, e ausência de sinal não é um estado a exibir. */
export function frescorUI(frescor: Frescor | null | undefined): FrescorUI | null {
  return frescor ? MAPA[frescor] : null;
}
