import Link from "next/link";
import { ListaPrivacidade } from "@/components/ui/lista-privacidade";
import { MobileShell } from "./shell";

/**
 * Convite por link. Sem barra inferior: é um fluxo, não um destino.
 *
 * O link em si ainda não existe — `POST /conexoes/convite` é o item 28 do TODO da raiz.
 * Renderizar um link falso e deixar copiar seria pior que mostrar o estado pendente.
 */
export function ConviteMobile() {
  return (
    <MobileShell nav={false}>
      <div className="flex items-center gap-3 px-5.5 pt-6.5">
        <Link
          href="/conexoes"
          className="flex h-8.5 w-8.5 items-center justify-center rounded-full bg-white/7"
          aria-label="Voltar"
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
            <path d="M15 18l-6-6 6-6" />
          </svg>
        </Link>
        <span className="text-sm font-semibold text-text-faint">Conexões</span>
      </div>

      <div className="px-5.5 pt-6.5">
        <h1 className="titulo text-[30px] leading-[1.04]">
          Convidar quem
          <br />
          você sai
        </h1>
        <p className="mt-3 text-[13.5px] leading-relaxed text-muted text-pretty">
          O link vale uma pessoa e expira em 7 dias. Quando ela abrir, você aceita ou não.
        </p>
      </div>

      <div className="rounded-[16px] mx-5.5 mt-5.5 flex items-center gap-3 border border-linha bg-sunken px-4 py-3.5">
        <span className="min-w-0 flex-1 truncate font-mono text-[13px] text-muted-3">
          o link aparece aqui
        </span>
        <button
          type="button"
          disabled
          className="rounded-[16px] flex shrink-0 cursor-not-allowed items-center gap-2 bg-card px-3.5 py-3.5 text-[12.5px] font-semibold text-text-soft opacity-50"
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
            <rect x="9" y="9" width="12" height="12" rx="2.5" />
            <path d="M5 15V5a2 2 0 012-2h10" />
          </svg>
          Copiar
        </button>
      </div>

      <div className="mx-5.5 mt-3">
        <button
          type="button"
          disabled
          className="rounded-[12px] flex w-full cursor-not-allowed items-center justify-center gap-2.5 bg-text/40 py-4 text-[15px] font-bold text-bg/70"
        >
          <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
            <path d="M4 12v7h16v-7" />
            <path d="M12 16V4" />
            <path d="M8 8l4-4 4 4" />
          </svg>
          Compartilhar
        </button>
        <p className="mt-2.5 text-center text-[11.5px] text-muted-3">
          Gerar convite depende do backend de Conexões, que ainda não existe.
        </p>
      </div>

      <div className="mx-5.5 mt-8">
        <div className="rotulo text-muted-3">o que ela vai ver de você</div>
        <div className="mt-3.5">
          <ListaPrivacidade />
        </div>
      </div>

      <p className="mt-auto px-5.5 pt-6 pb-7.5 text-center text-[12.5px] leading-relaxed text-muted-3">
        Dá pra desfazer a conexão a qualquer momento, e a pessoa não é avisada.
      </p>
    </MobileShell>
  );
}
