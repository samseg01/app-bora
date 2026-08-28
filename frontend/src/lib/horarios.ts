import type { FaixaHorario } from "./types";

/**
 * Funcionamento em faixas: quais dias, de que hora a que hora.
 *
 * Estruturado, e não texto livre como na primeira versão, porque destrava a pergunta que
 * o produto de fato faz — **esta casa está aberta agora?** Com "seg a sex, 12h às 1h" em
 * texto, isso só sai adivinhando.
 *
 * 0 = domingo, seguindo `Date.getDay()`, para não haver conversão entre o relógio e o
 * dado.
 */
export const DIAS = ["dom", "seg", "ter", "qua", "qui", "sex", "sáb"] as const;

/** Uma faixa em branco, começando pelo horário mais comum de bar. */
export function faixaNova(): FaixaHorario {
  return { dias: [], abre: "18:00", fecha: "02:00" };
}

/**
 * "seg a sex · 12h–01h" — agrupa dias consecutivos em intervalo.
 *
 * Sem o agrupamento a linha vira "seg, ter, qua, qui, sex", que é ruído: quem lê quer
 * saber se hoje abre, não recitar a semana.
 */
export function faixaLegivel(faixa: FaixaHorario): string {
  return `${diasLegiveis(faixa.dias)} · ${hhmm(faixa.abre)}–${hhmm(faixa.fecha)}`;
}

function hhmm(valor: string): string {
  const [h, m] = valor.split(":");
  return m === "00" ? `${Number(h)}h` : `${Number(h)}h${m}`;
}

function diasLegiveis(dias: number[]): string {
  if (dias.length === 7) return "todo dia";
  const ordenados = [...new Set(dias)].sort((a, b) => a - b);

  const blocos: number[][] = [];
  for (const dia of ordenados) {
    const ultimo = blocos.at(-1);
    if (ultimo && dia === ultimo.at(-1)! + 1) ultimo.push(dia);
    else blocos.push([dia]);
  }

  return blocos
    .map((b) =>
      b.length >= 3
        ? `${DIAS[b[0]]} a ${DIAS[b.at(-1)!]}`
        : b.map((d) => DIAS[d]).join(" e "),
    )
    .join(", ");
}

/**
 * A casa está aberta neste instante?
 *
 * `agora` entra por parâmetro porque ler o relógio dentro de um componente é impuro e o
 * React Compiler recusa — mesma regra de `lib/tempo.ts`.
 *
 * Faixa que fecha antes de abrir atravessa a meia-noite, e nesse caso o dia que conta é
 * o de ontem: às 00h30 de sábado, quem está aberto é a faixa de **sexta** que vai até 2h.
 * Errar isso faria o app dizer "fechado" exatamente na hora em que o bar está cheio.
 */
export function abertaAgora(faixas: FaixaHorario[] | null, agora: Date): boolean {
  if (!faixas?.length) return false;
  const minutos = agora.getHours() * 60 + agora.getMinutes();
  const hoje = agora.getDay();
  const ontem = (hoje + 6) % 7;

  return faixas.some((f) => {
    const abre = emMinutos(f.abre);
    const fecha = emMinutos(f.fecha);
    if (fecha > abre) return f.dias.includes(hoje) && minutos >= abre && minutos < fecha;
    // Atravessa a meia-noite: vale do horário de abertura até o fim do dia,
    // e da madrugada seguinte até fechar.
    return (
      (f.dias.includes(hoje) && minutos >= abre) ||
      (f.dias.includes(ontem) && minutos < fecha)
    );
  });
}

function emMinutos(valor: string): number {
  const [h, m] = valor.split(":").map(Number);
  return h * 60 + m;
}
