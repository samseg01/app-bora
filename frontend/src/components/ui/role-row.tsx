import Link from "next/link";
import { FrescorPill } from "./frescor-pill";
import { hora } from "@/lib/tempo";
import type { RoleDescoberta } from "@/lib/types";

/**
 * A linha larga da visualização desktop. É o que o card do rail vira quando há
 * largura: cabe o motivo pra ir e as ações ficam visíveis sem entrar no detalhe.
 *
 * "Tô indo" navega para o detalhe em vez de sinalizar daqui: a sinalização é um
 * compromisso, e o lugar de assumi-lo é a tela que mostra o rolê inteiro. (Além
 * disso `POST /sinalizacoes` responde 403 para papel comum — ver ADR-0006.)
 */

const GRADIENTES = [
  "from-magenta to-violet",
  "from-amber to-magenta",
  "from-cyan to-violet",
  "from-violet to-plum",
];

export function RoleRow({ role, indice }: { role: RoleDescoberta; indice: number }) {
  return (
    <div
      className={`flex gap-[18px] rounded-[20px] border bg-card p-4 ${
        role.frescor === "live" ? "border-magenta/30" : "border-white/7"
      }`}
    >
      <div
        className={`h-[124px] w-[124px] shrink-0 rounded-2xl bg-gradient-to-br ${GRADIENTES[indice % GRADIENTES.length]}`}
      />

      <div className="flex min-w-0 flex-1 flex-col gap-[7px]">
        <div className="flex items-center gap-2.5">
          <span className="rotulo text-amber">{role.categoria}</span>
          <FrescorPill frescor={role.frescor} />
        </div>

        <Link href={`/role/${role.id}`} className="text-[21px] leading-tight font-bold text-text hover:text-magenta-soft">
          {role.titulo}
        </Link>

        {/* Nem todo rolê tem motivo escrito — a coluna é nullable de propósito. */}
        {role.descricao && (
          <p className="text-[13px] leading-relaxed text-text-dim">{role.descricao}</p>
        )}

        <div className="mt-auto flex gap-4 text-[12.5px] text-muted-2">
          <span>{role.lugar_nome}</span>
          <span>termina {hora(role.data_fim)}</span>
        </div>
      </div>

      <div className="flex w-[132px] shrink-0 flex-col justify-center gap-2.5 border-l border-white/7 pl-[18px]">
        <Link
          href={`/role/${role.id}`}
          className="rounded-2xl bg-magenta py-2.5 text-center text-[13px] font-bold text-white"
        >
          Tô indo
        </Link>
        <button
          type="button"
          disabled
          title="Entrar para salvar — o login chega na fase 3"
          className="cursor-not-allowed rounded-2xl border border-white/18 py-2.5 text-[13px] font-semibold text-text-soft opacity-45"
        >
          Salvar
        </button>
      </div>
    </div>
  );
}
