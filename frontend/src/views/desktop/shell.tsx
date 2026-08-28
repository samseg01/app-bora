import type { ReactNode } from "react";
import { Sidebar } from "./sidebar";
import { SidebarCurador } from "./sidebar-curador";

/**
 * Casca da visualização desktop: coluna de navegação fixa + área de conteúdo.
 *
 * `curador` troca a nav do app público pela do painel do curador — são superfícies
 * diferentes (uma é descoberta, a outra é trabalho), e a nav é o que diz isso.
 *
 * `semBarra` tira a coluna inteira, para o painel do dono: ele tem uma tela só e não
 * navega para lugar nenhum. Uma nav de um item é moldura vazia.
 */
export function DesktopShell({
  children,
  curador = false,
  semBarra = false,
}: {
  children: ReactNode;
  curador?: boolean;
  semBarra?: boolean;
}) {
  return (
    <div className="flex min-h-dvh bg-surface">
      {!semBarra && (curador ? <SidebarCurador /> : <Sidebar />)}
      <main className="flex min-w-0 flex-1">{children}</main>
    </div>
  );
}
