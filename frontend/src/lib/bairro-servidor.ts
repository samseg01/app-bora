import { cookies } from "next/headers";
import { bairroValido, COOKIE_BAIRRO } from "./bairros";

/**
 * O bairro escolhido, lido no servidor. Devolve null quando ninguém escolheu ainda —
 * as páginas então mandam para a abertura.
 *
 * Valida contra a lista: cookie é entrada do usuário e pode vir com qualquer coisa.
 */
export async function bairroEscolhido(): Promise<string | null> {
  const jar = await cookies();
  return bairroValido(jar.get(COOKIE_BAIRRO)?.value);
}
