"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { NAV } from "@/components/nav-items";

/** Navegação da visualização mobile. Não aparece no detalhe do rolê nem no onboarding. */
export function BottomNav() {
  const caminho = usePathname();

  return (
    // Cinco itens é o teto: com labels de até "Conexões" a linha ainda cabe em 360px.
    <nav className="flex justify-around border-t border-white/7 bg-nav px-1.5 pt-3 pb-5.5">
      {NAV.map(({ href, label, Icone }) => {
        const ativo = caminho === href;
        return (
          <Link
            key={href}
            href={href}
            aria-current={ativo ? "page" : undefined}
            className={`flex flex-col items-center gap-1.5 text-[10px] ${
              ativo ? "font-semibold text-magenta" : "font-medium text-muted-3"
            }`}
          >
            <Icone width={22} height={22} />
            {label}
          </Link>
        );
      })}
    </nav>
  );
}
