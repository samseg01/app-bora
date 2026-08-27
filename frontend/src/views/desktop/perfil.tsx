import Link from "next/link";
import { DesktopShell } from "./shell";

/**
 * Tela 2h em tela grande. Nome e "desde agosto" ficam de fora até existir
 * `GET /auth/me` (../TODO.md item 18); "rolês que você foi" não tem rota nenhuma.
 *
 * O toggle "meus sinais são anônimos" do design virou texto: não há campo para
 * desligar, e as sinalizações já são anônimas de fato — nenhum endpoint expõe o
 * autor. Um controle que não controla nada promete o que não existe.
 */
export function PerfilDesktop({ bairro, salvos }: { bairro: string; salvos: number }) {
  return (
    <DesktopShell>
      <section className="min-w-0 flex-1 px-10 py-8">
        <div className="flex items-center gap-4.5">
          <div className="h-16 w-16 shrink-0 rounded-full bg-gradient-to-br from-magenta to-amber" />
          <div>
            <h1 className="font-display text-[34px] leading-none uppercase">Você</h1>
            <p className="mt-1.5 text-[12.5px] text-muted-2">{bairro}</p>
          </div>
        </div>

        <div className="mt-7 grid max-w-2xl grid-cols-2 gap-3.5">
          <div className="rounded-[18px] border border-white/6 bg-card px-4.5 py-4">
            <div className="font-display text-[30px] leading-none">{salvos}</div>
            <div className="mt-1.5 text-xs text-muted-2">lugares salvos</div>
          </div>
          <div className="rounded-[18px] border border-white/6 bg-card px-4.5 py-4">
            <div className="font-display text-[30px] leading-none text-muted-3">—</div>
            <div className="mt-1.5 text-xs text-muted-2">rolês que você foi</div>
          </div>
        </div>

        <div className="mt-8 max-w-2xl">
          <div className="rotulo text-muted-3">meu bairro</div>
          <div className="mt-2.5 flex items-center justify-between rounded-[18px] border border-white/6 bg-card px-4.5 py-4">
            <span className="flex items-center gap-2 text-[15px] font-bold">
              <svg width="13" height="13" viewBox="0 0 24 24" fill="#ff3d81">
                <path d="M12 2C8 2 5 5 5 9c0 5 7 13 7 13s7-8 7-13c0-4-3-7-7-7zm0 9.5A2.5 2.5 0 1112 6a2.5 2.5 0 010 5.5z" />
              </svg>
              {bairro}
            </span>
            <span className="text-xs font-semibold text-muted-3">único no piloto</span>
          </div>
        </div>

        <div className="mt-6 max-w-2xl">
          <div className="rotulo text-muted-3">privacidade</div>
          <div className="mt-2.5 rounded-[18px] border border-white/6 bg-card px-4.5 py-4">
            <div className="text-sm font-semibold">Seus sinais são anônimos</div>
            <p className="mt-1.5 text-xs leading-relaxed text-muted-2">
              Ninguém vê seu nome num sinal — nem o estabelecimento. Comentários, sim, são
              assinados. Amigos entram na fase 2.
            </p>
          </div>
        </div>

        <Link
          href="/curador"
          className="mt-6 flex max-w-2xl flex-col rounded-[20px] border border-amber/24 bg-gradient-to-br from-amber/13 to-violet/9 px-4.5 py-4.5"
        >
          <div className="rotulo text-amber">para donos de casa e curadores</div>
          <div className="mt-2 text-[15px] font-bold">
            Tenho um bar e quero cadastrar um rolê
          </div>
          <p className="mt-1.5 text-[12.5px] leading-relaxed text-muted">
            Um curador vai a pé validar antes de publicar.
          </p>
        </Link>
      </section>
    </DesktopShell>
  );
}
