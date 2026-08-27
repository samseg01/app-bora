import { Desktop, Mobile } from "@/components/viewport";
import { TelaPrecisaEntrar, usarDadoDeExemplo } from "@/components/ui/precisa-entrar";
import { PerfilDesktop } from "@/views/desktop/perfil";
import { PerfilMobile } from "@/views/mobile/perfil";
import { BAIRRO_EXEMPLO, SALVOS_EXEMPLO } from "@/lib/fixtures";

/** Tela 2h. Depende de auth para ter dado real — ver ../TODO.md, fase 3. */
export default function PerfilPage() {
  // Sem login, esta tela só tem dado de exemplo — que não pode aparecer em produção.
  if (!usarDadoDeExemplo()) {
    return (
      <TelaPrecisaEntrar
        titulo="Seu perfil"
        descricao="Bairro, lugares salvos e privacidade ficam aqui depois que você entrar."
      />
    );
  }

  return (
    <>
      <Mobile>
        <PerfilMobile bairro={BAIRRO_EXEMPLO} salvos={SALVOS_EXEMPLO.length} />
      </Mobile>
      <Desktop>
        <PerfilDesktop bairro={BAIRRO_EXEMPLO} salvos={SALVOS_EXEMPLO.length} />
      </Desktop>
    </>
  );
}
