import Link from "next/link";
import { ListaPrivacidade } from "@/components/ui/lista-privacidade";
import { DesktopShell } from "./shell";

/** Ver a nota do equivalente em `views/mobile/convite.tsx`. */
export function ConviteDesktop() {
  return (
    <DesktopShell>
      <section className="min-w-0 flex-1 px-8 py-8">
        <Link
          href="/conexoes"
          className="flex items-center gap-2 text-[13px] font-semibold text-muted-2 hover:text-text"
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
            <path d="M15 18l-6-6 6-6" />
          </svg>
          Conexões
        </Link>

        <div className="mt-6 flex max-w-3xl gap-12">
          <div className="flex-1">
            <h1 className="titulo text-[38px] leading-[1.04]">
              Convidar quem você sai
            </h1>
            <p className="mt-3.5 text-sm leading-relaxed text-muted text-pretty">
              O link vale uma pessoa e expira em 7 dias. Quando ela abrir, você aceita ou não.
            </p>

            <div className="rounded-[16px] mt-6 flex items-center gap-3 border border-linha bg-sunken px-4 py-3.5">
              <span className="min-w-0 flex-1 truncate font-mono text-[13px] text-muted-3">
                o link aparece aqui
              </span>
              <button
                type="button"
                disabled
                className="rounded-[16px] flex shrink-0 cursor-not-allowed items-center gap-2 bg-card px-3.5 py-3 text-[12.5px] font-semibold text-text-soft opacity-50"
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
                  <rect x="9" y="9" width="12" height="12" rx="2.5" />
                  <path d="M5 15V5a2 2 0 012-2h10" />
                </svg>
                Copiar
              </button>
            </div>

            <button
              type="button"
              disabled
              className="rounded-[12px] mt-3 flex w-full cursor-not-allowed items-center justify-center gap-2.5 bg-text/40 py-3.5 text-[15px] font-bold text-bg/70"
            >
              Compartilhar
            </button>
            <p className="mt-2.5 text-xs text-muted-3">
              Gerar convite depende do backend de Conexões, que ainda não existe.
            </p>

            <p className="mt-8 text-[12.5px] leading-relaxed text-muted-3">
              Dá pra desfazer a conexão a qualquer momento, e a pessoa não é avisada.
            </p>
          </div>

          <div className="w-96 shrink-0">
            <div className="rotulo text-muted-3">o que ela vai ver de você</div>
            <div className="mt-3.5">
              <ListaPrivacidade />
            </div>
          </div>
        </div>
      </section>
    </DesktopShell>
  );
}
