import { describe, expect, it } from "vitest";
import { frescorUI } from "./frescor";

/**
 * O mapeamento frescor → UI é pequeno, e mesmo assim é o único lugar do frontend que
 * traduz o ativo central do produto. Reescrevi ele duas vezes em 02/09 (na troca do
 * sistema visual e na separação do acento), e nas duas vezes sem nada que verificasse.
 *
 * O que estes testes protegem não é a cor exata — é a **estrutura da hierarquia**: que
 * só `live` seja acentuado, que `new` se distinga por forma, e que `null` não vire badge.
 */
describe("frescorUI", () => {
  it("só live é acentuado — os outros dois são neutros", () => {
    expect(frescorUI("live")!.ponto).toContain("agora");
    expect(frescorUI("warm")!.ponto).not.toContain("agora");
    expect(frescorUI("new")!.ponto).not.toContain("agora");
  });

  it("só live pulsa", () => {
    expect(frescorUI("live")!.pulsa).toBe(true);
    expect(frescorUI("warm")!.pulsa).toBe(false);
    expect(frescorUI("new")!.pulsa).toBe(false);
  });

  /**
   * O anel vazado do `new` não é enfeite: ele diz "ainda não tem ninguém" pela própria
   * ausência de preenchimento. Sem cor para gastar, forma é o que sobra para separar
   * "está acontecendo" de "existe, mas vazio" — e foi o que a cor nunca disse quando
   * ciano parecia tão vivo quanto magenta.
   */
  it("new usa contorno; live e warm usam preenchimento", () => {
    expect(frescorUI("new")!.ponto).toContain("border");
    expect(frescorUI("live")!.ponto).toContain("bg-");
    expect(frescorUI("warm")!.ponto).toContain("bg-");
  });

  /** Ausência de sinal não é um estado a exibir — a tela esconde o badge inteiro em vez
      de mostrar um cinza que pareceria mais um nível de frescor. */
  it("null e undefined não viram badge", () => {
    expect(frescorUI(null)).toBeNull();
    expect(frescorUI(undefined)).toBeNull();
  });

  it("cada estado tem rótulo próprio e não vazio", () => {
    const rotulos = (["live", "warm", "new"] as const).map((f) => frescorUI(f)!.label);
    expect(rotulos.every((r) => r.length > 0)).toBe(true);
    expect(new Set(rotulos).size).toBe(3);
  });

  it("todo estado traz as quatro peças que a tela precisa", () => {
    for (const f of ["live", "warm", "new"] as const) {
      const ui = frescorUI(f)!;
      expect(ui).toHaveProperty("label");
      expect(ui).toHaveProperty("ponto");
      expect(ui).toHaveProperty("pin");
      expect(ui).toHaveProperty("texto");
    }
  });
});
