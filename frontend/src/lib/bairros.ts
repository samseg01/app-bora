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

export const BAIRROS: Bairro[] = [
  {
    nome: "República",
    descricao: "O recorte do piloto: Largo do Arouche, Vieira de Carvalho e a praça.",
  },
  {
    nome: "Pinheiros",
    descricao: "Do Largo da Batata até a Benedito Calixto.",
  },
];

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
