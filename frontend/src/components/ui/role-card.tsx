import Link from "next/link";
import { FrescorPill } from "./frescor-pill";
import type { RoleDescoberta } from "@/lib/types";

/**
 * Card do rolê. Fluido — quem define a largura é o container (rail no mobile,
 * grade no desktop), então o mesmo componente serve as duas visualizações.
 *
 * O bloco de cor no lugar da foto é proposital: fotos reais de campo entram depois.
 */

const GRADIENTES = [
  "from-magenta to-violet",
  "from-amber to-magenta",
  "from-cyan to-violet",
  "from-violet to-plum",
];

export function RoleCard({
  role,
  indice,
  alturaFoto = "h-[116px]",
}: {
  role: RoleDescoberta;
  indice: number;
  alturaFoto?: string;
}) {
  return (
    <Link
      href={`/role/${role.id}`}
      className="block overflow-hidden rounded-[20px] border border-white/7 bg-card transition-colors hover:border-white/15"
    >
      <div
        className={`relative ${alturaFoto} bg-gradient-to-br ${GRADIENTES[indice % GRADIENTES.length]}`}
      >
        <div className="absolute top-2.5 left-2.5">
          <FrescorPill frescor={role.frescor} />
        </div>
      </div>
      <div className="px-3.5 pt-3 pb-4">
        <div className="rotulo text-amber">{role.categoria}</div>
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
