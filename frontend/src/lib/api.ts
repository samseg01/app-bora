import type {
  EngajamentoEstabelecimento,
  EstabelecimentoPublic,
  LugarDetalhe,
  LugarProximo,
  MapaPin,
  RoleDescoberta,
  LugarPublic,
  RolePublic,
  SalvoDetalhe,
  SinalizacaoPublic,
  TipoSinalizacao,
  UsuarioPublic,
} from "./types";

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
  metodo?: "GET" | "POST" | "PATCH" | "DELETE";
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

  entrar: (email: string, senha: string) =>
    req<{ access_token: string }>("/auth/login", {
      metodo: "POST",
      corpo: { email, senha },
    }),

  criarConta: (nome: string, email: string, senha: string) =>
    req<UsuarioPublic>("/auth/signup", {
      metodo: "POST",
      corpo: { nome, email, senha },
    }),

  /** Lugares curados mais próximos de um ponto. Público: perguntar "o que tem perto de
      mim" é o primeiro toque de quem nunca usou o app, e exigir login ali seria atrito
      exatamente no pior lugar. */
  proximos: (lat: number, lng: number, raio_m = 20000) =>
    req<LugarProximo[]>(`/lugares/proximos?lat=${lat}&lng=${lng}&raio_m=${raio_m}`),

  eu: (token: string) => req<UsuarioPublic>("/auth/me", { token }),

  /** Já vem com o lugar e o rolê de hoje — uma chamada monta o caderninho inteiro. */
  salvos: (token: string) => req<SalvoDetalhe[]>("/salvos", { token }),

  /** ⚠️ 403 para papel comum (ADR-0006): só curador e dono de estabelecimento sinalizam. */
  sinalizar: (token: string, role_id: string, tipo: TipoSinalizacao = "presenca") =>
    req<SinalizacaoPublic>("/sinalizacoes", { token, metodo: "POST", corpo: { role_id, tipo } }),

  /** Os sinais do próprio usuário ainda dentro da janela de 2h — o que permite ao
      "Tá marcado" sobreviver a sair da tela e voltar. */
  meusSinais: (token: string) => req<SinalizacaoPublic[]>("/sinalizacoes/minhas", { token }),

  cancelarSinal: (token: string, id: string) =>
    req<void>(`/sinalizacoes/${id}`, { token, metodo: "DELETE" }),

  comentar: (token: string, role_id: string, texto: string) =>
    req<unknown>("/comentarios", { token, metodo: "POST", corpo: { role_id, texto } }),

  /** Só o que ainda não terminou, e só do bairro em que o painel está. */
  curadorRoles: (token: string, bairro: string) =>
    req<RolePublic[]>(`/curador/roles?bairro=${encodeURIComponent(bairro)}`, { token }),

  removerRole: (token: string, id: string) =>
    req<void>(`/curador/roles/${id}`, { token, metodo: "DELETE" }),

  /** Painel do dono. `meus` é o que resolve qual estabelecimento é o seu — o vínculo
      não viaja no JWT, só o papel. */
  meusEstabelecimentos: (token: string) =>
    req<EstabelecimentoPublic[]>("/estabelecimento/meus", { token }),

  estabelecimentoLugares: (token: string, id: string) =>
    req<LugarPublic[]>(`/estabelecimento/${id}/lugares`, { token }),

  /** ⚠️ Totais desde sempre, não de uma janela — ver o comentário em `types.ts`. */
  engajamento: (token: string, id: string) =>
    req<EngajamentoEstabelecimento>(`/estabelecimento/${id}/engajamento`, { token }),

  curadorLugares: (token: string, bairro?: string) =>
    req<LugarPublic[]>(
      `/curador/lugares${bairro ? `?bairro=${encodeURIComponent(bairro)}` : ""}`,
      { token },
    ),

  salvar: (token: string, lugar_id: string) =>
    req<unknown>("/salvos", { token, metodo: "POST", corpo: { lugar_id } }),

  dessalvar: (token: string, lugar_id: string) =>
    req<void>(`/salvos/${lugar_id}`, { token, metodo: "DELETE" }),

  criarRole: (
    token: string,
    corpo: {
      lugar_id: string;
      titulo: string;
      descricao: string | null;
      categoria: string;
      data_inicio: string;
      data_fim: string;
    },
  ) => req<RolePublic>("/curador/roles", { token, metodo: "POST", corpo }),

  criarLugar: (
    token: string,
    corpo: {
      nome: string;
      categoria: string;
      lat: number;
      lng: number;
      bairro: string;
      /** Opcionais: o curador em campo anota o que conseguiu. */
      endereco?: string | null;
      descricao?: string | null;
      instagram?: string | null;
      horario_funcionamento?: string | null;
      programacao?: string | null;
      preco_longneck?: number | null;
    },
  ) => req<LugarPublic>("/curador/lugares", { token, metodo: "POST", corpo }),

  /** Corrigir um lugar já cadastrado. O `PATCH` existe no backend desde o esqueleto e
      não tinha formulário: quem cadastrou na rua com a coordenada errada não tinha como
      arrumar sem SQL. */
  atualizarLugar: (
    token: string,
    id: string,
    corpo: {
      nome?: string;
      endereco?: string | null;
      descricao?: string | null;
      instagram?: string | null;
      horario_funcionamento?: string | null;
      programacao?: string | null;
      preco_longneck?: number | null;
      /** Lista de URLs. A primeira é a que a ficha usa como imagem de topo. */
      fotos?: string[] | null;
      lat?: number;
      lng?: number;
    },
  ) => req<LugarPublic>(`/curador/lugares/${id}`, { token, metodo: "PATCH", corpo }),
};
