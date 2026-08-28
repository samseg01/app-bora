/**
 * Os recortes que o app atende. Lista curta e explícita de propósito: o produto se
 * define por ser bom em pouco lugar, e um seletor com vinte opções contaria outra
 * história.
 *
 * A escolha vive num **cookie**, não em `localStorage`: a home e o mapa são
 * renderizados no servidor e precisam saber qual bairro consultar antes de mandar HTML.
 * `localStorage` só existe depois da hidratação — serviria para a sessão (que é do
 * cliente), não para isto.
 */

export interface Bairro {
  /** Valor real usado em `?bairro=` — precisa bater com `Lugar.bairro` no banco. */
  nome: string;
  descricao: string;
}

const RECORTES: Bairro[] = [
  {
    nome: "República",
    descricao: "O recorte do piloto: Largo do Arouche, Vieira de Carvalho e a praça.",
  },
  {
    nome: "Pinheiros",
    descricao: "Do Largo da Batata até a Benedito Calixto.",
  },
];

/**
 * Em desenvolvimento entra também a Vila Madalena, que é onde vive o seed fictício
 * (`backend/seed/exemplo-ficticio.json`). Sem isso o app fica inalcançável com dado:
 * o piloto está vazio de propósito, e semear ficção em República seria exatamente o
 * que o arquivo de seed do piloto existe para impedir.
 *
 * Nunca aparece em produção.
 */
const SO_EM_DEV: Bairro[] = [
  { nome: "Vila Madalena", descricao: "Só em desenvolvimento — dado fictício do seed." },
];

export const BAIRROS: Bairro[] =
  process.env.NODE_ENV === "production" ? RECORTES : [...RECORTES, ...SO_EM_DEV];

export const COOKIE_BAIRRO = "boraroles.bairro";

/** Um ano: a escolha é estável e trocá-la é raro (fica no perfil). */
export const COOKIE_MAX_AGE = 60 * 60 * 24 * 365;

export function bairroValido(nome: string | undefined): string | null {
  if (!nome) return null;
  return BAIRROS.some((b) => b.nome === nome) ? nome : null;
}

/** Leitura no cliente (perfil, telas já hidratadas). No servidor use `bairro-servidor`. */
export function bairroDoCookie(): string | null {
  if (typeof document === "undefined") return null;
  const m = document.cookie.match(new RegExp(`(?:^|; )${COOKIE_BAIRRO}=([^;]*)`));
  return bairroValido(m ? decodeURIComponent(m[1]) : undefined);
}

/**
 * Grava a escolha. Fica aqui, e não no componente, porque escrever em `document.cookie`
 * de dentro de um componente é modificar valor externo — o React Compiler recusa, e com
 * razão: efeito de fora do React merece uma fronteira explícita.
 */
export function salvarBairro(nome: string): void {
  const valido = bairroValido(nome);
  if (!valido) return;
  document.cookie = `${COOKIE_BAIRRO}=${encodeURIComponent(valido)}; path=/; max-age=${COOKIE_MAX_AGE}; samesite=lax`;
}
