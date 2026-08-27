import Link from "next/link";
import { Avatar, AvatarPilha } from "@/components/ui/avatar";
import { MobileShell } from "./shell";
import { idade } from "@/lib/tempo";
import type { CheckInDeConexao, LugarPublic } from "@/lib/types";
import type { DadosConexoes } from "../desktop/conexoes";

export function ConexoesMobile(d: DadosConexoes) {
  if (d.conexoes.length === 0) return <ConexoesVaziasMobile {...d} />;

  return (
    <MobileShell>
      <div className="px-5.5 pt-7.5">
        <h1 className="font-display text-[31px] leading-none uppercase">Conexões</h1>
        <p className="mt-1.5 text-[13px] text-muted-2">
          {d.foraAgora.length} de {d.conexoes.length} estão na rua agora
        </p>
      </div>

      <div className="rotulo px-5.5 pt-6 text-muted-3">fora agora</div>
      <div className="flex flex-col gap-2.5 px-5.5 pt-3">
        {d.foraAgora.length === 0 && (
          <p className="text-[13px] leading-relaxed text-muted">
            Ninguém da sua turma marcou nada ainda hoje.
          </p>
        )}
        {d.foraAgora.map((c) => (
          <LinhaForaAgora key={c.id} checkin={c} agora={d.agora} />
        ))}
      </div>

      <div className="rotulo px-5.5 pt-6.5 text-muted-3">salvos por quem você confia</div>
      <div className="flex gap-3 overflow-x-auto px-5.5 pt-3 pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        {d.salvos.map(({ lugar, por }) => (
          <div key={lugar.id} className="w-38 shrink-0">
            <CardSalvoCompacto lugar={lugar} por={por} />
          </div>
        ))}
      </div>

      <Link
        href="/conexoes/convite"
        className="mx-5.5 mt-5 mb-5 flex items-center justify-between gap-3 rounded-[18px] border border-dashed border-white/18 px-4 py-3.5"
      >
        <span className="text-[12.5px] leading-snug text-text-faint">
          Quanto mais gente do seu grupo, melhor fica.
        </span>
        <span className="shrink-0 text-[12.5px] font-semibold text-magenta-soft">Convidar</span>
      </Link>
    </MobileShell>
  );
}

function LinhaForaAgora({ checkin, agora }: { checkin: CheckInDeConexao; agora: number }) {
  const vago = checkin.lugar_id === null;

  return (
    <div
      className={`flex items-center gap-3.5 rounded-[18px] border bg-card p-3 ${
        checkin.frescor === "live" ? "border-magenta/30" : "border-white/7"
      }`}
    >
      <Avatar nome={checkin.nome} tamanho={44} />
      <div className="min-w-0 flex-1">
        <div className="text-[14.5px] font-bold">{checkin.nome}</div>
        <div className="mt-0.5 truncate text-xs text-muted">
          {vago ? "" : "no "}
          <span className="font-semibold text-text">
            {vago ? `na ${checkin.bairro}` : checkin.lugar_nome}
          </span>{" "}
          · {idade(checkin.timestamp, agora)}
        </div>
      </div>
      {checkin.role_id ? (
        <Link
          href={`/role/${checkin.role_id}`}
          className="shrink-0 rounded-full bg-magenta px-4 py-3.5 text-[12.5px] font-bold text-white"
        >
          Tô indo
        </Link>
      ) : (
        <button
          type="button"
          disabled
          className="shrink-0 cursor-not-allowed rounded-full border border-white/16 px-4 py-3.5 text-[12.5px] font-semibold text-text-soft opacity-50"
        >
          Chamar
        </button>
      )}
    </div>
  );
}

const GRADIENTES = [
  "from-plum to-violet",
  "from-cyan to-plum",
  "from-amber to-plum",
  "from-violet to-magenta",
];

