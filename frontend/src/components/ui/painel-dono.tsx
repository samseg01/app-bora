"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { api } from "@/lib/api";
import { useSessao } from "@/lib/auth";
import type {
  EngajamentoEstabelecimento,
  EstabelecimentoPublic,
  LugarPublic,
} from "@/lib/types";

/**
 * Painel do dono do estabelecimento.
 *
 * O backend expõe exatamente duas coisas para o dono: os lugares dele e uma agregação
 * de engajamento (`services/engajamento.py`). Não há série temporal, não há visitante
 * único, não há origem de tráfego — então esta tela não desenha gráfico nenhum. Um
 * painel de dono é onde a tentação de inventar métrica é maior, e é justamente onde
 * inventar custa mais caro: é o que a pessoa vai conferir contra a realidade da casa
 * dela.
 *
 * **Os dois totais são desde sempre**, não de uma janela. Qualquer rótulo do tipo
 * "esta semana" aqui seria mentira sobre o dado que a API devolve.
 *
 * O que a tela diz de propósito, porque é a tese de monetização do `conceito.md`: o
 * topo não está à venda. O dono vê o que a comunidade fez com a casa dele; ele não
 * compra posição.
 */
export function PainelDono() {
  const sessao = useSessao();
  const token = sessao?.token;

  const [casas, setCasas] = useState<EstabelecimentoPublic[] | null>(null);
  const [escolhida, setEscolhida] = useState<string | null>(null);
  const [dados, setDados] = useState<{
    lugares: LugarPublic[];
    eng: EngajamentoEstabelecimento;
  } | null>(null);
  const [erro, setErro] = useState(false);

  useEffect(() => {
    if (!token) return;
    let vivo = true;
    void api
      .meusEstabelecimentos(token)
      .then((c) => {
        if (vivo) setCasas(c);
      })
      .catch(() => {
        if (vivo) setErro(true);
      });
    return () => {
      vivo = false;
    };
  }, [token]);

  const casa = casas?.find((c) => c.id === escolhida) ?? casas?.[0] ?? null;
  const casaId = casa?.id;

  useEffect(() => {
    if (!token || !casaId) return;
    let vivo = true;
    void Promise.all([
      api.estabelecimentoLugares(token, casaId),
      api.engajamento(token, casaId),
    ])
      .then(([lugares, eng]) => {
        if (vivo) setDados({ lugares, eng });
      })
      .catch(() => {
        if (vivo) setErro(true);
      });
    return () => {
      vivo = false;
    };
  }, [token, casaId]);

  if (erro) {
    return (
      <Moldura>
        <Recado
          titulo="Não deu pra carregar"
          texto="O painel não conseguiu falar com o servidor agora. Recarregue a página em instantes."
        />
      </Moldura>
    );
  }

  if (casas === null) return <Moldura>{null}</Moldura>;

  if (casas.length === 0) {
    return (
      <Moldura>
        <Recado
          titulo="Nenhuma casa vinculada a você"
          texto="Sua conta é de dono, mas nenhum estabelecimento está ligado a ela ainda. Esse vínculo é feito na mão, junto com a gente — não existe autocadastro, de propósito: quem entra no app é visitado antes."
        />
      </Moldura>
    );
  }

  return (
    <Moldura>
      {casas.length > 1 && (
        <div className="flex flex-wrap gap-2">
          {casas.map((c) => (
            <button
              key={c.id}
              type="button"
              onClick={() => setEscolhida(c.id)}
              className={`rounded-full px-3.5 py-2 text-[12.5px] transition-colors ${
                c.id === casaId
                  ? "border-[1.5px] border-muted bg-muted/14 font-semibold text-muted"
                  : "border border-linha bg-sunken font-medium text-text-faint"
              }`}
            >
              {c.nome}
            </button>
          ))}
        </div>
      )}

      <div>
        <h1 className="titulo text-[34px] leading-none lg:text-[42px]">
          {casa?.nome}
        </h1>
        <p className="mt-2.5 text-[13px] leading-relaxed text-muted-2">
          {casa?.plano === "destaque_verificado"
            ? "Destaque verificado — um curador esteve na casa e assinou embaixo."
            : "Plano orgânico. Você não paga nada, e a posição no app não está à venda."}
        </p>
      </div>

      {dados && (
        <>
          <div className="flex flex-col gap-3 sm:flex-row">
            <Numero valor={dados.lugares.length} rotulo="lugares seus no app" />
            <Numero valor={dados.eng.total_salvos} rotulo="pessoas salvaram" destaque />
            <Numero valor={dados.eng.total_sinalizacoes} rotulo="sinais de presença" />
          </div>
          <p className="-mt-1 text-[11.5px] leading-relaxed text-muted-3">
            Totais desde que a casa entrou no app, não desta semana. Sinal de presença é
            alguém dizendo &ldquo;tô indo&rdquo; — é o que acende a casa no mapa de quem
            está decidindo onde ir agora.
          </p>

          <div>
            <div className="rotulo text-muted-3">por lugar</div>
            <div className="mt-3 flex flex-col gap-2">
              {dados.lugares.length === 0 && (
                <p className="text-[13.5px] leading-relaxed text-muted">
                  Nenhum lugar seu está no app ainda. Quem cadastra é o curador do
                  bairro, depois de visitar.
                </p>
              )}
              {dados.eng.por_lugar.map((l) => {
                const mudo = l.total_salvos === 0 && l.total_sinalizacoes === 0;
                return (
                  <div
                    key={l.lugar_id}
                    className="elevado rounded-[16px] flex items-center gap-3.5 border border-linha bg-card p-3.5"
                  >
                    <div className="h-11 w-11 shrink-0 bg-gradient-to-br from-pedra to-pedra-funda" />
                    <div className="min-w-0 flex-1">
                      <div className="truncate text-[14.5px] font-bold">{l.lugar_nome}</div>
                      <div className="mt-0.5 text-xs text-muted-2">
                        {mudo
                          ? "Ninguém salvou nem sinalizou ainda"
                          : `${l.total_salvos} salvaram · ${l.total_sinalizacoes} sinalizaram`}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </>
      )}
    </Moldura>
  );
}

function Moldura({ children }: { children: React.ReactNode }) {
  return (
    <section className="mx-auto flex w-full max-w-3xl min-w-0 flex-1 flex-col gap-6 px-6 py-9 lg:px-8">
      <div className="flex items-center justify-between">
        <div>
          <Link href="/" className="titulo text-2xl leading-none">
            Bora<span className="text-muted">?</span>
          </Link>
          <div className="rotulo mt-1.5 text-muted">painel do estabelecimento</div>
        </div>
        <Link href="/" className="text-xs font-semibold text-muted-2 hover:text-text">
          ver o app
        </Link>
      </div>
      {children}
    </section>
  );
}

function Numero({
  valor,
  rotulo,
  destaque = false,
}: {
  valor: number;
  rotulo: string;
  destaque?: boolean;
}) {
  return (
    <div
      className={`flex-1 border bg-sunken px-4 py-4 ${
        destaque && valor > 0 ? "border-muted/28" : "border-linha"
      }`}
    >
      <div
        className={`titulo text-[30px] leading-none ${
          destaque && valor > 0 ? "text-muted" : ""
        }`}
      >
        {valor}
      </div>
      <div className="mt-1.5 text-[11.5px] text-muted-2">{rotulo}</div>
    </div>
  );
}

function Recado({ titulo, texto }: { titulo: string; texto: string }) {
  return (
    <div className="elevado rounded-[20px]  border border-linha bg-card-alt px-5.5 py-6">
      <h1 className="titulo text-[26px] leading-tight">{titulo}</h1>
      <p className="mt-3 text-[13.5px] leading-relaxed text-muted text-pretty">{texto}</p>
    </div>
  );
}
