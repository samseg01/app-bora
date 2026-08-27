import { Desktop, Mobile } from "@/components/viewport";
import { TelaPrecisaEntrar, usarDadoDeExemplo } from "@/components/ui/precisa-entrar";
import { CuradorDesktop } from "@/views/desktop/curador";
import { CuradorMobile } from "@/views/mobile/curador";
import { BAIRRO_EXEMPLO, LUGARES_EXEMPLO, ROLES_EXEMPLO } from "@/lib/fixtures";

/**
 * Painel do curador. A API existe inteira (CRUD em /curador/lugares e /curador/roles,
 * papel=curador), mas todas as rotas exigem token e o login só chega na fase 3 — então
 * a tela roda com dado de exemplo e o formulário não envia.
 */
export const dynamic = "force-dynamic";

const DUAS_HORAS_MS = 2 * 60 * 60 * 1000;

/**
 * O relógio é lido aqui, fora de qualquer componente e uma vez por requisição. Ler a
 * hora durante o render é impuro (o React Compiler recusa) e diverge na hidratação.
 */
async function carregar() {
  const agora = Date.now();
  return {
    lugares: LUGARES_EXEMPLO.filter((l) => l.bairro === BAIRRO_EXEMPLO),
    terminandoLogo: ROLES_EXEMPLO.filter(
      (r) => new Date(r.data_fim).getTime() - agora < DUAS_HORAS_MS,
    ).length,
  };
}

export default async function CuradorPage() {
  const { lugares, terminandoLogo } = await carregar();

  // Sem login, esta tela só tem dado de exemplo — que não pode aparecer em produção.
  if (!usarDadoDeExemplo()) {
    return (
      <TelaPrecisaEntrar
        titulo="Painel do curador"
        descricao="Publicar rolê é coisa de quem valida em campo. Precisa entrar como curador."
        curador
      />
    );
  }

  return (
    <>
      <Mobile>
        <CuradorMobile roles={ROLES_EXEMPLO} lugares={lugares} bairro={BAIRRO_EXEMPLO} />
      </Mobile>
      <Desktop>
        <CuradorDesktop
          roles={ROLES_EXEMPLO}
          lugares={lugares}
          bairro={BAIRRO_EXEMPLO}
          terminandoLogo={terminandoLogo}
        />
      </Desktop>
    </>
  );
}