function CardSalvoCompacto({ lugar, por }: { lugar: LugarPublic; por?: string[] }) {
  const chave = lugar.nome.charCodeAt(0) % GRADIENTES.length;
  return (
    <div className="overflow-hidden rounded-[18px] border border-white/7 bg-card">
      <div className={`h-21 bg-gradient-to-br ${GRADIENTES[chave]}`} />
      <div className="px-3 pt-2.5 pb-3">
        <div className="truncate text-[13.5px] font-bold">{lugar.nome}</div>
        <div className="mt-0.5 truncate text-[11px] text-muted-2">{lugar.categoria}</div>
        {por && por.length > 0 && (
          <div className="mt-2 flex items-center gap-1.5">
            <AvatarPilha nomes={por} tamanho={17} />
            <span className="truncate text-[10.5px] text-muted">
              {por.length === 1 ? `${por[0]} salvou` : `${por.length} salvaram`}
            </span>
          </div>
        )}
      </div>
    </div>
  );
}

/** Ver a nota do equivalente em `views/desktop/conexoes.tsx`. */
function ConexoesVaziasMobile({ salvosDoCurador, curador, bairro }: DadosConexoes) {
  return (
    <MobileShell>
      <div className="px-5.5 pt-7.5">
        <h1 className="font-display text-[31px] leading-none uppercase">Conexões</h1>
      </div>

      <div className="flex flex-col items-center px-5.5 pt-8 text-center">
        <div className="flex h-18 w-18 items-center justify-center rounded-full border border-dashed border-white/20">
          <svg width="30" height="30" viewBox="0 0 24 24" fill="none" stroke="#6f6690" strokeWidth={1.8}>
            <circle cx="9" cy="8" r="3.4" />
            <path d="M3 20c0-3.4 2.7-5.2 6-5.2s6 1.8 6 5.2" />
            <path d="M16.5 6.2a3.4 3.4 0 010 6.4" />
            <path d="M18.4 14.6c2 .7 3.6 2.3 3.6 5" />
          </svg>
        </div>
        <h2 className="mt-5 font-display text-[26px] leading-tight uppercase">
          Ainda é só
          <br />
          você por aqui
        </h2>
        <p className="mt-3 max-w-70 text-[13.5px] leading-relaxed text-muted text-pretty">
          Esta aba serve pra ver onde as pessoas com quem você sai estão. Sozinho ela não faz
          nada — e a gente prefere dizer isso do que encher a tela.
        </p>
      </div>

      <div className="px-5.5 pt-5.5">
        <Link
          href="/conexoes/convite"
          className="block rounded-2xl bg-magenta py-4 text-center text-[15px] font-bold text-white"
        >
          Convidar quem você sai
        </Link>
        <p className="mt-3 text-center text-xs text-muted-3">
          Manda um link. Quem abrir vira conexão se você aceitar.
        </p>
      </div>

      <div className="flex items-center gap-3 px-5.5 pt-7.5">
        <div className="h-px flex-1 bg-gradient-to-r from-magenta/40 to-amber/18" />
        <span className="rotulo text-muted-2">enquanto isso</span>
        <div className="h-px flex-1 bg-gradient-to-r from-amber/18 to-magenta/40" />
      </div>

      <div className="mx-5.5 mt-4.5 flex items-center gap-3.5 rounded-[18px] border border-white/6 bg-card-alt p-3.5">
        <Avatar nome={curador} tamanho={40} />
        <p className="text-[12.5px] leading-relaxed text-text-faint">
          <span className="font-semibold text-text">Quem cura {bairro} vai a pé.</span>{" "}
          Enquanto seu grupo não chega, os salvos dele ficam aqui.
        </p>
      </div>

      <div className="flex gap-3 overflow-x-auto px-5.5 pt-3.5 pb-5 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        {salvosDoCurador.map((lugar) => (
          <div key={lugar.id} className="w-38 shrink-0">
            <CardSalvoCompacto lugar={lugar} />
          </div>
        ))}
      </div>
    </MobileShell>
  );
}
