import { FormularioAuth } from "@/views/auth/formulario";
import { MolduraAuth } from "@/views/auth/moldura";

/** Design: docs/front-end-ideias/entrar/ */
export default function EntrarPage() {
  return (
    <MolduraAuth>
      <FormularioAuth modo="entrar" />
    </MolduraAuth>
  );
}
