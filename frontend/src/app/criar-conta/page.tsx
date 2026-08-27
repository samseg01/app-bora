import { FormularioAuth } from "@/views/auth/formulario";
import { MolduraAuth } from "@/views/auth/moldura";

/** Design: docs/front-end-ideias/entrar/Criar.dc.html */
export default function CriarContaPage() {
  return (
    <MolduraAuth>
      <FormularioAuth modo="criar" />
    </MolduraAuth>
  );
}
