import Link from "next/link";
import { Avatar, AvatarPilha } from "@/components/ui/avatar";
import { DesktopShell } from "./shell";
import { frescorUI } from "@/lib/frescor";
import { idade } from "@/lib/tempo";
import type { CheckInDeConexao, Conexao, LugarPublic, SalvoDeConexao } from "@/lib/types";

export interface DadosConexoes {
  foraAgora: CheckInDeConexao[];
  salvos: SalvoDeConexao[];
  conexoes: Conexao[];
  pendentes: Conexao[];
  salvosDoCurador: LugarPublic[];
  curador: string;
  bairro: string;
  /** Calculado no servidor — ler o relógio durante o render é impuro. */
  agora: number;
}

export function ConexoesDesktop(d: DadosConexoes) {
  if (d.conexoes.length === 0) {
    return (
      <DesktopShell>
        <ConexoesVaziasDesktop {...d} />
      </DesktopShell>
    );
  }

  return (
    <DesktopShell>
      <section className="min-w-0 flex-1 px-8 py-8">
        <h1 className="titulo text-[46px] leading-none">Conexões</h1>
        <p className="mt-2 text-[13px] text-muted-2">
          {d.foraAgora.length} de {d.conexoes.length} estão na rua agora
        </p>

        <div className="rotulo mt-7 text-muted-3">fora agora</div>
        <div className="mt-3.5 flex flex-col gap-2.5">
          {d.foraAgora.length === 0 && (
            <p className="text-[13.5px] text-muted">
              Ninguém da sua turma marcou nada ainda hoje.
            </p>
          )}
          {d.foraAgora.map((c) => (
            <LinhaForaAgora key={c.id} checkin={c} agora={d.agora} />
          ))}
        </div>

        <div className="mt-7.5 flex items-baseline justify-between">
          <div className="rotulo text-muted-3">salvos por quem você confia</div>
          <span className="text-xs text-muted-3">lugares que você ainda não conhece</span>
        </div>
        <div className="mt-3.5 grid grid-cols-4 gap-3.5">
          {d.salvos.map(({ lugar, por }) => (
            <CardSalvoDeConexao key={lugar.id} lugar={lugar} por={por} />
          ))}
        </div>
      </section>

      <aside className="flex w-80 shrink-0 flex-col gap-3.5 py-8 pr-7">
        {d.pendentes.map((p) => (
          <div
            key={p.id}
            className="elevado rounded-[20px] flex flex-col gap-3 border border-linha bg-card-alt p-5"
          >
            <div className="rotulo text-muted-3">pedido pendente</div>
            <div className="flex items-center gap-3">
              <Avatar nome={p.nome} tamanho={40} />
              <div className="min-w-0">
                <div className="text-sm font-bold">{p.nome}</div>
                <div className="mt-0.5 text-[11.5px] text-muted-3">quer se conectar</div>
              </div>
            </div>
            <div className="flex gap-2.5">
              <button
                type="button"
                disabled
                className="rounded-[12px] flex-1 cursor-not-allowed bg-text/40 py-2.5 text-[12.5px] font-bold text-bg/70"
              >
                Aceitar
              </button>
              <button
                type="button"
                disabled
                className="rounded-[12px] flex-1 cursor-not-allowed border border-linha py-2.5 text-[12.5px] font-semibold text-muted-2 opacity-60"
              >
                Recusar
              </button>
            </div>
          </div>
        ))}

        <div className="elevado rounded-[20px] flex flex-1 flex-col gap-3.5 border border-linha bg-card-alt p-5">
          <div className="flex items-baseline justify-between">
            <span className="rotulo text-muted-3">suas conexões</span>
            <span className="text-xs text-muted-3">{d.conexoes.length}</span>
          </div>

          <div className="flex flex-col gap-3">
            {d.conexoes.map((c) => {
              const fora = d.foraAgora.find((f) => f.conexao_id === c.id);
              const ui = frescorUI(fora?.frescor ?? null);
              return (
                <div
                  key={c.id}
                  className={`flex items-center gap-2.5 ${fora ? "" : "opacity-50"}`}
                >
                  <Avatar nome={c.nome} tamanho={32} />
                  <span className="flex-1 text-[13.5px] font-semibold">{c.nome}</span>
                  {fora ? (
                    <span
                      className={`h-[7px] w-[7px] shrink-0 rounded-full ${ui?.pin ?? "bg-muted"}`}
                    />
                  ) : (
                    <span className="text-[11px] text-muted-3">em casa</span>
                  )}
                </div>
              );
            })}
          </div>

          <Link
            href="/conexoes/convite"
            className="rounded-[16px] mt-auto flex items-center justify-center gap-2.5 border border-dashed border-linha py-3.5 text-[13.5px] font-semibold text-text-soft hover:border-linha"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
              <path d="M12 5v14M5 12h14" />
            </svg>
            Convidar por link
          </Link>
        </div>
      </aside>
    </DesktopShell>
  );
}

