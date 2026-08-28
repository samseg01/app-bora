import Link from "next/link";
import { MobileShell } from "./shell";
import { FormPublicar } from "../desktop/form-publicar";
import { frescorUI } from "@/lib/frescor";
import { hora } from "@/lib/tempo";
import type { LugarPublic, RoleDescoberta } from "@/lib/types";

/**
 * O painel do curador é uma superfície de desktop — mas o curador é justamente quem
 * está na rua. No telefone a tela inverte a prioridade: publicar vem primeiro (ele
 * acabou de sair do lugar), e a lista do que está no ar vem depois, para conferência.
 * Editar e tirar do ar ficam só no desktop, onde dá para trabalhar com calma.
 */
export function CuradorMobile({
  roles,
  lugares,
  bairro,
}: {
  roles: RoleDescoberta[];
  lugares: LugarPublic[];
  bairro: string;
}) {
  return (
    <MobileShell nav={false}>
      <div className="flex items-center justify-between px-5.5 pt-9">
        <div>
          <div className="rotulo text-amber">painel do curador</div>
          <h1 className="mt-2 font-display text-[31px] leading-none uppercase">
            A noite de hoje
          </h1>
        </div>
        <Link href="/" className="text-xs font-semibold text-muted-2">
          ver o app
        </Link>
      </div>

      <div className="mt-5 px-5.5">
        <FormPublicar lugares={lugares} bairro={bairro} compacto />
      </div>

      <div className="mt-6 px-5.5">
        <div className="rotulo text-muted-3">no ar agora · {roles.length}</div>
        <div className="mt-3 flex flex-col gap-2.5 pb-6">
          {roles.map((role, i) => {
            const ui = frescorUI(role.frescor);
            return (
              <div
                key={role.id}
                className={`flex items-center gap-3 rounded-[18px] border bg-card p-3 ${
                  role.frescor === "live" ? "border-magenta/30" : "border-white/7"
                }`}
              >
                <div
                  className={`h-11 w-11 shrink-0 rounded-xl bg-gradient-to-br ${
                    ["from-magenta to-violet", "from-amber to-magenta", "from-cyan to-violet"][i % 3]
                  }`}
                />
                <div className="min-w-0 flex-1">
                  <div className="truncate text-sm font-bold">{role.titulo}</div>
                  <div className="mt-0.5 truncate text-[11.5px] text-muted-2">
                    {role.lugar_nome} · {hora(role.data_inicio)}–{hora(role.data_fim)}
                  </div>
                </div>
                <span
                  className={`h-2.5 w-2.5 shrink-0 rounded-full ${ui?.pin ?? "bg-pin-off"} ${ui?.pulsa ? "pulse-agora" : ""}`}
                />
              </div>
            );
          })}
        </div>
      </div>
    </MobileShell>
  );
}
