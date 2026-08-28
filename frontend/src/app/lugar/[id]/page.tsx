import { notFound } from "next/navigation";
import { Desktop, Mobile } from "@/components/viewport";
import { DesktopShell } from "@/views/desktop/shell";
import { MobileShell } from "@/views/mobile/shell";
import { LugarFicha } from "@/views/lugar-ficha";
import { api, ApiError } from "@/lib/api";
import type { LugarDetalhe, RolePin } from "@/lib/types";

/**
 * A ficha do lugar. Não existia: só havia `/role/[id]`, e um lugar sem rolê hoje era
 * inalcançável — clicar no nome não levava a lugar nenhum. Isso deixava de fora o degrau
 * de baixo da escada do `conceito.md`, o boteco aberto e com movimento sem nada
 * programado, que é conteúdo legítimo.
 *
 * O rolê de hoje vem de `/mapa`, que é onde `role_ativo` já é resolvido — evita uma rota
 * nova só para isso. Se o lugar não estiver no recorte consultado, a ficha aparece sem o
 * bloco de hoje, o que é honesto: a tela não afirma que não tem, ela não mostra.
 */
export const dynamic = "force-dynamic";

async function carregar(id: string): Promise<{ lugar: LugarDetalhe; hoje: RolePin | null } | null> {
  try {
    const lugar = await api.lugar(id);
    const pins = await api.mapa(lugar.bairro).catch(() => []);
    return { lugar, hoje: pins.find((p) => p.lugar.id === lugar.id)?.role_ativo ?? null };
  } catch (erro) {
    if (erro instanceof ApiError && erro.status === 404) return null;
    throw erro;
  }
}

export default async function LugarPage({ params }: PageProps<"/lugar/[id]">) {
  const { id } = await params;
  const dados = await carregar(id);
  if (!dados) notFound();

  // O relógio é lido aqui, fora de componente, e desce por prop.
  const ficha = (
    <LugarFicha lugar={dados.lugar} roleHoje={dados.hoje} agora={new Date().toISOString()} />
  );

  return (
    <>
      <Mobile>
        <MobileShell>{ficha}</MobileShell>
      </Mobile>
      <Desktop>
        <DesktopShell>
          <div className="mx-auto w-full max-w-3xl">{ficha}</div>
        </DesktopShell>
      </Desktop>
    </>
  );
}
