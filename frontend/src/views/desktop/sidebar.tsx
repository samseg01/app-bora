"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { NAV } from "@/components/nav-items";

/**
 * Navegação da visualização desktop. Barra inferior é gesto de polegar — no desktop
 * vira coluna lateral fixa, com a marca no topo.
 */
export function Sidebar() {
  const caminho = usePathname();

  return (
    <aside className="rounded-[20px] sticky top-0 flex h-dvh w-60 shrink-0 flex-col border-r border-linha bg-nav px-5 py-7">
      <Link href="/" className="titulo text-3xl leading-none">
        Bora<span className="text-text-faint">?</span>
      </Link>

      <nav className="mt-10 flex flex-col gap-1">
        {NAV.map(({ href, label, Icone }) => {
          const ativo = caminho === href;
          return (
            <Link
              key={href}
              href={href}
              aria-current={ativo ? "page" : undefined}
              className={`flex items-center gap-3 px-3.5 py-3 text-sm transition-colors ${
                ativo
                  ? "bg-card font-semibold text-selecao"
                  : "font-medium text-muted-2 hover:bg-white/4 hover:text-text"
              }`}
            >
              <Icone width={20} height={20} />
              {label}
            </Link>
          );
        })}
      </nav>

      {/* Declaração de propósito, não afirmação sobre alguém. O card com nome e
          contagem de lugares validados era inventado — some. */}
      <p className="mt-auto text-xs leading-relaxed text-muted-3">
        Curadoria de campo, a pé.
        <br />
        Um bairro por vez.
      </p>

    </aside>
  );
}
