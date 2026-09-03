/**
 * Legenda dos três estados no mapa. Só existe na visualização desktop: no telefone
 * não há espaço e o rail de cards já nomeia os estados por extenso logo acima.
 */
export function LegendaFrescor({ comBorda = false }: { comBorda?: boolean }) {
  const itens = [
    { cor: "bg-live", label: "agora" },
    { cor: "bg-text-dim", label: "enchendo" },
    { cor: "bg-muted", label: "novo" },
  ];

  return (
    <div
      className={`flex gap-4 text-[11px] text-muted-3 ${comBorda ? "border-t border-linha pt-3" : ""}`}
    >
      {itens.map(({ cor, label }) => (
        <div key={label} className="flex items-center gap-1.5">
          <span className={`h-[7px] w-[7px] rounded-full ${cor}`} />
          {label}
        </div>
      ))}
    </div>
  );
}
