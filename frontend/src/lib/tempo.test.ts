import { describe, expect, it } from "vitest";
import { hora, horaMinuto, idade } from "./tempo";

/**
 * O backend é todo UTC; a tela é toda São Paulo. Esta é a fronteira onde os dois se
 * encontram, e é onde um erro de fuso vira "o rolê termina 04h" virando "07h".
 *
 * Os testes passam ISO com `Z` explícito de propósito: é o formato que a API devolve, e
 * testar com data local esconderia exatamente a conversão que importa.
 */
describe("horaMinuto e hora", () => {
  it("converte UTC para São Paulo (UTC-3)", () => {
    // 02h UTC = 23h do dia anterior em SP — a virada de dia é o caso que erra fácil.
    expect(horaMinuto("2026-09-03T02:30:00Z")).toBe("23h30");
    expect(hora("2026-09-03T02:00:00Z")).toBe("23h");
  });

  it("mantém o zero à esquerda, que o badge do rolê depende", () => {
    // 07h UTC = 04h SP. "4h" quebraria o alinhamento do "termina 04h" do hi-fi.
    expect(hora("2026-09-03T07:00:00Z")).toBe("04h");
    expect(horaMinuto("2026-09-03T07:05:00Z")).toBe("04h05");
  });

  it("não depende do fuso da máquina que roda", () => {
    // O mesmo instante formatado duas vezes tem que dar igual — se dependesse do
    // relógio local, a suíte passaria aqui e falharia num runner em UTC (a CI).
    const iso = "2026-09-02T15:45:00Z";
    expect(horaMinuto(iso)).toBe(horaMinuto(iso));
    expect(horaMinuto(iso)).toBe("12h45");
  });
});

describe("idade", () => {
  const agora = new Date("2026-09-02T12:00:00Z").getTime();
  const atras = (min: number) => new Date(agora - min * 60_000).toISOString();

  it("diz 'agora' abaixo de um minuto", () => {
    expect(idade(atras(0), agora)).toBe("agora");
    expect(idade(atras(0.5), agora)).toBe("agora");
  });

  it("conta minutos até uma hora", () => {
    expect(idade(atras(1), agora)).toBe("1 min");
    expect(idade(atras(59), agora)).toBe("59 min");
  });

  it("vira horas a partir de 60 minutos", () => {
    expect(idade(atras(60), agora)).toBe("1 h");
    expect(idade(atras(23 * 60), agora)).toBe("23 h");
  });

  it("vira dias a partir de 24 horas", () => {
    expect(idade(atras(24 * 60), agora)).toBe("1 d");
    expect(idade(atras(72 * 60), agora)).toBe("3 d");
  });

  /** `agora` entra por parâmetro porque ler o relógio dentro de um componente é impuro
      e diverge entre servidor e cliente na hidratação. O default existe para o chamador
      que não se importa — mas quem renderiza sempre passa. */
  it("aceita agora por parâmetro, e é isso que torna o teste possível", () => {
    expect(idade("2026-09-02T11:30:00Z", agora)).toBe("30 min");
  });
});
