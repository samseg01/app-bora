/**
 * De onde a foto de um lugar é carregada.
 *
 * O backend guarda o caminho relativo (`/fotos/ab12.jpg`), e não a URL completa, porque
 * em produção front e back são a **mesma origem** (ADR de raiz 0001): gravar o domínio no
 * banco só criaria dado para migrar no dia em que ele mudar.
 *
 * Isso funciona sozinho em produção — o Caddy roteia `/fotos/*` para a api — e **quebra em
 * desenvolvimento**, onde o navegador está em `localhost:3000` e o arquivo mora em
 * `localhost:8000`. Sem esta função a foto some justamente na máquina de quem a está
 * construindo, com um 404 que parece upload quebrado e é só roteamento.
 *
 * A regra sai da própria base da API, sem precisar olhar `NODE_ENV`:
 *
 * - base relativa (`/api/v1`) → mesma origem → o caminho já resolve, devolve como está;
 * - base absoluta (`http://192.168.15.63:8000/api/v1`) → api noutro lugar → prefixa com a
 *   origem dela.
 *
 * URL completa (`https://...`) passa direto: o campo de foto aceita endereço de fora desde
 * antes do upload existir, e continua aceitando.
 */

/**
 * A base é lida **dentro** da função, não no módulo. O Next substitui
 * `process.env.NEXT_PUBLIC_*` por literal em qualquer lugar do código do cliente, então o
 * comportamento é o mesmo dos dois jeitos — mas assim o teste consegue variar o ambiente,
 * que é justamente o que distingue os dois casos que esta função existe para tratar.
 */
function origemDaApi(): string | null {
  const base = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000/api/v1";
  if (!/^https?:\/\//i.test(base)) return null;
  try {
    return new URL(base).origin;
  } catch {
    return null;
  }
}

export function urlDaFoto(caminho: string | null | undefined): string | null {
  if (!caminho) return null;

  const limpo = caminho.trim();
  if (!limpo) return null;

  // Absoluta (http, https, data:) ou protocol-relative: já sabe se virar sozinha.
  if (/^([a-z][a-z0-9+.-]*:|\/\/)/i.test(limpo)) return limpo;

  // Só caminho de raiz é nosso. Qualquer outra coisa devolve intacta, para não inventar
  // origem em cima de dado que a gente não reconhece.
  if (!limpo.startsWith("/")) return limpo;

  const origem = origemDaApi();
  return origem ? `${origem}${limpo}` : limpo;
}
