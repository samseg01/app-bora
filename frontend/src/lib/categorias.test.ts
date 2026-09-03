import { describe, expect, it } from "vitest";
import {
  CATEGORIAS_LUGAR,
  corDaCategoria,
  gradienteDaCategoria,
  pinDaCategoria,
} from "./categorias";

describe("corDaCategoria", () => {
  it("dá cor própria a cada categoria do vocabulário", () => {
    const cores = CATEGORIAS_LUGAR.map((c) => corDaCategoria(c));
    expect(cores.every((c) => c !== "text-text-faint")).toBe(true);
    // Oito categorias, oito cores distintas: duas iguais fariam o eixo mentir.
    expect(new Set(cores).size).toBe(CATEGORIAS_LUGAR.length);
  });

  it("ignora caixa e espaço — a coluna é texto livre e a deriva já aconteceu", () => {
    // No banco real convivem "Bar" com maiúscula e "bar" minúsculo (item 48).
    expect(corDaCategoria("Bar")).toBe(corDaCategoria("bar"));
    expect(corDaCategoria("  Boteco ")).toBe(corDaCategoria("boteco"));
  });

  it("aceita 'praça' com e sem cedilha", () => {
    expect(corDaCategoria("praca")).toBe(corDaCategoria("praça"));
  });

  /** O Bar do China está cadastrado como "forró", que é gênero musical e não
      categoria. Cair em neutro é o comportamento certo: o rótulo continua legível,
      só não ganha cor que não lhe pertence. */
  it("cai em neutro para categoria fora do vocabulário", () => {
    expect(corDaCategoria("forró")).toBe("text-text-faint");
    expect(corDaCategoria(null)).toBe("text-text-faint");
    expect(corDaCategoria("")).toBe("text-text-faint");
  });
});

describe("gradienteDaCategoria", () => {
  it("dá gradiente próprio a cada categoria", () => {
    const gs = CATEGORIAS_LUGAR.map((c) => gradienteDaCategoria(c));
    expect(new Set(gs).size).toBe(CATEGORIAS_LUGAR.length);
  });

  /**
   * O Tailwind v4 varre o código atrás de nomes de classe LITERAIS. Uma classe
   * montada em template (`from-${cor}/45`) não é gerada, e o bloco fica
   * transparente sem erro nenhum — nem no build, nem no lint. Foi o primeiro
   * jeito que tentei, e este teste existe para o próximo não repetir.
   */
  it("devolve classe literal, nunca montada", () => {
    for (const c of CATEGORIAS_LUGAR) {
      const g = gradienteDaCategoria(c);
      expect(g).toMatch(/^from-cat-[a-z]+\/\d+ via-cat-[a-z]+\/\d+ to-pedra-funda$/);
      expect(g).not.toContain("${");
    }
  });

  it("cai em cinza fora do vocabulário", () => {
    expect(gradienteDaCategoria("forró")).toBe("from-pedra to-pedra-funda");
    expect(gradienteDaCategoria(null)).toBe("from-pedra to-pedra-funda");
  });
});

describe("pinDaCategoria", () => {
  it("dá cor cheia a cada categoria — pin translúcido de 10px não é visto", () => {
    for (const c of CATEGORIAS_LUGAR) {
      expect(pinDaCategoria(c)).toMatch(/^bg-cat-[a-z]+$/);
    }
  });

  it("cai no cinza reservado fora do vocabulário", () => {
    expect(pinDaCategoria("forró")).toBe("bg-pin-off");
  });

  /** Rótulo, bloco-foto e pin da mesma categoria têm de sair da mesma cor, senão a
      mesma casa muda de identidade entre o card e o mapa. */
  it("rótulo, gradiente e pin concordam na matiz", () => {
    for (const c of CATEGORIAS_LUGAR) {
      const nome = corDaCategoria(c).replace("text-cat-", "");
      expect(pinDaCategoria(c)).toBe(`bg-cat-${nome}`);
      expect(gradienteDaCategoria(c)).toContain(`from-cat-${nome}/`);
    }
  });
});
