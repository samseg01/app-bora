import { describe, expect, it } from "vitest";
import { abertaAgora, faixaLegivel, faixaNova } from "./horarios";
import type { FaixaHorario } from "./types";

/** 0 = domingo, como `Date.getDay()`. */
const DOM = 0;
const SEG = 1;
const TER = 2;
const QUA = 3;
const QUI = 4;
const SEX = 5;
const SAB = 6;

/** Data local explícita. O relógio real faria o mesmo teste passar de manhã e falhar de
    madrugada — é a razão de `abertaAgora` receber `agora` por parâmetro. */
function em(dia: number, hora: number, minuto = 0): Date {
  // 2026-09-06 é um domingo; somar o dia dá o dia da semana desejado.
  return new Date(2026, 8, 6 + dia, hora, minuto);
}

const faixa = (dias: number[], abre: string, fecha: string): FaixaHorario => ({
  dias,
  abre,
  fecha,
});

describe("abertaAgora", () => {
  it("está aberta dentro da faixa, no dia certo", () => {
    const f = [faixa([QUI, SEX, SAB], "18:00", "23:00")];
    expect(abertaAgora(f, em(SEX, 20, 0))).toBe(true);
  });

  it("está fechada antes de abrir e depois de fechar", () => {
    const f = [faixa([SEX], "18:00", "23:00")];
    expect(abertaAgora(f, em(SEX, 17, 59))).toBe(false);
    expect(abertaAgora(f, em(SEX, 23, 0))).toBe(false);
  });

  it("está fechada num dia que a faixa não cobre", () => {
    const f = [faixa([SEX, SAB], "18:00", "23:00")];
    expect(abertaAgora(f, em(TER, 20, 0))).toBe(false);
  });

  /**
   * A regra que mais custa errar, e a razão principal deste arquivo existir.
   *
   * Faixa que fecha antes de abrir atravessa a meia-noite. Às 00h30 de sábado quem está
   * aberto é a faixa de **sexta**, que vai até 2h — o sábado ainda nem começou para
   * efeito de bar. Uma implementação ingênua olharia só o dia de hoje e diria "fechado"
   * exatamente na hora em que a casa está cheia, que é o pior momento possível para o
   * app mentir.
   */
  describe("faixa que atravessa a meia-noite", () => {
    const noturna = [faixa([SEX], "18:00", "02:00")];

    it("aberta na sexta à noite, depois do horário de abrir", () => {
      expect(abertaAgora(noturna, em(SEX, 23, 30))).toBe(true);
    });

    it("AINDA aberta às 00h30 de sábado — a faixa é de sexta", () => {
      expect(abertaAgora(noturna, em(SAB, 0, 30))).toBe(true);
    });

    it("fechada às 02h de sábado, quando a faixa de sexta terminou", () => {
      expect(abertaAgora(noturna, em(SAB, 2, 0))).toBe(false);
    });

    it("fechada às 00h30 de sexta — essa madrugada é da quinta, que não tem faixa", () => {
      expect(abertaAgora(noturna, em(SEX, 0, 30))).toBe(false);
    });

    it("atravessa a virada da semana: domingo 01h vale a faixa de sábado", () => {
      const f = [faixa([SAB], "22:00", "04:00")];
      expect(abertaAgora(f, em(DOM, 1, 0))).toBe(true);
    });
  });

  it("aceita várias faixas e basta uma valer", () => {
    const f = [faixa([SEG, TER, QUA, QUI], "12:00", "23:00"), faixa([SEX, SAB], "12:00", "04:00")];
    expect(abertaAgora(f, em(TER, 22, 0))).toBe(true); // dentro da faixa de semana
    expect(abertaAgora(f, em(SAB, 3, 0))).toBe(true); // madrugada da SEXTA, que está na faixa
    expect(abertaAgora(f, em(DOM, 3, 0))).toBe(true); // madrugada do SÁBADO, idem
    expect(abertaAgora(f, em(SEG, 3, 0))).toBe(false); // madrugada do domingo: sem faixa
  });

  /** Sem faixa não dá para afirmar "fechado" sem inventar — a tela esconde o selo, e
      isso depende de `false` aqui não significar "está fechado" e sim "não sei". */
  it("devolve false sem faixa nenhuma", () => {
    expect(abertaAgora(null, em(SEX, 20, 0))).toBe(false);
    expect(abertaAgora([], em(SEX, 20, 0))).toBe(false);
  });
});

describe("faixaLegivel", () => {
  it("agrupa três ou mais dias consecutivos em intervalo", () => {
    expect(faixaLegivel(faixa([SEG, TER, QUA, QUI, SEX], "12:00", "01:00"))).toBe(
      "seg a sex · 12h–1h",
    );
  });

  it("lista com 'e' quando são só dois dias", () => {
    expect(faixaLegivel(faixa([SEX, SAB], "18:00", "02:00"))).toBe("sex e sáb · 18h–2h");
  });

  it("separa blocos não contíguos por vírgula", () => {
    expect(faixaLegivel(faixa([SEG, QUI, SEX, SAB], "18:00", "23:00"))).toBe(
      "seg, qui a sáb · 18h–23h",
    );
  });

  it("diz 'todo dia' com os sete", () => {
    expect(faixaLegivel(faixa([DOM, SEG, TER, QUA, QUI, SEX, SAB], "10:00", "22:00"))).toBe(
      "todo dia · 10h–22h",
    );
  });

  it("mostra os minutos só quando não são zero", () => {
    expect(faixaLegivel(faixa([SEX], "18:30", "23:00"))).toBe("sex · 18h30–23h");
  });

  it("ordena e deduplica os dias recebidos", () => {
    expect(faixaLegivel(faixa([SAB, SEX, SEX], "18:00", "23:00"))).toBe("sex e sáb · 18h–23h");
  });
});

describe("faixaNova", () => {
  it("começa vazia no horário mais comum de bar", () => {
    expect(faixaNova()).toEqual({ dias: [], abre: "18:00", fecha: "02:00" });
  });
});
