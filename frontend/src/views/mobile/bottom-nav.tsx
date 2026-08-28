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
    //
    // `mt-auto`: a barra é filha direta da coluna flex do MobileShell, e sem isto ela
    // para logo abaixo do conteúdo em vez de ir ao rodapé. Home e mapa escondiam o
    // problema porque têm um filho `flex-1` que ocupa a altura; salvos, perfil e
    // conexões deixavam a barra flutuando no meio da tela.
    //
    // `sticky bottom-0`: continua visível quando a lista é longa. Ela segue ocupando
    // espaço no fluxo, então nada fica escondido atrás — não precisa de padding
    // compensatório no conteúdo.
    //
    // O padding de baixo soma a área segura do aparelho: instalado como PWA não há
    // barra de navegador, e a barra de gestos do sistema ficaria em cima dos rótulos.
    <nav
      className="sticky bottom-0 z-10 mt-auto flex border-t border-white/7 bg-nav px-1 pt-3"
      style={{ paddingBottom: "calc(1.375rem + env(safe-area-inset-bottom))" }}
    >
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
