import Link from "next/link";
import { Avatar } from "@/components/ui/avatar";
import { AtalhoPainel } from "@/components/ui/atalho-painel";
import { SairDaConta } from "@/components/ui/sair-da-conta";
import { MobileShell } from "./shell";

/** Tela 2h. Mesmas ressalvas da visualização desktop (ver views/desktop/perfil.tsx). */
export function PerfilMobile({
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
    <MobileShell>
      <div className="flex items-center gap-4 px-5.5 pt-9.5">
        <Avatar nome={nome} tamanho={64} />
        <div>
          <div className="titulo text-[26px] leading-none">{nome}</div>
          <div className="mt-1.5 text-[12.5px] text-muted-2">{bairro} · desde {desde}</div>
        </div>
      </div>

      <div className="mt-5.5 flex gap-2.5 px-5.5">
        <div className="rounded-[12px] flex-1 border border-linha bg-card px-4 py-3.5">
          <div className="titulo text-[30px] leading-none">{salvos}</div>
          <div className="mt-1 text-xs text-muted-2">lugares salvos</div>
        </div>
        <div className="rounded-[12px] flex-1 border border-linha bg-card px-4 py-3.5">
          <div className="titulo text-[30px] leading-none text-muted-3">—</div>
          <div className="mt-1 text-xs text-muted-2">rolês que você foi</div>
        </div>
      </div>

      <div className="mt-6.5 px-5.5">
        <div className="rotulo text-muted-3">meu bairro</div>
        <div className="elevado rounded-[16px] mt-2.5 flex items-center justify-between border border-linha bg-card px-4 py-3.5">
          <span className="flex items-center gap-2 text-[15px] font-bold">
            <svg width="13" height="13" viewBox="0 0 24 24" fill="currentColor">
              <path d="M12 2C8 2 5 5 5 9c0 5 7 13 7 13s7-8 7-13c0-4-3-7-7-7zm0 9.5A2.5 2.5 0 1112 6a2.5 2.5 0 010 5.5z" />
            </svg>
            {bairro}
          </span>
          <Link href="/abertura" className="text-xs font-semibold text-text-soft">trocar</Link>
        </div>
      </div>

      <div className="mt-6 px-5.5">
        <div className="rotulo text-muted-3">privacidade</div>
        <div className="elevado rounded-[16px] mt-2.5 border border-linha bg-card px-4 py-3.5">
          <div className="text-sm font-semibold">Seus sinais são anônimos</div>
          <p className="mt-1.5 text-xs leading-relaxed text-muted-2">
            Ninguém vê seu nome num sinal. Comentários, sim, são assinados.
          </p>
        </div>
      </div>

      <div className="mx-5.5 mt-6 mb-5">
        <AtalhoPainel />
      </div>
      <div className="mx-5.5 mt-6 mb-5">
        <SairDaConta />
      </div>
    </MobileShell>
  );
}
