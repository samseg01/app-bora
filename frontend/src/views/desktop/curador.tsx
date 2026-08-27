import { DesktopShell } from "./shell";
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
        <h1 className="font-display text-[42px] leading-none uppercase">A noite de hoje</h1>
        <p className="mt-2 text-[13px] text-muted-2">
          o que está no ar agora em {bairro}
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
                className={`flex items-center gap-4 rounded-[18px] border bg-card px-4 py-3.5 ${
                  role.frescor === "live" ? "border-magenta/30" : "border-white/7"
                }`}
              >
                <div
                  className={`h-11.5 w-11.5 shrink-0 rounded-[13px] bg-gradient-to-br ${
                    ["from-magenta to-violet", "from-amber to-magenta", "from-cyan to-violet"][i % 3]
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
                      ? "bg-magenta/16 text-magenta-soft"
                      : role.frescor === "warm"
                        ? "bg-amber/14 text-amber-soft"
                        : "bg-cyan/14 text-cyan"
                  }`}
                >
                  <span
                    className={`h-1.5 w-1.5 rounded-full ${ui?.pin ?? "bg-pin-off"} ${ui?.pulsa ? "pulse-agora" : ""}`}
                  />
                  {ui?.label ?? "sem sinal"}
                </span>
                <div className="flex shrink-0 gap-2">
                  <button
                    type="button"
                    disabled
                    className="cursor-not-allowed rounded-xl border border-white/16 px-3 py-2 text-xs font-semibold text-text-soft opacity-50"
                  >
                    Editar
                  </button>
                  <button
                    type="button"
                    disabled
                    className="cursor-not-allowed rounded-xl border border-white/10 px-3 py-2 text-xs font-semibold text-muted-2 opacity-50"
                  >
                    Tirar do ar
                  </button>
                </div>
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
      className={`flex-1 rounded-2xl border bg-sunken px-4 py-3.5 ${
        alerta && valor > 0 ? "border-amber/28" : "border-white/6"
      }`}
    >
      <div className={`font-display text-[26px] leading-none ${alerta && valor > 0 ? "text-amber" : ""}`}>
        {valor}
      </div>
      <div className="mt-1.5 text-[11.5px] text-muted-2">{rotulo}</div>
    </div>
  );
}

const CAMPO =
  "w-full rounded-2xl border border-white/10 bg-sunken px-3.5 py-3 text-[13.5px] text-text outline-none placeholder:text-muted-3 focus:border-white/25";

export function FormPublicar({
  lugares,
  bairro,
  compacto = false,
}: {
  lugares: LugarPublic[];
  bairro: string;
  compacto?: boolean;
}) {
  return (
    <form
      className={`flex flex-col gap-3.5 rounded-[22px] border border-white/7 bg-card-alt p-5.5 ${
        compacto ? "" : "h-full"
      }`}
    >
      <div>
        <h2 className="font-display text-[26px] leading-none uppercase">Publicar rolê</h2>
        <p className="mt-2 text-xs leading-relaxed text-muted-2">
          Você acabou de sair de lá. Escreva enquanto está fresco.
        </p>
      </div>

      <label className="flex flex-col gap-1.5">
        <span className="rotulo text-muted-3">lugar</span>
        <select className={CAMPO} defaultValue={lugares[0]?.id}>
          {lugares.map((l) => (
            <option key={l.id} value={l.id}>
              {l.nome}
            </option>
          ))}
        </select>
      </label>

      <label className="flex flex-col gap-1.5">
        <span className="rotulo text-muted-3">título</span>
        <input className={CAMPO} placeholder="Selo aberto no rooftop" />
      </label>

      {/* Maior de propósito: é o que faz alguém sair de casa. */}
      <label className="flex flex-col gap-1.5">
        <span className="flex items-baseline justify-between">
          <span className="rotulo text-amber">motivo pra ir</span>
          <span className="text-[11px] text-muted-3">o que você viu lá</span>
        </span>
        <textarea
          rows={compacto ? 3 : 4}
          className={`${CAMPO} resize-none border-amber/35 leading-relaxed`}
          placeholder="Entrada livre até meia-noite. Set de house às 23h30, teto aberto."
        />
      </label>

      <div className="flex gap-2.5">
        <label className="flex flex-1 flex-col gap-1.5">
          <span className="rotulo text-muted-3">começa</span>
          <input type="time" className={CAMPO} defaultValue="23:00" />
        </label>
        <label className="flex flex-1 flex-col gap-1.5">
          <span className="rotulo text-muted-3">termina</span>
          <input type="time" className={CAMPO} defaultValue="04:00" />
        </label>
      </div>

      <div className="mt-auto flex flex-col gap-2.5">
        <button
          type="button"
          disabled
          className="cursor-not-allowed rounded-2xl bg-magenta/40 py-3.5 text-[14.5px] font-bold text-white/70"
        >
          Publicar em {bairro}
        </button>
        <p className="text-center text-[11.5px] leading-snug text-muted-3">
          Entrar como curador para publicar — o login chega na fase 3.
        </p>
      </div>
    </form>
  );
}
