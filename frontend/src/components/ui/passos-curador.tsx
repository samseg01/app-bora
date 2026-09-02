"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { SeletorBairro } from "./seletor-bairro";

/**
 * As três etapas da curadoria, na ordem em que só funcionam: **região → lugar → rolê**.
 *
 * A ordem não é estética, é dependência real. Um rolê acontece num lugar, e um lugar
 * pertence a um recorte; pular etapa não é possível, e a tela agora mostra isso em vez
 * de deixar a pessoa descobrir batendo num formulário vazio.
 *
 * A etapa 1 existe porque a região do painel vinha, silenciosamente, do cookie do app
 * público — escolhido lá na abertura. Quem quisesse curar em Pinheiros tinha de sair do
 * painel, ir na tela de leitura, trocar o bairro e voltar; do lado de dentro parecia que
 * "Publicar em República" era imutável. Agora a região se troca aqui, onde o trabalho
 * acontece.
 *
 * Continua sendo o mesmo cookie de propósito: são duas leituras do mesmo "onde estou
 * agora", e um curador que acabou de publicar quer justamente conferir o resultado no
 * app público, no mesmo bairro.
 */
export function PassosCurador({
  bairro,
  lugares,
}: {
  bairro: string;
  /** `null` enquanto carrega — a etapa 2 não inventa contagem. */
  lugares: number | null;
}) {
  const caminho = usePathname();
  const emLugares = caminho === "/curador/lugares";

  return (
    <ol className="flex items-stretch gap-2 overflow-x-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
      <Passo numero={1} rotulo="região" ativo={false}>
        <SeletorBairro atual={bairro} />
      </Passo>

      <Passo
        numero={2}
        rotulo="lugar"
        ativo={emLugares}
        href={emLugares ? undefined : "/curador/lugares"}
      >
        <span className="text-[13.5px] font-bold">
          {lugares === null
            ? "…"
            : lugares === 0
              ? "cadastrar"
              : `${lugares} ${lugares === 1 ? "cadastrado" : "cadastrados"}`}
        </span>
      </Passo>

      <Passo numero={3} rotulo="rolê" ativo={!emLugares} href={emLugares ? "/curador" : undefined}>
        <span className="text-[13.5px] font-bold">publicar</span>
      </Passo>
    </ol>
  );
}

function Passo({
  numero,
  rotulo,
  ativo,
  href,
  children,
}: {
  numero: number;
  rotulo: string;
  ativo: boolean;
  href?: string;
  children: React.ReactNode;
}) {
  const conteudo = (
    <>
      <div className="flex items-center gap-1.5">
        <span
          className={`flex h-4 w-4 shrink-0 items-center justify-center rounded-full text-[9.5px] font-bold ${
            ativo ? "bg-text-dim text-bg" : "bg-white/12 text-muted-2"
          }`}
        >
          {numero}
        </span>
        <span className={`rotulo ${ativo ? "text-text-faint" : "text-muted-3"}`}>{rotulo}</span>
      </div>
      <div className="mt-1.5">{children}</div>
    </>
  );

  const classe = `flex min-w-[8.5rem] shrink-0 flex-col border px-3 py-2.5 transition-colors ${
    ativo ? "border-text-dim/45 bg-text-dim/8" : "border-linha bg-card-alt"
  } ${href ? "hover:border-linha" : ""}`;

  return (
    <li className="flex">
      {href ? (
        <Link href={href} className={classe}>
          {conteudo}
        </Link>
      ) : (
        <div className={classe}>{conteudo}</div>
      )}
    </li>
  );
}
