import Link from "next/link";
import { Desktop, Mobile } from "@/components/viewport";
import { DesktopShell } from "./desktop/shell";
import { MobileShell } from "./mobile/shell";

/**
 * O que a aba mostra até o backend de conexões existir. Não é o estado vazio do design
 * ("ainda é só você por aqui"), porque aquele afirma que a feature funciona e você é que
 * não tem ninguém — o que seria falso.
 */
function Conteudo() {
  return (
    <div className="flex flex-1 flex-col justify-center px-7 py-14">
      <div className="max-w-[26rem]">
        <div className="rotulo text-text-faint">em construção</div>
        <h1 className="mt-3 titulo text-[30px] leading-tight">
          Conexões ainda não funcionam
        </h1>
        <p className="mt-3.5 text-[13.5px] leading-relaxed text-muted text-pretty">
          A ideia é ver onde as pessoas com quem você sai estão, e descobrir lugares que elas
          salvaram. As telas já existem; o que falta é o outro lado, no servidor.
        </p>
        <p className="mt-3 text-[13px] leading-relaxed text-muted-3 text-pretty">
          Preferimos deixar isto escrito a encher a tela com gente que não existe.
        </p>
        <Link
          href="/"
          className="rounded-[16px] mt-6 inline-block border border-linha px-5 py-3 text-[13.5px] font-semibold text-text-soft hover:border-linha"
        >
          Ver a noite de hoje
        </Link>
      </div>
    </div>
  );
}

export function ConexoesEmBreve() {
  return (
    <>
      <Mobile>
        <MobileShell>
          <Conteudo />
        </MobileShell>
      </Mobile>
      <Desktop>
        <DesktopShell>
          <Conteudo />
        </DesktopShell>
      </Desktop>
    </>
  );
}
