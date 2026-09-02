"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Desktop, Mobile } from "@/components/viewport";
import { DesktopShell } from "@/views/desktop/shell";
import { MobileShell } from "@/views/mobile/shell";
import { guardarDestino, useSessao } from "@/lib/auth";

/**
 * A porta das telas que dependem de quem você é.
 *
 * Precisa ser client component: o token vive em `localStorage`, então o servidor não
 * tem como saber se há sessão. A consequência é que estas telas renderizam depois da
 * hidratação — aceitável porque nenhuma delas é ponto de entrada do app. As três
 * públicas (home, detalhe, mapa) seguem renderizadas no servidor.
 *
 * Antes de existir login, o critério era o ambiente (`NODE_ENV`), que era o mais
 * honesto possível na época. Agora é sessão de verdade.
 */
/** O que dizer a quem está logado mas não tem o papel. Um por papel exigido: a recusa
    precisa explicar a regra, não só negar. */
const RECUSA = {
  curador: {
    titulo: "Só para curadores",
    descricao:
      "Publicar rolê é de quem valida em campo. Curador é convite — a gente chama quem já conhece o bairro a pé.",
  },
  dono_estabelecimento: {
    titulo: "Só para donos de estabelecimento",
    descricao:
      "Este painel é de quem toca a casa. O cadastro ainda é feito na mão, junto com a gente — não há como se inscrever sozinho por enquanto.",
  },
} as const;

export function Porta({
  titulo,
  descricao,
  exige,
  children,
}: {
  titulo: string;
  descricao: string;
  /** Exige também o papel, não só estar logado. Sem isto, basta ter sessão. */
  exige?: keyof typeof RECUSA;
  /** JSX comum: server component não consegue passar função para client component. */
  children: React.ReactNode;
}) {
  const caminho = usePathname();
  const sessao = useSessao();

  if (sessao && (!exige || sessao.papel === exige)) return <>{children}</>;

  // Logado, mas sem o papel: não há ação a oferecer, só a regra a explicar.
  const recusa = sessao !== null && exige ? RECUSA[exige] : null;
  return (
    <Aviso
      curador={exige === "curador"}
      titulo={recusa?.titulo ?? titulo}
      descricao={recusa?.descricao ?? descricao}
      acao={
        recusa ? null : (
          <Link
            href="/entrar"
            onClick={() => guardarDestino(caminho)}
            className="rounded-[12px]  bg-text px-6 py-3.5 text-[14.5px] font-bold text-bg"
          >
            Entrar
          </Link>
        )
      }
    />
  );
}

function Conteudo({
  titulo,
  descricao,
  acao,
}: {
  titulo: string;
  descricao: string;
  acao: React.ReactNode;
}) {
  return (
    <div className="flex flex-1 flex-col items-center justify-center px-8 py-16 text-center">
      <div className="flex h-18 w-18 items-center justify-center rounded-full border border-dashed border-linha">
        <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8}>
          <rect x="4" y="10" width="16" height="10" rx="2.5" />
          <path d="M8 10V7a4 4 0 018 0v3" />
        </svg>
      </div>
      <h1 className="mt-5 titulo text-[28px] leading-tight">{titulo}</h1>
      <p className="mt-3 max-w-80 text-[13.5px] leading-relaxed text-muted text-pretty">
        {descricao}
      </p>
      <div className="mt-6 flex flex-col items-center gap-3">
        {acao}
        <Link href="/" className="text-[13px] font-semibold text-muted-2 hover:text-text">
          Ver a noite de hoje
        </Link>
      </div>
    </div>
  );
}

function Aviso({
  curador,
  titulo,
  descricao,
  acao,
}: {
  curador: boolean;
  titulo: string;
  descricao: string;
  acao: React.ReactNode;
}) {
  return (
    <>
      <Mobile>
        <MobileShell nav={!curador}>
          <Conteudo titulo={titulo} descricao={descricao} acao={acao} />
        </MobileShell>
      </Mobile>
      <Desktop>
        <DesktopShell curador={curador}>
          <Conteudo titulo={titulo} descricao={descricao} acao={acao} />
        </DesktopShell>
      </Desktop>
    </>
  );
}
