import { notFound } from "next/navigation";
import { Desktop, Mobile } from "@/components/viewport";
import { RoleDesktop } from "@/views/desktop/role";
import { RoleMobile } from "@/views/mobile/role";
import { AvisoOffline } from "@/components/ui/aviso-offline";
import { api, ApiError, ApiOffline } from "@/lib/api";
import { lugarDetalheExemplo, roleExemplo } from "@/lib/fixtures";
import type { LugarDetalhe, RolePublic } from "@/lib/types";

export const dynamic = "force-dynamic";

interface Dados {
  role: RolePublic;
  lugar: LugarDetalhe | null;
  offline: boolean;
}

async function carregar(id: string): Promise<Dados | null> {
  try {
    const role = await api.role(id);
    // O lugar é uma segunda chamada porque RolePublic só traz o lugar_id.
    const lugar = await api.lugar(role.lugar_id).catch(() => null);
    return { role, lugar, offline: false };
  } catch (erro) {
    if (erro instanceof ApiError && erro.status === 404) return null;
    if (erro instanceof ApiOffline && process.env.NODE_ENV !== "production") {
      const role = roleExemplo(id);
      if (!role) return null;
      return { role, lugar: lugarDetalheExemplo(role.lugar_id), offline: true };
    }
    throw erro;
  }
}

export default async function RolePage({ params }: PageProps<"/role/[id]">) {
  // Next 15+: params é uma Promise.
  const { id } = await params;
  const dados = await carregar(id);
  if (!dados) notFound();

  const { role, lugar, offline } = dados;
  const comentarios = lugar?.comentarios_recentes ?? [];

  return (
    <>
      {offline && <AvisoOffline />}
      <Mobile>
        <RoleMobile role={role} lugar={lugar} comentarios={comentarios} />
      </Mobile>
      <Desktop>
        <RoleDesktop role={role} lugar={lugar} comentarios={comentarios} />
      </Desktop>
    </>
  );
}
