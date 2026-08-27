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
    <aside className="sticky top-0 flex h-dvh w-60 shrink-0 flex-col border-r border-white/7 bg-nav px-5 py-7">
      <Link href="/" className="font-display text-3xl leading-none uppercase">
        Bora<span className="text-amber">?</span>
      </Link>

      <nav className="mt-10 flex flex-col gap-1">
        {NAV.map(({ href, label, Icone }) => {
          const ativo = caminho === href;
          return (
            <Link
              key={href}
              href={href}
              aria-current={ativo ? "page" : undefined}
              className={`flex items-center gap-3 rounded-2xl px-3.5 py-3 text-sm transition-colors ${
                ativo
                  ? "bg-magenta/15 font-semibold text-magenta"
                  : "font-medium text-muted-2 hover:bg-white/4 hover:text-text"
              }`}
            >
              <Icone width={20} height={20} />
              {label}
            </Link>
          );
        })}
      </nav>

      <div className="mt-auto flex flex-col gap-2.5 rounded-[18px] border border-white/6 bg-card-alt p-4">
        <div className="flex items-center gap-2.5">
          <div className="h-[30px] w-[30px] shrink-0 rounded-full bg-gradient-to-br from-violet to-cyan" />
          <div className="text-[13px] font-semibold">Léo</div>
        </div>
        <p className="text-xs leading-relaxed text-muted">
          Curador da Vila. Validou 14 lugares a pé esta semana.
        </p>
      </div>
    </aside>
  );
}
