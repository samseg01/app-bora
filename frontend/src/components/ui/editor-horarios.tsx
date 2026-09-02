"use client";

import { DIAS, faixaNova } from "@/lib/horarios";
import type { FaixaHorario } from "@/lib/types";

/**
 * Entrada de funcionamento: os sete dias como botões e as horas em campo de tempo — que
 * no telefone abre a roleta nativa do sistema.
 *
 * Substitui o texto livre. Digitar "seg a sex, 12h às 1h" na calçada é lento e produz
 * dez grafias diferentes para a mesma coisa; e, sobretudo, texto não responde "esta casa
 * está aberta agora?", que é a pergunta do produto.
 *
 * São faixas, no plural, porque "ter a qui até 2h, sex e sáb até 4h" é o caso comum num
 * bar — com uma faixa só, quem tem fim de semana estendido não consegue registrar.
 */
export function EditorHorarios({
  faixas,
  aoMudar,
}: {
  faixas: FaixaHorario[];
  aoMudar: (novas: FaixaHorario[]) => void;
}) {
  function alterar(indice: number, mudanca: Partial<FaixaHorario>) {
    aoMudar(faixas.map((f, i) => (i === indice ? { ...f, ...mudanca } : f)));
  }

  function alternarDia(indice: number, dia: number) {
    const atual = faixas[indice].dias;
    alterar(indice, {
      dias: atual.includes(dia) ? atual.filter((d) => d !== dia) : [...atual, dia].sort(),
    });
  }

  return (
    <div className="flex flex-col gap-2.5">
      {faixas.map((faixa, i) => (
        <div key={i} className="rounded-[16px] flex flex-col gap-2 border border-linha bg-sunken p-3">
          <div className="flex flex-wrap gap-1.5">
            {DIAS.map((nome, dia) => {
              const ativo = faixa.dias.includes(dia);
              return (
                <button
                  key={dia}
                  type="button"
                  onClick={() => alternarDia(i, dia)}
                  aria-pressed={ativo}
                  className={`h-8 w-9 text-[11.5px] font-semibold capitalize transition-colors ${
                    ativo
                      ? "border-[1.5px] border-selecao bg-card text-text"
                      : "border border-linha bg-card-alt text-muted-3"
                  }`}
                >
                  {nome}
                </button>
              );
            })}
          </div>

          <div className="flex items-center gap-2">
            {/* `type="time"` abre a roleta nativa no telefone — melhor que qualquer
                seletor que a gente desenhasse, e já vem acessível e localizado. */}
            <input
              type="time"
              value={faixa.abre}
              onChange={(e) => alterar(i, { abre: e.target.value })}
              aria-label="abre às"
              className="rounded-[12px] flex-1 border border-linha bg-card-alt px-3 py-2.5 text-[13px] text-text outline-none focus:border-linha"
            />
            <span className="text-[12px] text-muted-3">às</span>
            <input
              type="time"
              value={faixa.fecha}
              onChange={(e) => alterar(i, { fecha: e.target.value })}
              aria-label="fecha às"
              className="rounded-[12px] flex-1 border border-linha bg-card-alt px-3 py-2.5 text-[13px] text-text outline-none focus:border-linha"
            />
            {faixas.length > 1 && (
              <button
                type="button"
                onClick={() => aoMudar(faixas.filter((_, j) => j !== i))}
                aria-label="remover esta faixa"
                className="rounded-[12px] shrink-0 border border-linha px-2.5 py-2.5 text-[12px] text-muted-2 hover:text-text"
              >
                ✕
              </button>
            )}
          </div>

          {/* Fechar antes de abrir não é erro: é o bar que vira a noite. Dizer isso na
              tela evita que alguém "corrija" para 23h59 achando que estragou. */}
          {faixa.fecha <= faixa.abre && (
            <p className="text-[11px] text-muted-3">Vira a madrugada — fecha no dia seguinte.</p>
          )}
        </div>
      ))}

      <button
        type="button"
        onClick={() => aoMudar([...faixas, faixaNova()])}
        className="self-start text-[12px] font-semibold text-text-soft"
      >
        + outro horário
      </button>
    </div>
  );
}
