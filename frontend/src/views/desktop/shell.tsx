import type { ReactNode } from "react";
import { Sidebar } from "./sidebar";
import { SidebarCurador } from "./sidebar-curador";

/**
 * Casca da visualização desktop: coluna de navegação fixa + área de conteúdo.
 *
 * `curador` troca a nav do app público pela do painel do curador — são superfícies
 * diferentes (uma é descoberta, a outra é trabalho), e a nav é o que diz isso.
 */
export function DesktopShell({
  children,
  curador = false,
}: {
  children: ReactNode;
  curador?: boolean;
}) {
  return (
    <div className="flex min-h-dvh bg-surface">
      {curador ? <SidebarCurador /> : <Sidebar />}
      <main className="flex min-w-0 flex-1">{children}</main>
    </div>
  );
}
