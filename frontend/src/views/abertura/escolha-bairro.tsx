"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { BuscarPorLocalizacao } from "@/components/ui/buscar-por-localizacao";
import { BAIRROS, salvarBairro } from "@/lib/bairros";

/**
 * Abertura do app — a tela 2a do hi-fi, com uma diferença deliberada.
 *
 * O design original listava bairros com a etiqueta "em breve", o que é uma afirmação
 * sobre roadmap que ninguém decidiu. Aqui só entram recortes que existem de verdade, e
 * a contagem ao lado de cada um vem da API: se hoje é zero, a tela diz zero. Um número
 * inventado aqui contaminaria a primeira impressão do produto inteiro.
 *
 * Zero curado não é defeito a esconder — é a prova de que só entra o que foi visitado.
 *
 * "Buscar pela minha localização" é atalho, não substituto: ele pré-seleciona um recorte
 * na lista, que continua ali inteira. Quem está em casa às 18h decidindo aonde ir mais
 * tarde tem, na localização atual, a informação menos útil da tela.
 */
export function EscolhaBairro({
  contagens,
  atual,
}: {
  contagens: Record<string, { lugares: number; roles: number }>;
  /** Quem já escolheu chega aqui para trocar: começa no que está valendo, não no primeiro
      da lista — senão um toque distraído troca de bairro sem querer. */
  atual: string | null;
}) {
  const router = useRouter();
  const [escolhido, setEscolhido] = useState(atual ?? BAIRROS[0].nome);
  const [indo, setIndo] = useState(false);

  function continuar() {
    setIndo(true);
    salvarBairro(escolhido);
    router.replace("/");
    router.refresh();
  }

  return (
    <div className="rounded-[16px] mx-auto flex min-h-dvh w-full max-w-md flex-col bg-surface px-6 pt-11 pb-8 lg:max-w-lg">
      <div>
        <h1 className="titulo text-[52px] leading-[0.9] tracking-[-0.5px]">
          Bora<span className="text-text-faint">?</span>
        </h1>
        <p className="mt-3 max-w-[16rem] text-[13.5px] leading-relaxed text-muted">
          O rolê que tá rolando agora, perto de você — não o que você já conhece.
        </p>
      </div>

      <div className="mt-11">
        <h2 className="titulo text-[31px] leading-[1.02]">
          {atual ? (
            <>
              Trocar de
              <br />
              bairro
            </>
          ) : (
            <>
              Por onde você
              <br />
              costuma sair?
            </>
          )}
        </h2>
        <p className="mt-2.5 text-[13px] leading-relaxed text-muted">
          A gente conhece bem um pedaço de São Paulo. Preferimos ser bons em um bairro a ruins
          em vinte.
        </p>
      </div>

      <div className="mt-6 flex flex-col gap-2.5">
        {BAIRROS.map((b) => {
          const c = contagens[b.nome] ?? { lugares: 0, roles: 0 };
          const ativo = b.nome === escolhido;
          return (
            <button
              key={b.nome}
              type="button"
              onClick={() => setEscolhido(b.nome)}
              aria-pressed={ativo}
              className={`flex items-center justify-between gap-4 border px-4 py-3.5 text-left transition-colors ${
                ativo
                  ? "border-selecao bg-gradient-to-br from-text-dim/16 to-pedra-funda"
                  : "border-linha bg-card-alt hover:border-linha"
              }`}
            >
              <div className="min-w-0">
                <div className={`text-base font-bold ${ativo ? "" : "text-muted-2"}`}>
                  {b.nome}
                </div>
                <div className="mt-1 text-[12.5px] leading-snug text-muted-3">{b.descricao}</div>
                <div className="mt-1.5 text-[12.5px] text-text-faint">
                  {c.lugares === 0
                    ? "curadoria começando"
                    : `${c.lugares} ${c.lugares === 1 ? "lugar curado" : "lugares curados"}${
                        c.roles > 0 ? ` · ${c.roles} hoje` : ""
                      }`}
                </div>
              </div>
              <span
                className={`flex h-5.5 w-5.5 shrink-0 items-center justify-center rounded-full text-[12px] font-bold ${
                  ativo ? "bg-text text-bg" : "border border-linha text-transparent"
                }`}
              >
                ✓
              </span>
            </button>
          );
        })}
      </div>

      <BuscarPorLocalizacao aoEncontrar={setEscolhido} />

      <div className="mt-auto pt-9">
        <button
          type="button"
          onClick={continuar}
          disabled={indo}
          className="rounded-[12px] w-full bg-text py-4 text-[15px] font-bold text-bg disabled:opacity-60"
        >
          {indo ? "Um instante…" : atual ? "Ver esse bairro" : "Ver a noite de hoje"}
        </button>
        <p className="mt-3.5 text-center text-xs leading-relaxed text-muted-3">
          {atual ? "Dá pra voltar quando quiser." : "Dá pra trocar depois, tocando no nome do bairro."}
        </p>
      </div>
    </div>
  );
}
