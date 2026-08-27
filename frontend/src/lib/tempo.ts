/**
 * O backend trabalha em UTC timezone-aware. Todo horário exibido é fixado em
 * America/Sao_Paulo — fixar o fuso explicitamente também faz servidor e cliente
 * concordarem, evitando divergência de hidratação.
 */
const TZ = "America/Sao_Paulo";

const HORA_MIN = new Intl.DateTimeFormat("pt-BR", {
  timeZone: TZ,
  hour: "2-digit",
  minute: "2-digit",
});

const HORA = new Intl.DateTimeFormat("pt-BR", {
  timeZone: TZ,
  hour: "2-digit",
});

/** "23h30" */
export function horaMinuto(iso: string): string {
  const [h, m] = HORA_MIN.format(new Date(iso)).split(":");
  return `${h}h${m}`;
}

/** "04h" — usado no badge "termina 04h" do detalhe do rolê. */
export function hora(iso: string): string {
  return `${HORA.format(new Date(iso))}h`;
}

/**
 * Idade relativa curta: "agora", "12 min", "3 h", "2 d".
 * Recebe `agora` por parâmetro para o servidor não gerar um valor que o cliente
 * recalcula diferente no mesmo render.
 */
export function idade(iso: string, agora: number = Date.now()): string {
  const minutos = Math.floor((agora - new Date(iso).getTime()) / 60_000);
  if (minutos < 1) return "agora";
  if (minutos < 60) return `${minutos} min`;
  const horas = Math.floor(minutos / 60);
  if (horas < 24) return `${horas} h`;
  return `${Math.floor(horas / 24)} d`;
}
