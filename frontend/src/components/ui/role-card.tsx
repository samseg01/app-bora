import Link from "next/link";
import { FrescorPill } from "./frescor-pill";
import type { RoleDescoberta } from "@/lib/types";
import { corDaCategoria, gradienteDaCategoria } from "@/lib/categorias";

/**
 * Card do rolê. Fluido — quem define a largura é o container (rail no mobile,
 * grade no desktop), então o mesmo componente serve as duas visualizações.
 *
 * O bloco de cor no lugar da foto é proposital: fotos reais de campo entram depois.
 */

export function RoleCard({
  role,
  alturaFoto = "h-[116px]",
}: {
  role: RoleDescoberta;
  alturaFoto?: string;
}) {
  return (
    <Link
      href={`/role/${role.id}`}
      className="elevado rounded-[16px] block overflow-hidden border border-linha bg-card transition-colors hover:border-linha"
    >
      <div
        className={`relative ${alturaFoto} bg-gradient-to-br ${gradienteDaCategoria(role.categoria)}`}
      >
        <div className="absolute top-2.5 left-2.5">
          <FrescorPill frescor={role.frescor} />
        </div>
      </div>
      <div className="px-3.5 pt-3 pb-4">
        <div className={`rotulo ${corDaCategoria(role.categoria)}`}>{role.categoria}</div>
        <div className="mt-1.5 text-[15.5px] leading-[1.22] font-bold">
          {role.titulo}
        </div>
        {/* O design pedia "8 min a pé"; a API não devolve distância, e o nome do
            lugar informa melhor quem está decidindo. Ver docs/plano-frontend.md. */}
        <div className="mt-1 text-xs text-muted">{role.lugar_nome}</div>
      </div>
    </Link>
  );
}
