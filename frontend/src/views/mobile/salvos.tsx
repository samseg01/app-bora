import Link from "next/link";
import { MobileShell } from "./shell";
import { frescorUI } from "@/lib/frescor";
import { hora } from "@/lib/tempo";
import type { ItemSalvo } from "../desktop/salvos";

/**
 * Tela 2g — o caderninho. Lista vertical: no telefone a grade de três colunas do
 * desktop viraria três miniaturas ilegíveis.
 */
export function SalvosMobile({ itens }: { itens: ItemSalvo[] }) {
  const comRole = itens.filter((i) => i.role);

  return (
    <MobileShell>
      <div className="px-5.5 pt-9.5">
        <h1 className="titulo text-[31px] leading-none">Meu caderninho</h1>
        <p className="mt-1.5 text-[13px] text-muted-2">
          {itens.length} {itens.length === 1 ? "lugar salvo" : "lugares salvos"} · só seus
        </p>
      </div>

      {itens.length === 0 && (
        <div className="elevado rounded-[16px] mx-5.5 mt-5 border border-linha bg-card px-5 py-5.5">
          <h2 className="titulo text-[22px] leading-tight">Caderninho vazio</h2>
          <p className="mt-2.5 text-[13px] leading-relaxed text-muted text-pretty">
            Salve um lugar tocando no coração quando algum te interessar. Fica só pra você.
          </p>
        </div>
      )}

      <div className="mt-4.5 flex flex-col gap-2.5 px-5.5">
        {itens.map(({ lugar, role }, i) => {
          const ui = frescorUI(role?.frescor ?? null);
          const conteudo = (
            <>
              <div
                className={`h-14.5 w-14.5 shrink-0 bg-gradient-to-br ${
                  ["from-pedra-funda to-pedra", "from-pedra via-pedra-funda to-pedra", "from-pedra to-pedra-funda", "from-pedra to-pedra-funda"][i % 4]
                }`}
              />
              <div className="min-w-0 flex-1">
                <Link href={`/lugar/${lugar.id}`} className="truncate text-[15px] font-bold hover:text-text-soft">
                  {lugar.nome}
                </Link>
                <div className="mt-0.5 truncate text-xs text-muted-2">
                  {lugar.categoria} · {lugar.bairro}
                </div>
              </div>
              {role && ui ? (
                <span className="flex shrink-0 items-center gap-1.5 rounded-full bg-card px-2.5 py-1.5 text-[11px] font-semibold text-text-soft">
                  <span className={`h-1.5 w-1.5 rounded-full ${ui.pin} ${ui.pulsa ? "pulse-agora" : ""}`} />
                  tem rolê
                </span>
              ) : (
                <span className="shrink-0 text-[11px] font-semibold text-muted-3">
                  sem rolê hoje
                </span>
              )}
            </>
          );

          const classe = `flex items-center gap-3.5 border bg-card p-2.5 ${
            role ? "border-linha-forte" : "border-linha"
          }`;

          return role ? (
            <Link key={lugar.id} href={`/role/${role.id}`} className={classe}>
              {conteudo}
            </Link>
          ) : (
            <div key={lugar.id} className={classe}>
              {conteudo}
            </div>
          );
        })}
      </div>

      {comRole.length > 0 && (
        <div className="mx-5.5 mt-4.5 mb-4 flex items-center justify-between gap-4 border border-linha-forte bg-gradient-to-br from-text-dim/14 to-text-dim/7 px-4 py-3.5">
          <p className="text-[12.5px] leading-snug text-text-soft">
            <span className="font-semibold">
              {comRole.length} {comRole.length === 1 ? "salvo virou rolê" : "salvos viraram rolê"}{" "}
              hoje.
            </span>{" "}
            {comRole[0].lugar.nome} até {hora(comRole[0].role!.data_fim)}.
          </p>
          <Link
            href={`/role/${comRole[0].role!.id}`}
            className="shrink-0 text-xs font-semibold text-text-soft"
          >
            ver →
          </Link>
        </div>
      )}
    </MobileShell>
  );
}
