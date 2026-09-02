import { DesktopShell } from "./shell";
import { FormPublicar } from "./form-publicar";
import { PassosCurador } from "@/components/ui/passos-curador";
import { TirarDoAr } from "@/components/ui/tirar-do-ar";
import { frescorUI } from "@/lib/frescor";
import { hora } from "@/lib/tempo";
import type { LugarPublic, RoleDescoberta } from "@/lib/types";

/**
 * Painel do curador — a superfície mais desktop-native do produto: é onde alguém
 * trabalha sentado, depois de andar pelo bairro. Por isso ela não é o app público
 * esticado: tem nav própria, o foco é o que está no ar e o ato de publicar.
 *
 * As rotas já existem inteiras no backend (CRUD em /curador/lugares e /curador/roles);
 * o que falta é o login (fase 3), então o formulário ainda não envia.
 *
 * O campo "motivo pra ir" é o maior do formulário de propósito: é o que faz alguém sair
 * de casa. Também é a única coluna aqui que ainda não existe no banco (item 15).
 */
export function CuradorDesktop({
  roles,
  lugares,
  bairro,
  terminandoLogo,
}: {
  roles: RoleDescoberta[];
  lugares: LugarPublic[];
  bairro: string;
  /** Calculado no servidor: ler o relógio durante o render é impuro e diverge na hidratação. */
  terminandoLogo: number;
}) {
  return (
    <DesktopShell curador>
      <section className="min-w-0 flex-1 px-8 py-8">
        <div className="mb-6">
          <PassosCurador bairro={bairro} lugares={lugares.length} />
        </div>
        <h1 className="titulo text-[42px] leading-none">A noite de hoje</h1>
        <p className="mt-2 text-[13px] text-muted-2">
          o que está no ar agora em {bairro} — some sozinho no horário de término
        </p>

        <div className="mt-5.5 flex gap-3">
          <Stat valor={roles.length} rotulo="rolês no ar" />
          <Stat valor={lugares.length} rotulo="lugares curados" />
          <Stat valor={terminandoLogo} rotulo="terminam em menos de 2h" alerta />
        </div>

        <div className="rotulo mt-6.5 text-muted-3">no ar agora</div>

        <div className="mt-3.5 flex flex-col gap-2.5">
          {roles.length === 0 && (
            <p className="text-[13.5px] text-muted">
              Nada no ar. A noite começa quando você publicar o primeiro.
            </p>
          )}
          {roles.map((role, i) => {
            const ui = frescorUI(role.frescor);
            return (
              <div
                key={role.id}
                className={`flex items-center gap-4 border bg-card px-4 py-3.5 ${
                  role.frescor === "live" ? "border-linha-forte" : "border-linha"
                }`}
              >
                <div
                  className={`h-11.5 w-11.5 shrink-0 bg-gradient-to-br ${
                    ["from-pedra-funda to-pedra", "from-pedra via-pedra-funda to-pedra", "from-pedra to-pedra-funda"][i % 3]
                  }`}
                />
                <div className="min-w-0 flex-1">
                  <div className="truncate text-[15px] font-bold">{role.titulo}</div>
                  <div className="mt-0.5 truncate text-xs text-muted-2">
                    {role.lugar_nome} · {role.categoria.toLowerCase()} ·{" "}
                    {hora(role.data_inicio)}–{hora(role.data_fim)}
                  </div>
                </div>
                <span
                  className={`flex shrink-0 items-center gap-1.5 rounded-full px-2.5 py-1.5 text-[11px] font-semibold ${
                    role.frescor === "live"
                      ? "bg-card text-text-soft"
                      : role.frescor === "warm"
                        ? "bg-text-dim/14 text-text-dim"
                        : "bg-muted/14 text-muted"
                  }`}
                >
                  <span
                    className={`h-1.5 w-1.5 rounded-full ${ui?.pin ?? "bg-pin-off"} ${ui?.pulsa ? "pulse-agora" : ""}`}
                  />
                  {ui?.label ?? "sem sinal"}
                </span>
                {/* "Editar" saiu: a rota PATCH existe, mas sem formulário de edição o botão
                    era enfeite. Corrigir um rolê hoje é tirar do ar e publicar de novo. */}
                <TirarDoAr roleId={role.id} />
              </div>
            );
          })}
        </div>
      </section>

      <aside className="w-[396px] shrink-0 py-8 pr-7">
        <FormPublicar lugares={lugares} bairro={bairro} />
      </aside>
    </DesktopShell>
  );
}

function Stat({
  valor,
  rotulo,
  alerta = false,
}: {
  valor: number;
  rotulo: string;
  alerta?: boolean;
}) {
  return (
    <div
      className={`flex-1 border bg-sunken px-4 py-3.5 ${
        alerta && valor > 0 ? "border-text-dim/28" : "border-linha"
      }`}
    >
      <div className={`titulo text-[26px] leading-none ${alerta && valor > 0 ? "text-text-faint" : ""}`}>
        {valor}
      </div>
      <div className="mt-1.5 text-[11.5px] text-muted-2">{rotulo}</div>
    </div>
  );
}
