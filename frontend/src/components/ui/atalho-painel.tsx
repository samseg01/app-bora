"use client";

import Link from "next/link";
import { useSessao } from "@/lib/auth";

/**
 * O cartão do fim do perfil que leva ao painel de quem tem um.
 *
 * Antes era um link fixo para `/curador`, o que mandava um dono de estabelecimento
 * para uma tela que responde "só para curadores" — beco sem saída para justamente a
 * pessoa que o produto precisa atender bem. Agora o destino segue o papel.
 *
 * Para quem não tem papel nenhum o cartão continua sendo o convite: é o único lugar do
 * app onde um dono de bar descobre que existe uma porta para ele.
 */
export function AtalhoPainel() {
  const sessao = useSessao();

  if (sessao?.papel === "dono_estabelecimento") {
    return (
      <Cartao
        href="/estabelecimento"
        cor="cyan"
        rotulo="sua casa"
        titulo="Ver o painel do meu estabelecimento"
        texto="Quantas pessoas salvaram e quantas sinalizaram que estavam indo."
      />
    );
  }

  if (sessao?.papel === "curador") {
    return (
      <Cartao
        href="/curador"
        cor="amber"
        rotulo="curadoria"
        titulo="Publicar um rolê desta noite"
        texto="Você acabou de sair de lá. Escreva enquanto está fresco."
      />
    );
  }

  return (
    <Cartao
      href="/curador"
      cor="amber"
      rotulo="para donos de casa e curadores"
      titulo="Tenho um bar e quero cadastrar um rolê"
      texto="Um curador vai a pé validar antes de publicar."
    />
  );
}

function Cartao({
  href,
  cor,
  rotulo,
  titulo,
  texto,
}: {
  href: string;
  cor: "amber" | "cyan";
  rotulo: string;
  titulo: string;
  texto: string;
}) {
  const borda =
    cor === "cyan"
      ? "border-muted/24 from-muted/12 to-pedra-funda"
      : "border-text-dim/24 from-text-dim/13 to-pedra-funda";
  return (
    <Link
      href={href}
      className={`block border bg-gradient-to-br px-4.5 py-4 ${borda}`}
    >
      <div className={`rotulo ${cor === "cyan" ? "text-muted" : "text-text-faint"}`}>{rotulo}</div>
      <div className="mt-2 text-[15px] font-bold">{titulo}</div>
      <p className="mt-1.5 text-[12.5px] leading-relaxed text-muted">{texto}</p>
    </Link>
  );
}
