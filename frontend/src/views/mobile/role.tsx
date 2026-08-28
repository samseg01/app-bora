import Link from "next/link";
import { AcaoSalvar } from "@/components/ui/acao-salvar";
import { AcaoSinalizar } from "@/components/ui/acao-sinalizar";
import { ContarComoEsta } from "@/components/ui/contar-como-esta";
import { FrescorPill } from "@/components/ui/frescor-pill";
import { MobileShell } from "./shell";
import { hora, idade } from "@/lib/tempo";
import type { ComentarioResumo, LugarDetalhe, RolePublic } from "@/lib/types";

/**
 * Tela 2d — detalhe do rolê. Sem barra inferior, como no design: aqui a pessoa está
 * decidindo uma coisa só, e a navegação de volta é o botão de voltar.
 */
export function RoleMobile({
  role,
  lugar,
  comentarios,
}: {
  role: RolePublic;
  lugar: LugarDetalhe | null;
  comentarios: ComentarioResumo[];
}) {
  return (
    <MobileShell nav={false}>
      <div className="relative h-62 shrink-0 bg-gradient-to-br from-magenta via-violet to-plum">
        <div className="absolute inset-0 bg-gradient-to-t from-surface to-transparent" />
        <Link
          href="/"
          className="absolute top-4 left-4 flex h-9 w-9 items-center justify-center rounded-full bg-surface/60 text-[15px] font-semibold"
          aria-label="Voltar"
        >
          <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
            <path d="M15 18l-6-6 6-6" />
          </svg>
        </Link>
        <div className="absolute bottom-4 left-5.5 flex gap-2">
          <FrescorPill frescor={role.frescor} />
          <span className="rounded-full bg-amber/16 px-2.5 py-1.5 text-[11px] font-semibold text-amber-soft">
            termina {hora(role.data_fim)}
          </span>
        </div>
      </div>

      <div className="px-5.5 pt-1">
        <div className="rotulo text-amber">rolê de hoje · {role.categoria}</div>
        <h1 className="mt-2.5 font-display text-[29px] leading-[1.04] uppercase">{role.titulo}</h1>
        {role.descricao ? (
          <p className="mt-2.5 text-[13.5px] leading-relaxed text-muted text-pretty">
            {role.descricao}
          </p>
        ) : (
          <p className="mt-2.5 text-[12.5px] leading-relaxed text-muted-3">
            Sem descrição — o campo do “motivo pra ir” ainda não existe no backend.
          </p>
        )}
      </div>

      <div className="mx-5.5 mt-4.5 flex items-center justify-between border-y border-white/8 py-3.5">
        <div className="flex min-w-0 items-center gap-3">
          <div className="h-10.5 w-10.5 shrink-0 rounded-xl bg-gradient-to-br from-cyan to-violet" />
          <div className="min-w-0">
            <div className="truncate text-[15px] font-bold">{lugar?.nome ?? "Lugar"}</div>
            <div className="mt-0.5 truncate text-xs text-muted-2">
              o lugar{lugar?.endereco ? ` · ${lugar.endereco}` : ""}
            </div>
          </div>
        </div>
        {lugar && <AcaoSalvar lugarId={lugar.id} />}
      </div>

      {comentarios.length > 0 && (
        <div className="mx-5.5 mt-4 flex flex-col gap-3 rounded-[18px] border border-white/6 bg-card-alt p-4">
          <div className="rotulo text-muted-3">quem está lá agora</div>
          {comentarios.slice(0, 2).map((c) => (
            <div key={`${c.autor_nome}-${c.created_at}`} className="flex items-start gap-2.5">
              <div className="h-7 w-7 shrink-0 rounded-full bg-gradient-to-br from-violet to-cyan" />
              <p className="text-[12.5px] leading-snug text-text-dim">
                “{c.texto}” — <span className="font-semibold text-white">{c.autor_nome}</span>,{" "}
                {idade(c.created_at)}
              </p>
            </div>
          ))}
        </div>
      )}

      {typeof role.sinais_recentes === "number" && (
        <div className="mx-5.5 mt-3 rounded-2xl border border-white/6 bg-sunken px-4 py-3.5">
          <div className="font-display text-[26px] leading-none">{role.sinais_recentes}</div>
          <div className="mt-1 text-[11.5px] text-muted-2">sinalizaram nas últimas 2h</div>
        </div>
      )}

      <div className="mt-auto flex flex-col gap-3 px-5.5 pt-4 pb-6.5">
        <AcaoSinalizar roleId={role.id} dataFim={role.data_fim} />
        <ContarComoEsta roleId={role.id} />
      </div>
    </MobileShell>
  );
}
