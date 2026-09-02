import Link from "next/link";
import { Avatar } from "@/components/ui/avatar";
import { AtalhoPainel } from "@/components/ui/atalho-painel";
import { SairDaConta } from "@/components/ui/sair-da-conta";
import { DesktopShell } from "./shell";

/**
 * Tela 2h em tela grande. Nome e data de cadastro vêm de `GET /auth/me`, que passou a
 * existir; "rolês que você foi" continua sem rota nenhuma e por isso aparece como travessão,
 * não como zero — zero seria uma afirmação, e não sabemos.
 *
 * O toggle "meus sinais são anônimos" do design virou texto: não há campo para
 * desligar, e as sinalizações já são anônimas de fato — nenhum endpoint expõe o
 * autor. Um controle que não controla nada promete o que não existe.
 */
export function PerfilDesktop({
  bairro,
  salvos,
  nome,
  desde,
}: {
  bairro: string;
  salvos: number;
  nome: string;
  desde: string;
}) {
  return (
    <DesktopShell>
      <section className="min-w-0 flex-1 px-10 py-8">
        <div className="flex items-center gap-4.5">
          <Avatar nome={nome} tamanho={64} />
          <div>
            <h1 className="titulo text-[34px] leading-none">{nome}</h1>
            <p className="mt-1.5 text-[12.5px] text-muted-2">{bairro} · desde {desde}</p>
          </div>
        </div>

        <div className="mt-7 grid max-w-2xl grid-cols-2 gap-3.5">
          <div className="elevado rounded-[16px]  border border-linha bg-card px-4.5 py-4">
            <div className="titulo text-[30px] leading-none">{salvos}</div>
            <div className="mt-1.5 text-xs text-muted-2">lugares salvos</div>
          </div>
          <div className="elevado rounded-[16px]  border border-linha bg-card px-4.5 py-4">
            <div className="titulo text-[30px] leading-none text-muted-3">—</div>
            <div className="mt-1.5 text-xs text-muted-2">rolês que você foi</div>
          </div>
        </div>

        <div className="mt-8 max-w-2xl">
          <div className="rotulo text-muted-3">meu bairro</div>
          <div className="elevado rounded-[16px] mt-2.5 flex items-center justify-between border border-linha bg-card px-4.5 py-4">
            <span className="flex items-center gap-2 text-[15px] font-bold">
              <svg width="13" height="13" viewBox="0 0 24 24" fill="currentColor">
                <path d="M12 2C8 2 5 5 5 9c0 5 7 13 7 13s7-8 7-13c0-4-3-7-7-7zm0 9.5A2.5 2.5 0 1112 6a2.5 2.5 0 010 5.5z" />
              </svg>
              {bairro}
            </span>
            <Link href="/abertura" className="text-xs font-semibold text-text-soft">trocar</Link>
          </div>
        </div>

        <div className="mt-6 max-w-2xl">
          <div className="rotulo text-muted-3">privacidade</div>
          <div className="elevado rounded-[16px] mt-2.5 border border-linha bg-card px-4.5 py-4">
            <div className="text-sm font-semibold">Seus sinais são anônimos</div>
            <p className="mt-1.5 text-xs leading-relaxed text-muted-2">
              Ninguém vê seu nome num sinal — nem o estabelecimento. Comentários, sim, são
              assinados. Amigos entram na fase 2.
            </p>
          </div>
        </div>

        <div className="mt-6 max-w-2xl">
          <AtalhoPainel />
        </div>
        <div className="mt-8 max-w-2xl">
          <SairDaConta />
        </div>

      </section>
    </DesktopShell>
  );
}
