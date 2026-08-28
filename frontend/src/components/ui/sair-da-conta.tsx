"use client";

import { useRouter } from "next/navigation";
import { limparSessao } from "@/lib/auth";

/**
 * Sair da conta. Não há o que invalidar no servidor — o JWT é sem estado por decisão
 * (ADR-0003), então sair é apagar o token daqui. A consequência honesta: um token
 * copiado antes continua valendo até expirar.
 *
 * O bairro escolhido fica: é preferência de navegação, não sessão, e apagá-lo jogaria
 * a pessoa de volta na abertura sem motivo.
 */
export function SairDaConta() {
  const router = useRouter();

  function sair() {
    limparSessao();
    router.replace("/");
    router.refresh();
  }

  return (
    <button
      type="button"
      onClick={sair}
      className="w-full rounded-[18px] border border-white/10 px-4.5 py-3.5 text-left text-sm font-semibold text-muted-2 transition-colors hover:border-magenta/35 hover:text-magenta-soft"
    >
      Sair da conta
    </button>
  );
}
