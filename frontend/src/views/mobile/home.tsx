import { MapaReal } from "@/components/ui/mapa-real";
import { RoleCard } from "@/components/ui/role-card";
import Link from "next/link";
import { MobileShell } from "./shell";
import type { MapaPin, RoleDescoberta } from "@/lib/types";

/**
 * Tela 2c do hi-fi. As duas camadas empilhadas: a descoberta empurra em cima,
 * o mapa puxa embaixo. A ordem vertical é a tese da tela (docs/conceito.md) —
 * se a altura apertar, encolher o mapa, nunca virar abas.
 */
export function HomeMobile({
  roles,
  pins,
  bairro,
}: {
  roles: RoleDescoberta[];
  pins: MapaPin[];
  bairro: string;
}) {
  return (
    <MobileShell>
      <header className="flex items-center justify-between px-5.5 pt-9 pb-3">
        <div className="flex flex-col gap-0.5">
          <span className="rotulo text-muted-2">você está em</span>
          {/* Trocar de bairro não pode depender de conta: o app é público por decisão. */}
          <Link href="/abertura" className="flex items-center gap-1.5 text-[17px] font-bold">
            <PinIcone />
            {bairro}
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#8478a0" strokeWidth={2.5}>
              <path d="M6 9l6 6 6-6" />
            </svg>
          </Link>
        </div>
        <div className="h-9 w-9 rounded-full bg-gradient-to-br from-magenta to-amber" />
      </header>

      <div className="flex items-baseline gap-2.5 px-5.5 pt-2 pb-3.5">
        <h1 className="font-display text-[31px] leading-none tracking-[-.3px] uppercase">
          Hoje à noite
        </h1>
        {roles.length > 0 && (
          <span className="text-xs text-muted-2">
            {roles.length} {roles.length === 1 ? "achado" : "achados"}
          </span>
        )}
      </div>

      {roles.length > 0 ? (
        <div className="flex gap-3.5 overflow-x-auto px-5.5 pt-0.5 pb-4.5 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          {roles.map((role, i) => (
            <div key={role.id} className="w-[206px] shrink-0">
              <RoleCard role={role} indice={i} />
            </div>
          ))}
        </div>
      ) : (
        <div className="mx-5.5 mb-4.5 rounded-[20px] border border-white/7 bg-card px-5 py-5.5">
          <h2 className="font-display text-[22px] leading-tight uppercase">
            Ainda não tem nada aqui
          </h2>
          <p className="mt-2.5 text-[13px] leading-relaxed text-muted text-pretty">
            Um rolê só aparece depois que alguém foi até lá e viu. Em {bairro} isso ainda não
            aconteceu — e a gente prefere a tela vazia a encher de lugar que ninguém visitou.
          </p>
        </div>
      )}

      <div className="flex items-center gap-3 px-5.5 pb-3.5">
        <div className="h-px flex-1 bg-gradient-to-r from-magenta/45 to-amber/20" />
        <span className="rotulo text-muted-2">ou explore a região</span>
        <div className="h-px flex-1 bg-gradient-to-r from-amber/20 to-magenta/45" />
      </div>

      <MapaReal
        pins={pins}
        etiqueta={`${bairro} · agora`}
        className="mx-4 mb-3 min-h-45 flex-1 rounded-[22px] border border-white/7"
      />
    </MobileShell>
  );
}

function PinIcone() {
  return (
    <svg width="13" height="13" viewBox="0 0 24 24" fill="#ff3d81">
      <path d="M12 2C8 2 5 5 5 9c0 5 7 13 7 13s7-8 7-13c0-4-3-7-7-7zm0 9.5A2.5 2.5 0 1112 6a2.5 2.5 0 010 5.5z" />
    </svg>
  );
}
