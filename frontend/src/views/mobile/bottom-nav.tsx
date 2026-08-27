"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { NAV } from "@/components/nav-items";

/** Navegação da visualização mobile. Não aparece no detalhe do rolê nem no onboarding. */
export function BottomNav() {
  const caminho = usePathname();

  return (
    // Com cinco itens, cada um divide a largura igualmente e o rótulo pode encolher —
    // margem de segurança para telas de 320-360px. (Verificado a 500px: os cinco cabem
    // com folga; abaixo disso o Chrome headless no Windows não mede, então é precaução.)
    <nav className="flex border-t border-white/7 bg-nav px-1 pt-3 pb-5.5">
      {NAV.map(({ href, label, Icone }) => {
        const ativo = caminho === href;
        return (
          <Link
            key={href}
            href={href}
            aria-current={ativo ? "page" : undefined}
            className={`flex min-w-0 flex-1 flex-col items-center gap-1.5 text-[9.5px] ${
              ativo ? "font-semibold text-magenta" : "font-medium text-muted-3"
            }`}
          >
            <Icone width={21} height={21} />
            <span className="max-w-full truncate">{label}</span>
          </Link>
        );
      })}
    </nav>
  );
}
