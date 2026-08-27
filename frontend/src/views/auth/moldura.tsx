import type { ReactNode } from "react";
import Link from "next/link";
import { Desktop, Mobile } from "@/components/viewport";

/**
 * Moldura das telas de autenticação. Não usa os shells do app: aqui não há navegação
 * — a pessoa está no meio de uma ação e volta para ela.
 *
 * O bloco "você estava salvando" é o que faz a auth preguiçosa funcionar. No telefone
 * ele é uma faixa acima do formulário; no desktop vira a coluna da esquerda inteira,
 * com o card em tamanho real ao lado dos campos. Sem ele, entrar vira pedágio.
 */
export function MolduraAuth({ children }: { children: ReactNode }) {
  return (
    <>
      <Mobile>
        <div className="mx-auto flex min-h-dvh w-full max-w-md flex-col bg-surface px-5.5 pt-6.5 pb-9">
          <div className="flex items-center gap-3">
            <Link
              href="/"
              aria-label="Voltar"
              className="flex h-8.5 w-8.5 items-center justify-center rounded-full bg-white/7"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#e8dfff" strokeWidth={2}>
                <path d="M15 18l-6-6 6-6" />
              </svg>
            </Link>
            <span className="font-display text-xl leading-none uppercase">
              Bora<span className="text-amber">?</span>
            </span>
          </div>

          <div className="mt-6.5">{children}</div>
        </div>
      </Mobile>

      <Desktop>
        <div className="flex min-h-dvh bg-surface">
          <section className="flex min-w-0 flex-1 flex-col justify-center px-20">
            <Link href="/" className="font-display text-[34px] leading-none uppercase">
              Bora<span className="text-amber">?</span>
            </Link>
            <p className="mt-12 max-w-[22rem] text-[13.5px] leading-relaxed text-muted">
              O caderninho é seu e só seu. Por isso precisa de conta — e por isso a gente pede o
              mínimo possível.
            </p>
            <p className="mt-4 max-w-[22rem] text-[13.5px] leading-relaxed text-muted-3">
              Descobrir e ver o mapa não exigem entrar. Só o que é seu — salvos, conexões — precisa
              saber quem você é.
            </p>
          </section>

          <section className="flex w-[520px] shrink-0 flex-col justify-center border-l border-white/7 bg-nav px-18">
            {children}
          </section>
        </div>
      </Desktop>
    </>
  );
}