function LinhaForaAgora({ checkin, agora }: { checkin: CheckInDeConexao; agora: number }) {
  const ui = frescorUI(checkin.frescor);
  const vago = checkin.lugar_id === null;

  return (
    <div
      className={`flex items-center gap-4 border bg-card px-4 py-3.5 ${
        checkin.frescor === "live" ? "border-linha-forte" : "border-linha"
      }`}
    >
      <Avatar nome={checkin.nome} tamanho={46} />

      <div className="min-w-0 flex-1">
        <div className="text-[15px] font-bold">{checkin.nome}</div>
        <div className="mt-0.5 text-[12.5px] text-muted">
          {vago ? "está " : "está no "}
          <span className="font-semibold text-text">
            {vago ? `na ${checkin.bairro}` : checkin.lugar_nome}
          </span>{" "}
          · há {idade(checkin.timestamp, agora)}
        </div>
      </div>

      {checkin.role_titulo && ui ? (
        <span
          className={`flex shrink-0 items-center gap-1.5 rounded-full px-2.5 py-1.5 text-[11px] font-semibold ${
            checkin.frescor === "live"
              ? "bg-card text-text-soft"
              : "bg-text-dim/14 text-text-dim"
          }`}
        >
          <span className={`h-1.5 w-1.5 rounded-full ${ui.pin} ${ui.pulsa ? "pulse-live" : ""}`} />
          {checkin.role_titulo.toLowerCase()}
        </span>
      ) : (
        <span className="shrink-0 rounded-full border border-dashed border-linha px-2.5 py-1.5 text-[11px] font-semibold text-muted-2">
          sem lugar exato
        </span>
      )}

      {checkin.role_id ? (
        <Link
          href={`/role/${checkin.role_id}`}
          className="rounded-[12px] shrink-0 bg-text px-4 py-2.5 text-[12.5px] font-bold text-bg"
        >
          Tô indo também
        </Link>
      ) : (
        <button
          type="button"
          disabled
          className="rounded-[12px] shrink-0 cursor-not-allowed border border-linha px-4 py-2.5 text-[12.5px] font-semibold text-text-soft opacity-50"
        >
          Chamar
        </button>
      )}
    </div>
  );
}

const GRADIENTES = [
  "from-pedra to-pedra-funda",
  "from-pedra to-pedra-funda",
  "from-pedra to-pedra-funda",
  "from-pedra via-pedra-funda to-pedra",
];

export function CardSalvoDeConexao({
  lugar,
  por,
  indice = 0,
}: {
  lugar: LugarPublic;
  por?: string[];
  indice?: number;
}) {
  const chave = (lugar.nome.charCodeAt(0) + indice) % GRADIENTES.length;
  return (
    <div className="elevado rounded-[16px] overflow-hidden border border-linha bg-card">
      <div className={`h-23 bg-gradient-to-br ${GRADIENTES[chave]}`} />
      <div className="px-3.5 pt-3 pb-3.5">
        <div className="truncate text-sm font-bold">{lugar.nome}</div>
        <div className="mt-0.5 truncate text-[11.5px] text-muted-2">
          {lugar.categoria} · {lugar.bairro}
        </div>
        {por && por.length > 0 && (
          <div className="mt-2.5 flex items-center gap-2">
            <AvatarPilha nomes={por} />
            <span className="truncate text-[11px] text-muted">
              {por.length === 1 ? `${por[0]} salvou` : `${por.join(" e ")} salvaram`}
            </span>
          </div>
        )}
      </div>
    </div>
  );
}

/**
 * O estado vazio. É a tela mais importante da feature: o `conceito.md` nomeia o cold
 * start dentro do grupo de amigos como o risco do motor social — sozinha, a aba não
 * é "pouco conteúdo", é tela morta. Então ela diz a condição em voz alta e coloca os
 * salvos do curador do bairro no lugar, para nunca nascer vazia.
 */
function ConexoesVaziasDesktop({ salvosDoCurador, curador, bairro }: DadosConexoes) {
  return (
    <section className="min-w-0 flex-1 px-8 py-8">
      <h1 className="titulo text-[46px] leading-none">Conexões</h1>

      <div className="mt-10 flex max-w-lg flex-col items-start">
        <div className="flex h-18 w-18 items-center justify-center rounded-full border border-dashed border-linha">
          <svg width="30" height="30" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8}>
            <circle cx="9" cy="8" r="3.4" />
            <path d="M3 20c0-3.4 2.7-5.2 6-5.2s6 1.8 6 5.2" />
            <path d="M16.5 6.2a3.4 3.4 0 010 6.4" />
            <path d="M18.4 14.6c2 .7 3.6 2.3 3.6 5" />
          </svg>
        </div>
        <h2 className="mt-5 titulo text-[28px] leading-tight">
          Ainda é só você por aqui
        </h2>
        <p className="mt-3 text-[13.5px] leading-relaxed text-muted text-pretty">
          Esta aba serve pra ver onde as pessoas com quem você sai estão. Sozinho ela não faz
          nada — e a gente prefere dizer isso do que encher a tela.
        </p>
        <Link
          href="/conexoes/convite"
          className="rounded-[12px] mt-6 bg-text px-6 py-4 text-[15px] font-bold text-bg"
        >
          Convidar quem você sai
        </Link>
        <p className="mt-3 text-xs text-muted-3">
          Manda um link. Quem abrir vira conexão se você aceitar.
        </p>
      </div>

      <div className="mt-10 flex items-center gap-3">
        <div className="h-px flex-1 bg-gradient-to-r from-text-dim/40 to-text-dim/18" />
        <span className="rotulo text-muted-2">enquanto isso</span>
        <div className="h-px flex-1 bg-gradient-to-r from-text-dim/18 to-text-dim/40" />
      </div>

      <div className="elevado rounded-[16px] mt-5 flex items-center gap-3.5 border border-linha bg-card-alt p-4">
        <Avatar nome={curador} tamanho={40} />
        <p className="text-[12.5px] leading-relaxed text-text-faint">
          <span className="font-semibold text-text">Quem cura {bairro} vai a pé.</span>{" "}
          Enquanto seu grupo não chega, os salvos dele ficam aqui.
        </p>
      </div>

      <div className="mt-4 grid grid-cols-4 gap-3.5">
        {salvosDoCurador.map((lugar, i) => (
          <CardSalvoDeConexao key={lugar.id} lugar={lugar} indice={i} />
        ))}
      </div>
    </section>
  );
}
