import Link from "next/link";
import { AcaoSalvar } from "@/components/ui/acao-salvar";
import { AcaoSinalizar } from "@/components/ui/acao-sinalizar";
import { ContarComoEsta } from "@/components/ui/contar-como-esta";
import { FrescorPill } from "@/components/ui/frescor-pill";
import { MapaReal } from "@/components/ui/mapa-real";
import { DesktopShell } from "./shell";
import { hora, idade } from "@/lib/tempo";
import type { ComentarioResumo, LugarDetalhe, MapaPin, RolePublic } from "@/lib/types";

/** Tela de detalhe, visualização desktop: o rolê à esquerda, o que fazer com ele à direita. */
export function RoleDesktop({
  role,
  lugar,
  comentarios,
}: {
  role: RolePublic;
  lugar: LugarDetalhe | null;
  comentarios: ComentarioResumo[];
}) {
  const pins: MapaPin[] = lugar
    ? [{ lugar, role_ativo: null, frescor: lugar.frescor, total_comentarios: comentarios.length }]
    : [];

  return (
    <DesktopShell>
      <div className="flex min-w-0 flex-1 gap-7 px-8 py-7">
        <section className="flex min-w-0 flex-1 flex-col">
          <Link
            href="/"
            className="mb-4 flex items-center gap-2 text-[13px] font-semibold text-muted-2 hover:text-text"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
              <path d="M15 18l-6-6 6-6" />
            </svg>
            Voltar para a noite de hoje
          </Link>

          <div className="rounded-[16px] relative h-67 shrink-0 overflow-hidden bg-gradient-to-br from-pedra via-pedra-funda to-pedra">
            <div className="absolute inset-0 bg-gradient-to-t from-surface/92 to-transparent" />
            <div className="absolute bottom-4.5 left-5.5 flex gap-2.5">
              <FrescorPill frescor={role.frescor} />
              <span className="rounded-full bg-text-dim/16 px-3 py-1.5 text-[11.5px] font-semibold text-text-dim">
                termina {hora(role.data_fim)}
              </span>
            </div>
          </div>

          <div className="rotulo mt-6 text-text-faint">rolê de hoje · {role.categoria}</div>
          <h1 className="mt-2.5 titulo text-[46px] leading-[1.02]">{role.titulo}</h1>

          {role.descricao ? (
            <p className="mt-3.5 max-w-[560px] text-[15px] leading-relaxed text-text-faint text-pretty">
              {role.descricao}
            </p>
          ) : (
            <p className="mt-3.5 max-w-[560px] text-[13.5px] leading-relaxed text-muted-3">
              Sem descrição — o campo do “motivo pra ir” ainda não existe no backend.
            </p>
          )}

          <div className="mt-5.5 flex gap-3.5">
            {role.sinais_recentes > 0 && (
              <Stat valor={String(role.sinais_recentes)} rotulo="sinalizaram nas últimas 2h" />
            )}
            <Stat valor={hora(role.data_inicio)} rotulo="começou" />
            <Stat valor={hora(role.data_fim)} rotulo="termina" />
          </div>
        </section>

        <aside className="flex w-[356px] shrink-0 flex-col gap-3.5">
          <div className="elevado rounded-[20px] flex flex-col gap-3.5 border border-linha bg-card p-5">
            <div className="flex items-center gap-3">
              <div className="h-11.5 w-11.5 shrink-0 bg-gradient-to-br from-pedra to-pedra-funda" />
              <div className="min-w-0">
                {lugar ? (
                  <Link
                    href={`/lugar/${lugar.id}`}
                    className="block truncate text-base font-bold hover:text-text-soft"
                  >
                    {lugar.nome}
                  </Link>
                ) : (
                  <div className="truncate text-base font-bold">Lugar</div>
                )}
                <div className="mt-0.5 truncate text-xs text-muted-2">
                  o lugar{lugar?.endereco ? ` · ${lugar.endereco}` : ""}
                </div>
              </div>
            </div>

            <AcaoSinalizar roleId={role.id} dataFim={role.data_fim} />

            {lugar && <AcaoSalvar lugarId={lugar.id} variante="botao" />}

            <ContarComoEsta roleId={role.id} />
          </div>

          {lugar && (
            <MapaReal pins={pins} className="rounded-[16px] h-44 shrink-0 border border-linha">
              <div className="rounded-[12px] absolute inset-x-3.5 bottom-3.5 flex items-center justify-between border border-linha bg-sunken/92 px-3.5 py-2.5">
                <span className="truncate text-xs text-text-faint">
                  {lugar.endereco ?? lugar.bairro}
                </span>
                <a
                  href={`https://www.google.com/maps/dir/?api=1&destination=${lugar.lat},${lugar.lng}`}
                  target="_blank"
                  rel="noreferrer"
                  className="shrink-0 text-xs font-semibold text-text-soft"
                >
                  Rota
                </a>
              </div>
            </MapaReal>
          )}

          {comentarios.length > 0 && (
            <div className="elevado rounded-[16px] flex flex-col gap-3.5 border border-linha bg-card-alt px-5 py-4.5">
              <div className="rotulo text-muted-3">quem está lá agora</div>
              {comentarios.map((c) => (
                <div key={`${c.autor_nome}-${c.created_at}`} className="flex items-start gap-2.5">
                  <div className="h-7 w-7 shrink-0 rounded-full bg-gradient-to-br from-pedra to-pedra-funda" />
                  <p className="text-[12.5px] leading-snug text-text-dim">
                    “{c.texto}” — <span className="font-semibold text-white">{c.autor_nome}</span>,{" "}
                    {idade(c.created_at)}
                  </p>
                </div>
              ))}
            </div>
          )}
        </aside>
      </div>
    </DesktopShell>
  );
}

function Stat({ valor, rotulo }: { valor: string; rotulo: string }) {
  return (
    <div className="rounded-[12px] flex-1 border border-linha bg-sunken px-4 py-3.5">
      <div className="titulo text-[27px] leading-none">{valor}</div>
      <div className="mt-1.5 text-[11.5px] leading-tight text-muted-2">{rotulo}</div>
    </div>
  );
}
