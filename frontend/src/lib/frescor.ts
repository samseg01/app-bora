import type { Frescor } from "./types";

/**
 * O único lugar que traduz o frescor da API em UI.
 *
 * **Reescrito em 02/09, e a mudança é de sistema, não de cor.** Antes eram três
 * cores saturadas competindo — magenta para `live`, âmbar para `warm`, ciano para
 * `new` —, e o resultado é que nenhuma significava nada: a tela ficava colorida
 * inteira e o olho não tinha para onde ir primeiro.
 *
 * Agora **só `live` tem cor**. Os outros dois se distinguem por *peso* e *forma*,
 * que é como hierarquia funciona quando não se pode gastar cor:
 *
 * | estado | cor | forma | por quê |
 * |---|---|---|---|
 * | `live` | terracota | ponto cheio, pulsando | é o produto inteiro: tem gente lá agora |
 * | `warm` | areia clara | ponto cheio, parado | está acontecendo, sem a urgência |
 * | `new` | rótulo apagado | anel vazado | é informação de catálogo, não de agora |
 *
 * O anel vazado do `new` não é enfeite: ele diz "ainda não tem ninguém" pela
 * própria forma — um contorno sem preenchimento —, o que a cor sozinha nunca
 * conseguiu dizer quando ciano parecia tão vivo quanto magenta.
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
    ponto: "bg-agora",
    pin: "bg-agora",
    pulsa: true,
    texto: "text-agora",
  },
  warm: {
    label: "Começando a encher",
    ponto: "bg-text-dim",
    pin: "bg-text-dim",
    pulsa: false,
    texto: "text-text-dim",
  },
  new: {
    label: "Novo por aqui",
    // Anel vazado: a ausência de preenchimento é a mensagem.
    ponto: "border border-muted ring-inset",
    pin: "bg-muted",
    pulsa: false,
    texto: "text-muted",
  },
};

/** null = ausência de sinal, e ausência de sinal não é um estado a exibir. */
export function frescorUI(frescor: Frescor | null | undefined): FrescorUI | null {
  return frescor ? MAPA[frescor] : null;
}
