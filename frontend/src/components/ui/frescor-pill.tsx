import { frescorUI } from "@/lib/frescor";
import type { Frescor } from "@/lib/types";

/** O badge de estado. Sem frescor não renderiza nada — ausência de sinal não é um estado. */
export function FrescorPill({ frescor }: { frescor: Frescor | null }) {
  const ui = frescorUI(frescor);
  if (!ui) return null;

  return (
    <div className="inline-flex items-center gap-1.5 rounded-full bg-surface/75 px-2.5 py-1 text-[11px] font-semibold backdrop-blur-sm">
      <span
        className={`h-[7px] w-[7px] rounded-full ${ui.ponto} ${ui.pulsa ? "pulse-live" : ""}`}
      />
      {ui.label}
    </div>
  );
}
