"use client";

import { MAX_TAGS, TAGS_LUGAR } from "@/lib/tags";

/**
 * Escolha das tags do lugar, no formulário do curador.
 *
 * Segue o mesmo gesto do seletor de categoria — chips que alternam, sem campo de texto —
 * porque o vocabulário é fechado (ver `lib/tags.ts`). A diferença é que aqui vale marcar
 * várias, e o limite é de leitura: uma ficha com quinze tags não descreve nada.
 *
 * Quando o limite é atingido, as não marcadas ficam **opacas mas ainda clicáveis não** —
 * `disabled` de verdade, porque o clique que não faz nada é pior que o botão que se
 * explica. O contador diz quantas faltam, então a recusa nunca chega sem aviso.
 */
export function SeletorTags({
  valor,
  onChange,
}: {
  valor: string[];
  onChange: (tags: string[]) => void;
}) {
  const cheio = valor.length >= MAX_TAGS;

  function alternar(tag: string) {
    onChange(valor.includes(tag) ? valor.filter((t) => t !== tag) : [...valor, tag]);
  }

  return (
    <div className="flex flex-col gap-1.5">
      <span className="flex items-baseline justify-between">
        <span className="rotulo text-muted-3">tags</span>
        <span className="text-[11px] text-muted-3">
          {valor.length === 0
            ? "o que a casa tem — opcional"
            : `${valor.length} de ${MAX_TAGS}`}
        </span>
      </span>
      <div className="flex flex-wrap gap-2">
        {TAGS_LUGAR.map((t) => {
          const marcada = valor.includes(t);
          return (
            <button
              key={t}
              type="button"
              onClick={() => alternar(t)}
              aria-pressed={marcada}
              disabled={!marcada && cheio}
              className={`rounded-full px-3 py-1.5 text-[12px] transition-colors ${
                marcada
                  ? "border-[1.5px] border-muted bg-muted/16 font-semibold text-text"
                  : cheio
                    ? "border border-linha bg-sunken font-medium text-muted-3"
                    : "border border-linha bg-sunken font-medium text-text-faint"
              }`}
            >
              {t}
            </button>
          );
        })}
      </div>
    </div>
  );
}
