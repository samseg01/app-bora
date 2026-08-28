import { linkDeSugestao } from "@/lib/contato";

/**
 * O convite para indicar um lugar — o começo da rotina de curadoria.
 *
 * Duas coisas o copy precisa deixar claras, e são as que evitam frustração depois:
 * a sugestão **não publica nada**, e alguém vai **a pé conferir** antes. Sem isso a
 * pessoa espera ver seu lugar no app no dia seguinte e some quando não vê.
 *
 * Não renderiza nada quando não há contato configurado: um botão que não leva a lugar
 * nenhum é pior que ausência.
 */
export function SugerirLugar({
  bairro,
  variante = "bloco",
}: {
  bairro: string;
  /** `bloco` para estados vazios, onde é a ação principal; `linha` para rodapé de tela cheia. */
  variante?: "bloco" | "linha";
}) {
  const href = linkDeSugestao(bairro);
  if (!href) return null;

  if (variante === "linha") {
    return (
      <a
        href={href}
        target="_blank"
        rel="noreferrer"
        className="flex items-center justify-between gap-3 rounded-[18px] border border-dashed border-white/16 px-4 py-3 hover:border-white/28"
      >
        <span className="text-[12.5px] leading-snug text-text-faint">
          Conhece um lugar que devia estar aqui?
        </span>
        <span className="shrink-0 text-[12.5px] font-semibold text-magenta-soft">Indicar</span>
      </a>
    );
  }

  return (
    <a
      href={href}
      target="_blank"
      rel="noreferrer"
      className="mt-4 block rounded-[20px] border border-magenta/24 bg-gradient-to-br from-magenta/12 to-violet/8 px-5 py-4.5 transition-colors hover:border-magenta/45"
    >
      <div className="flex items-start gap-3.5">
        <span className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-magenta/16">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#ff6fa0" strokeWidth={2}>
            <path d="M12 5v14M5 12h14" />
          </svg>
        </span>
        <div className="min-w-0">
          <div className="text-[14.5px] font-bold">
            Conhece um lugar em {bairro} que devia estar aqui?
          </div>
          <p className="mt-1.5 text-[12.5px] leading-relaxed text-muted">
            Manda pro curador. Ele vai a pé conferir antes de entrar no app — por isso o que
            está aqui presta.
          </p>
        </div>
      </div>
    </a>
  );
}
