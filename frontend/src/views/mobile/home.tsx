import { MapaReal } from "@/components/ui/mapa-real";
import { RoleCard } from "@/components/ui/role-card";
import { SeletorBairro } from "@/components/ui/seletor-bairro";
import { SugerirLugar } from "@/components/ui/sugerir-lugar";
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
      {/* O hi-fi tinha um avatar no canto direito daqui. Saiu: era um `div` decorativo,
          sem link e sem dono — a tela não sabe quem está olhando, e um avatar genérico é
          exatamente o tipo de enfeite que finge dado. A barra inferior já leva ao Perfil,
          então nem navegação ele acrescentava. */}
      <header className="flex items-center px-5.5 pt-9 pb-3">
        <div className="flex flex-col gap-0.5">
          <span className="rotulo text-muted-2">você está em</span>
          {/* O nome do bairro é o próprio seletor — trocar não tira ninguém da tela. */}
          <SeletorBairro atual={bairro} />
        </div>
      </header>

      <div className="flex items-baseline gap-2.5 px-5.5 pt-2 pb-3.5">
        <h1 className="titulo text-[31px] leading-none tracking-[-.3px]">
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
          {roles.map((role) => (
            <div key={role.id} className="w-[206px] shrink-0">
              <RoleCard role={role} />
            </div>
          ))}
        </div>
      ) : (
        <div className="elevado rounded-[16px] mx-5.5 mb-4.5 border border-linha bg-card px-5 py-5.5">
          <h2 className="titulo text-[22px] leading-tight">
            Ainda não tem nada aqui
          </h2>
          <p className="mt-2.5 text-[13px] leading-relaxed text-muted text-pretty">
            Um rolê só aparece depois que alguém foi até lá e viu. Em {bairro} isso ainda não
            aconteceu — e a gente prefere a tela vazia a encher de lugar que ninguém visitou.
          </p>
          <SugerirLugar bairro={bairro} />
        </div>
      )}

      <div className="flex items-center gap-3 px-5.5 pb-3.5">
        <div className="h-px flex-1 bg-gradient-to-r from-text-dim/45 to-text-dim/20" />
        <span className="rotulo text-muted-2">ou explore a região</span>
        <div className="h-px flex-1 bg-gradient-to-r from-text-dim/20 to-text-dim/45" />
      </div>

      <MapaReal
        pins={pins}
        etiqueta={`${bairro} · agora`}
        className="rounded-[16px] mx-4 mb-3 min-h-45 flex-1 border border-linha"
      />
    </MobileShell>
  );
}
