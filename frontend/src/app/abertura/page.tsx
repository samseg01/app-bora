import { EscolhaBairro } from "@/views/abertura/escolha-bairro";
import { api, ApiOffline } from "@/lib/api";
import { BAIRROS } from "@/lib/bairros";
import { bairroEscolhido } from "@/lib/bairro-servidor";

/**
 * Primeira tela de quem nunca abriu o app. As contagens ao lado de cada bairro vêm da
 * API de verdade — se a curadoria ainda não aconteceu, a tela diz isso.
 */
export const dynamic = "force-dynamic";

async function contar() {
  const pares = await Promise.all(
    BAIRROS.map(async (b) => {
      try {
        const [pins, roles] = await Promise.all([api.mapa(b.nome), api.descoberta(b.nome)]);
        return [b.nome, { lugares: pins.length, roles: roles.length }] as const;
      } catch (erro) {
        // Sem API não se inventa número: a tela cai em "curadoria começando".
        if (erro instanceof ApiOffline) return [b.nome, { lugares: 0, roles: 0 }] as const;
        throw erro;
      }
    }),
  );
  return Object.fromEntries(pares);
}

export default async function AberturaPage() {
  const [contagens, atual] = await Promise.all([contar(), bairroEscolhido()]);
  return <EscolhaBairro contagens={contagens} atual={atual} />;
}
