"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

/**
 * Navegação entre as duas telas do painel do curador, na visualização mobile.
 *
 * Existe porque elas eram becos sem saída no telefone: o painel não linkava para
 * Lugares, o Lugares não linkava de volta, e a barra inferior não aparece aqui
 * (`nav={false}`) porque esta é superfície de trabalho, não o app público. Na prática
 * só dava para cadastrar um lugar digitando a URL na mão — e cadastrar o lugar é o
 * passo que vem ANTES de publicar qualquer rolê.
 *
 * No desktop quem faz este papel é a coluna lateral (`sidebar-curador.tsx`).
 */
export const ABAS_CURADOR = [
  { href: "/curador", label: "A noite de hoje" },
  { href: "/curador/lugares", label: "Lugares" },
] as const;

export function AbasCurador() {
  const caminho = usePathname();

  return (
    <nav className="flex gap-2">
      {ABAS_CURADOR.map(({ href, label }) => {
        const ativo = caminho === href;
        return (
          <Link
            key={href}
            href={href}
            aria-current={ativo ? "page" : undefined}
            className={`rounded-full px-3.5 py-2 text-[12.5px] transition-colors ${
              ativo
                ? "border-[1.5px] border-amber bg-amber/14 font-semibold text-amber"
                : "border border-white/10 bg-sunken font-medium text-text-faint"
            }`}
          >
            {label}
          </Link>
        );
      })}
    </nav>
  );
}
