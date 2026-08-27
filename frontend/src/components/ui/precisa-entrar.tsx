import Link from "next/link";
import { Desktop, Mobile } from "@/components/viewport";
import { DesktopShell } from "@/views/desktop/shell";
import { MobileShell } from "@/views/mobile/shell";

/**
 * Estado das telas que dependem de login. Sem autenticação elas não têm o que mostrar
 * de honesto — e mostrar dado de exemplo em produção seria pior: alguém abriria
 * "Salvos" e veria seis lugares que nunca salvou.
 *
 * Mostrar a tela dizendo que precisa entrar, em vez de escondê-la da navegação, é
 * deliberado: comunica que a parte do produto existe sem inventar conteúdo.
 *
 * Quando o login existir (fase 3), a condição deixa de ser "não é desenvolvimento" e
 * passa a ser "não tem token", que é o critério certo — este componente continua servindo.
 */
export function usarDadoDeExemplo(): boolean {
  return process.env.NODE_ENV !== "production";
}

function Conteudo({ titulo, descricao }: { titulo: string; descricao: string }) {
  return (
    <div className="flex flex-1 flex-col items-center justify-center px-8 py-16 text-center">
      <div className="flex h-18 w-18 items-center justify-center rounded-full border border-dashed border-white/20">
        <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#6f6690" strokeWidth={1.8}>
          <rect x="4" y="10" width="16" height="10" rx="2.5" />
          <path d="M8 10V7a4 4 0 018 0v3" />
        </svg>
      </div>
      <h1 className="mt-5 font-display text-[28px] leading-tight uppercase">{titulo}</h1>
      <p className="mt-3 max-w-80 text-[13.5px] leading-relaxed text-muted text-pretty">
        {descricao}
      </p>
      <Link
        href="/"
        className="mt-6 rounded-2xl border border-white/18 px-5 py-3 text-[13.5px] font-semibold text-text-soft"
      >
        Ver a noite de hoje
      </Link>
      <p className="mt-4 text-xs text-muted-3">Entrar ainda não está pronto.</p>
    </div>
  );
}

export function TelaPrecisaEntrar({
  titulo,
  descricao,
  curador = false,
}: {
  titulo: string;
  descricao: string;
  curador?: boolean;
}) {
  return (
    <>
      <Mobile>
        <MobileShell nav={!curador}>
          <Conteudo titulo={titulo} descricao={descricao} />
        </MobileShell>
      </Mobile>
      <Desktop>
        <DesktopShell curador={curador}>
          <Conteudo titulo={titulo} descricao={descricao} />
        </DesktopShell>
      </Desktop>
    </>
  );
}
