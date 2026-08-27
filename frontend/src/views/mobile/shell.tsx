import type { ReactNode } from "react";
import { BottomNav } from "./bottom-nav";

/**
 * Casca da visualização mobile. `nav={false}` no detalhe do rolê e no onboarding —
 * telas que o design deliberadamente deixa sem a barra inferior.
 */
export function MobileShell({
  children,
  nav = true,
}: {
  children: ReactNode;
  nav?: boolean;
}) {
  return (
    <div className="mx-auto flex min-h-dvh w-full max-w-md flex-col bg-surface">
      {children}
      {nav && <BottomNav />}
    </div>
  );
}
