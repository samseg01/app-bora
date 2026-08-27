import type { Frescor } from "./types";

/**
 * O único lugar que traduz o frescor da API em UI. O design só desenhou live e warm;
 * new e null seguem o sistema de cor já definido (ciano = novo; sem sinal = sem badge).
 */
export interface FrescorUI {
  label: string;
  /** Classe Tailwind de cor de fundo do ponto. */
  ponto: string;
  /** Classe Tailwind de cor do pin no mapa. */
  pin: string;
  pulsa: boolean;
}

const MAPA: Record<Frescor, FrescorUI> = {
  live: {
    label: "Bombando agora",
    ponto: "bg-magenta",
    pin: "bg-magenta",
    pulsa: true,
  },
  warm: {
    label: "Começando a encher",
    ponto: "bg-amber",
    pin: "bg-amber",
    pulsa: false,
  },
  new: {
    label: "Novo por aqui",
    ponto: "bg-cyan",
    pin: "bg-cyan",
    pulsa: false,
  },
};

/** null = ausência de sinal, e ausência de sinal não é um estado a exibir. */
export function frescorUI(frescor: Frescor | null | undefined): FrescorUI | null {
  return frescor ? MAPA[frescor] : null;
}
