/**
 * O que uma conexão passa — e não passa — a ver de você.
 *
 * É a peça que decide se as pessoas confiam o suficiente para usar a feature: isto é
 * vida noturna, e a tela avisa para onde alguém está indo. Dizer o que NÃO é
 * compartilhado vale mais que dizer o que é.
 *
 * Os quatro itens são o contrato desenhado no plano (docs/plano-conexoes.md): se algum
 * deixar de ser verdade no backend, esta lista muda junto — ela não é copy decorativo.
 */

const ITENS = [
  {
    incluso: true,
    titulo: "Onde você está, quando você avisar",
    detalhe: "Só quando você faz check-in. Some sozinho em 2h.",
  },
  {
    incluso: false,
    titulo: "Seus lugares salvos",
    detalhe: "Desligado. Você liga no perfil, se quiser.",
  },
  {
    incluso: false,
    titulo: "Seu histórico",
    detalhe: "Não existe. Nada fica guardado depois que expira.",
  },
  {
    incluso: false,
    titulo: "Sua localização em segundo plano",
    detalhe: "O app não rastreia. Só o que você aponta.",
  },
];

export function ListaPrivacidade() {
  return (
    <div className="overflow-hidden rounded-[18px] border border-white/6 bg-card-alt">
      {ITENS.map(({ incluso, titulo, detalhe }, i) => (
        <div
          key={titulo}
          className={`flex items-start gap-3.5 px-4 py-3.5 ${i > 0 ? "border-t border-white/5" : ""}`}
        >
          {incluso ? (
            <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-magenta/18">
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#ff6fa0" strokeWidth={3}>
                <path d="M5 13l4 4L19 7" />
              </svg>
            </span>
          ) : (
            <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full border border-white/16">
              <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="#6f6690" strokeWidth={3}>
                <path d="M6 18L18 6M6 6l12 12" />
              </svg>
            </span>
          )}
          <div>
            <div className={`text-[13.5px] font-semibold ${incluso ? "" : "text-text-faint"}`}>
              {titulo}
            </div>
            <div className="mt-1 text-xs leading-snug text-muted-2">{detalhe}</div>
          </div>
        </div>
      ))}
    </div>
  );
}
