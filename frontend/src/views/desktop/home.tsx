import { MapaReal } from "@/components/ui/mapa-real";
import { RoleRow } from "@/components/ui/role-row";
import { DesktopShell } from "./shell";
import { LegendaFrescor } from "./legenda-frescor";
import type { ComentarioResumo, MapaPin, RoleDescoberta } from "@/lib/types";

/**
 * Visualização desktop da home. ⚠️ Derivada da tese, não de uma artboard de telefone —
 * o design de desktop vive em docs/front-end-ideias/desktop/.
 *
 * A tese das duas camadas sobrevive mudando de eixo: no telefone a descoberta empurra
 * em cima e o mapa puxa embaixo porque não cabem lado a lado. Aqui cabem, e a leitura
 * ocidental faz o olho pousar na coluna da esquerda primeiro — então a descoberta
 * continua vindo antes. O que o conceito rejeita é *abrir no mapa*, não o mapa existir
 * junto. O mapa fica fixo e a descoberta rola: aqui ele é referência constante, não um
 * destino aonde se vai.
 */
export function HomeDesktop({
  roles,
  pins,
  bairro,
  comentario,
}: {
  roles: RoleDescoberta[];
  pins: MapaPin[];
  bairro: string;
  comentario?: ComentarioResumo;
}) {
  return (
    <DesktopShell>
      <section className="min-w-0 flex-1 px-9 py-8">
        <div className="flex items-start justify-between">
          <div className="flex flex-col gap-1">
            <span className="rotulo text-muted-2">você está em</span>
            <span className="flex items-center gap-[7px] text-[17px] font-bold">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="#ff3d81">
                <path d="M12 2C8 2 5 5 5 9c0 5 7 13 7 13s7-8 7-13c0-4-3-7-7-7zm0 9.5A2.5 2.5 0 1112 6a2.5 2.5 0 010 5.5z" />
              </svg>
              {bairro}
            </span>
          </div>
        </div>

        <div className="mt-6 flex items-baseline gap-3.5">
          <h1 className="font-display text-[54px] leading-none tracking-[-.5px] uppercase">
            Hoje à noite
          </h1>
          <span className="text-[13px] text-muted-2">
            {roles.length} {roles.length === 1 ? "achado" : "achados"}
          </span>
        </div>
        <p className="mt-2.5 max-w-[460px] text-[13.5px] leading-relaxed text-muted text-pretty">
          Tudo aqui foi visto de perto hoje. Se estiver ruim, sai da lista.
        </p>

        {roles.length > 0 ? (
          <div className="mt-6 flex flex-col gap-3.5">
            {roles.map((role, i) => (
              <RoleRow key={role.id} role={role} indice={i} />
            ))}
          </div>
        ) : (
          <p className="mt-8 text-[13.5px] leading-relaxed text-muted">
            Nenhum rolê curado para hoje ainda. O curador ainda está na rua.
          </p>
        )}
      </section>

      <section className="w-[400px] shrink-0 py-8 pr-7">
        <MapaReal
          pins={pins}
          etiqueta={`${bairro} · agora`}
          className="sticky top-8 h-[calc(100dvh-4rem)] rounded-[22px] border border-white/7"
        >
          <div className="absolute inset-x-4 bottom-4 flex flex-col gap-3 rounded-[18px] border border-white/9 bg-sunken/95 p-4">
            {comentario && (
              <div className="flex items-start gap-3">
                <div className="h-[30px] w-[30px] shrink-0 rounded-full bg-gradient-to-br from-violet to-cyan" />
                <p className="text-[12.5px] leading-snug text-text-dim">
                  “{comentario.texto}” —{" "}
                  <span className="font-semibold text-white">{comentario.autor_nome}</span>
                </p>
              </div>
            )}
            <LegendaFrescor comBorda={Boolean(comentario)} />
          </div>
        </MapaReal>
      </section>
    </DesktopShell>
  );
}
