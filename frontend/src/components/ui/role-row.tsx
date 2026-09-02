import Link from "next/link";
import { AcaoSalvar } from "./acao-salvar";
import { BotaoToIndo } from "./botao-to-indo";
import { FrescorPill } from "./frescor-pill";
import { hora } from "@/lib/tempo";
import type { RoleDescoberta } from "@/lib/types";

/**
 * A linha larga da visualização desktop. É o que o card do rail vira quando há
 * largura: cabe o motivo pra ir e as ações ficam visíveis sem entrar no detalhe.
 *
 * "Tô indo" navega para o detalhe em vez de sinalizar daqui: a sinalização é um
 * compromisso, e o lugar de assumi-lo é a tela que mostra o rolê inteiro. (Além
 * disso `POST /sinalizacoes` responde 403 para papel comum — ver ADR-0006.) Mas ele
 * mostra se você já marcou, em vez de convidar a marcar de novo.
 *
 * Salvar ficava `disabled` com um aviso sobre "a fase 3", que já passou. O motivo real
 * era outro: `RoleDescoberta` não trazia `lugar_id`, e `POST /salvos` precisa dele. O
 * botão estava desabilitado por falta de dado, não por regra — agora o schema traz.
 */

const GRADIENTES = [
  "from-pedra-funda to-pedra",
  "from-pedra via-pedra-funda to-pedra",
  "from-pedra to-pedra-funda",
  "from-pedra to-pedra-funda",
];

export function RoleRow({ role, indice }: { role: RoleDescoberta; indice: number }) {
  return (
    <div
      className={`flex gap-[18px] border bg-card p-4 ${
        role.frescor === "live" ? "border-linha-forte" : "border-linha"
      }`}
    >
      <div
        className={`h-[124px] w-[124px] shrink-0 bg-gradient-to-br ${GRADIENTES[indice % GRADIENTES.length]}`}
      />

      <div className="flex min-w-0 flex-1 flex-col gap-[7px]">
        <div className="flex items-center gap-2.5">
          <span className="rotulo text-text-faint">{role.categoria}</span>
          <FrescorPill frescor={role.frescor} />
        </div>

        <Link href={`/role/${role.id}`} className="text-[21px] leading-tight font-bold text-text hover:text-text-soft">
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

      <div className="rounded-[16px] flex w-[132px] shrink-0 flex-col justify-center gap-2.5 border-l border-linha pl-[18px]">
        <BotaoToIndo roleId={role.id} />
        <AcaoSalvar lugarId={role.lugar_id} variante="botao" />
      </div>
    </div>
  );
}
