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
            <h1 className="titulo text-[46px] leading-none">Meu caderninho</h1>
            <p className="mt-2.5 text-[13px] text-muted-2">
              {itens.length} {itens.length === 1 ? "lugar salvo" : "lugares salvos"} · só seus,
              ninguém mais vê
            </p>
          </div>
          <div className="flex gap-2.5">
            <span className="rounded-full bg-text px-4 py-2.5 text-[12.5px] font-semibold text-bg">
              Todos
            </span>
            <span className="rounded-full border border-linha px-4 py-2.5 text-[12.5px] font-semibold text-text-faint">
              Com rolê hoje
            </span>
            <span className="rounded-full border border-linha px-4 py-2.5 text-[12.5px] font-semibold text-text-faint">
              Salvos recentes
            </span>
          </div>
        </div>

        {comRole.length > 0 && (
          <div className="mt-6.5 flex items-center justify-between gap-5 border border-linha-forte bg-gradient-to-br from-text-dim/14 to-text-dim/7 px-5.5 py-4.5">
            <div className="flex items-center gap-3.5">
              <span className="pulse-agora h-2.5 w-2.5 shrink-0 rounded-full bg-agora" />
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
              className="shrink-0 text-[13px] font-semibold text-text-soft"
            >
              ver o rolê →
            </Link>
          </div>
        )}

        {itens.length === 0 ? (
          <div className="elevado rounded-[20px] mt-7 max-w-[30rem] border border-linha bg-card px-6 py-7">
            <h2 className="titulo text-[26px] leading-tight">
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
  "from-pedra-funda to-pedra",
  "from-pedra via-pedra-funda to-pedra",
  "from-pedra to-pedra-funda",
  "from-pedra to-pedra-funda",
  "from-pedra to-pedra-funda",
  "from-pedra to-pedra-funda",
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
          <Link href={`/lugar/${lugar.id}`} className="truncate text-[15.5px] font-bold hover:text-text-soft">
            {lugar.nome}
          </Link>
          <div className="mt-1 truncate text-xs text-muted-2">
            {lugar.categoria} · {lugar.bairro}
          </div>
        </div>
        {role && ui ? (
          <span
            className={`flex shrink-0 items-center gap-1.5 rounded-full px-2.5 py-1.5 text-[11px] font-semibold ${
              role.frescor === "live"
                ? "bg-card text-text-soft"
                : role.frescor === "warm"
                  ? "bg-text-dim/14 text-text-dim"
                  : "bg-muted/14 text-muted"
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

  const classe = `overflow-hidden border bg-card ${
    role ? "border-linha-forte" : "border-linha"
  }`;

  return role ? (
    <Link href={`/role/${role.id}`} className={`${classe} block transition-colors hover:border-linha`}>
      {corpo}
    </Link>
  ) : (
    <div className={classe}>{corpo}</div>
  );
}
