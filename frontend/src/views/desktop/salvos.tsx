import Link from "next/link";
import { DesktopShell } from "./shell";
import { frescorUI } from "@/lib/frescor";
import { hora } from "@/lib/tempo";
import type { LugarPublic, RolePin } from "@/lib/types";

export interface ItemSalvo {
  lugar: LugarPublic;
  role: RolePin | null;
}

/**
 * Tela 2g em tela grande — a grade que o telefone não comporta.
 *
 * Os estados "aberto"/"fechado" do hi-fi não existem aqui: horário de funcionamento
 * não está no schema. Trocados por "tem rolê" / "sem rolê hoje", que é derivável do
 * `role_ativo` de hoje. Os filtros seguem a mesma regra.
 */
export function SalvosDesktop({ itens }: { itens: ItemSalvo[] }) {
  const comRole = itens.filter((i) => i.role);

  return (
    <DesktopShell>
      <section className="min-w-0 flex-1 px-10 py-8">
        <div className="flex items-end justify-between gap-6">
          <div>
            <h1 className="font-display text-[46px] leading-none uppercase">Meu caderninho</h1>
            <p className="mt-2.5 text-[13px] text-muted-2">
              {itens.length} {itens.length === 1 ? "lugar salvo" : "lugares salvos"} · só seus,
              ninguém mais vê
            </p>
          </div>
          <div className="flex gap-2.5">
            <span className="rounded-full bg-magenta px-4 py-2.5 text-[12.5px] font-semibold text-white">
              Todos
            </span>
            <span className="rounded-full border border-white/12 px-4 py-2.5 text-[12.5px] font-semibold text-text-faint">
              Com rolê hoje
            </span>
            <span className="rounded-full border border-white/12 px-4 py-2.5 text-[12.5px] font-semibold text-text-faint">
              Salvos recentes
            </span>
          </div>
        </div>

        {comRole.length > 0 && (
          <div className="mt-6.5 flex items-center justify-between gap-5 rounded-[20px] border border-magenta/22 bg-gradient-to-br from-magenta/14 to-amber/7 px-5.5 py-4.5">
            <div className="flex items-center gap-3.5">
              <span className="pulse-agora h-2.5 w-2.5 shrink-0 rounded-full bg-magenta" />
              <p className="text-sm leading-snug text-text-soft">
                <span className="font-semibold">
                  {comRole.length}{" "}
                  {comRole.length === 1 ? "salvo virou rolê" : "salvos viraram rolê"} hoje.
                </span>{" "}
                {comRole[0].lugar.nome} tem {comRole[0].role!.titulo.toLowerCase()} até{" "}
                {hora(comRole[0].role!.data_fim)}.
              </p>
            </div>
            <Link
              href={`/role/${comRole[0].role!.id}`}
              className="shrink-0 text-[13px] font-semibold text-magenta-soft"
            >
              ver o rolê →
            </Link>
          </div>
        )}

        {itens.length === 0 ? (
          <div className="mt-7 max-w-[30rem] rounded-[20px] border border-white/7 bg-card px-6 py-7">
            <h2 className="font-display text-[26px] leading-tight uppercase">
              Caderninho vazio
            </h2>
            <p className="mt-3 text-[13.5px] leading-relaxed text-muted text-pretty">
              Salve um lugar tocando no coração quando algum te interessar. Fica só pra você —
              serve pra lembrar depois, não pra mostrar pra ninguém.
            </p>
          </div>
        ) : (
          <div className="mt-5.5 grid grid-cols-3 gap-4.5">
            {itens.map(({ lugar, role }, i) => (
              <CardSalvo key={lugar.id} lugar={lugar} role={role} indice={i} />
            ))}
          </div>
        )}
      </section>
    </DesktopShell>
  );
}

const GRADIENTES = [
  "from-magenta to-violet",
  "from-amber to-magenta",
  "from-violet to-plum",
  "from-cyan to-plum",
  "from-cyan to-violet",
  "from-plum to-violet",
];

function CardSalvo({
  lugar,
  role,
  indice,
}: {
  lugar: LugarPublic;
  role: RolePin | null;
  indice: number;
}) {
  const ui = frescorUI(role?.frescor ?? null);

  const corpo = (
    <>
      <div className={`h-33 bg-gradient-to-br ${GRADIENTES[indice % GRADIENTES.length]}`} />
      <div className="flex items-start justify-between gap-2.5 px-4 pt-3.5 pb-4.5">
        <div className="min-w-0">
          <div className="truncate text-[15.5px] font-bold">{lugar.nome}</div>
          <div className="mt-1 truncate text-xs text-muted-2">
            {lugar.categoria} · {lugar.bairro}
          </div>
        </div>
        {role && ui ? (
          <span
            className={`flex shrink-0 items-center gap-1.5 rounded-full px-2.5 py-1.5 text-[11px] font-semibold ${
              role.frescor === "live"
                ? "bg-magenta/16 text-magenta-soft"
                : role.frescor === "warm"
                  ? "bg-amber/14 text-amber-soft"
                  : "bg-cyan/14 text-cyan"
            }`}
          >
            <span className={`h-1.5 w-1.5 rounded-full ${ui.pin} ${ui.pulsa ? "pulse-agora" : ""}`} />
            tem rolê
          </span>
        ) : (
          <span className="shrink-0 pt-1.5 text-[11px] font-semibold whitespace-nowrap text-muted-3">
            sem rolê hoje
          </span>
        )}
      </div>
    </>
  );

  const classe = `overflow-hidden rounded-[20px] border bg-card ${
    role ? "border-magenta/35" : "border-white/7"
  }`;

  return role ? (
    <Link href={`/role/${role.id}`} className={`${classe} block transition-colors hover:border-white/20`}>
      {corpo}
    </Link>
  ) : (
    <div className={classe}>{corpo}</div>
  );
}
