import type { LugarDetalhe, MapaPin, RoleDescoberta, RolePublic } from "./types";

const BASE =
  process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000/api/v1";

/** 401, 403 e 409 têm tratamento de UI diferente — o status precisa sobreviver ao throw. */
export class ApiError extends Error {
  constructor(
    readonly status: number,
    readonly detalhe: string,
  ) {
    super(`API ${status}: ${detalhe}`);
    this.name = "ApiError";
  }
}

/** A API não respondeu (backend fora do ar, CORS, rede) — distinto de um erro HTTP. */
export class ApiOffline extends Error {
  constructor(readonly causa: unknown) {
    super("API inacessível");
    this.name = "ApiOffline";
  }
}

interface Opcoes {
  token?: string;
  metodo?: "GET" | "POST" | "DELETE";
  corpo?: unknown;
}

async function req<T>(caminho: string, opcoes: Opcoes = {}): Promise<T> {
  const { token, metodo = "GET", corpo } = opcoes;

  let resposta: Response;
  try {
    resposta = await fetch(`${BASE}${caminho}`, {
      method: metodo,
      headers: {
        ...(corpo ? { "Content-Type": "application/json" } : {}),
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      body: corpo ? JSON.stringify(corpo) : undefined,
      // Descoberta e frescor são de agora — cache aqui serviria dado velho de propósito.
      cache: "no-store",
    });
  } catch (causa) {
    // O Next sinaliza controle de fluxo por throw (rota dinâmica, redirect, notFound),
    // e esses erros carregam `digest`. Engoli-los quebra o framework de formas silenciosas:
    // só falha de rede de verdade vira ApiOffline.
    if (causa && typeof causa === "object" && "digest" in causa) throw causa;
    throw new ApiOffline(causa);
  }

  if (resposta.status === 204) return undefined as T;

  if (!resposta.ok) {
    const detalhe = await resposta
      .json()
      .then((c) => (typeof c?.detail === "string" ? c.detail : resposta.statusText))
      .catch(() => resposta.statusText);
    throw new ApiError(resposta.status, detalhe);
  }

  return resposta.json() as Promise<T>;
}

export const api = {
  descoberta: (bairro: string) =>
    req<RoleDescoberta[]>(`/descoberta?bairro=${encodeURIComponent(bairro)}`),

  role: (id: string) => req<RolePublic>(`/roles/${id}`),

  mapa: (bairro: string, bbox?: string) =>
    req<MapaPin[]>(
      `/mapa?bairro=${encodeURIComponent(bairro)}${bbox ? `&bbox=${bbox}` : ""}`,
    ),

  lugar: (id: string) => req<LugarDetalhe>(`/lugares/${id}`),
};
