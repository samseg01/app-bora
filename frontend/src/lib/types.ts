/**
 * Espelho dos schemas Pydantic do backend (../backend/src/boraroles/schemas/).
 * Datas chegam como string ISO com offset — mantidas como string e convertidas
 * na borda (lib/tempo.ts), não fingidas de Date.
 */

export type Frescor = "live" | "warm" | "new";

export type PapelUsuario = "comum" | "curador" | "dono_estabelecimento";

export type TipoSinalizacao = "presenca" | "fila" | "lotado";

/** GET /descoberta — traz `lugar_id` desde 28/08; lat/lng continuam de fora (item 19). */
export interface RoleDescoberta {
  id: string;
  /** Necessário para salvar o lugar direto do card da home. */
  lugar_id: string;
  titulo: string;
  /** O "motivo pra ir" — vem de /descoberta desde a migration 0002. */
  descricao: string | null;
  categoria: string;
  data_inicio: string;
  data_fim: string;
  frescor: Frescor | null;
  lugar_nome: string;
  lugar_bairro: string;
}

/** GET /roles/{id} */
export interface RolePublic {
  id: string;
  lugar_id: string;
  titulo: string;
  categoria: string;
  data_inicio: string;
  data_fim: string;
  frescor: Frescor | null;
  created_at: string;
  /**
   * O "motivo pra ir". A coluna NÃO existe no backend ainda (../TODO.md item 15) —
   * opcional de propósito: as telas renderizam o bloco quando vier e o omitem enquanto
   * não vier, sem inventar texto.
   */
  descricao?: string | null;
  /** Idem: contagem de sinais ainda não é exposta pela API (item 17). */
  sinais_recentes?: number | null;
}

export interface LugarPublic {
  id: string;
  nome: string;
  categoria: string;
  lat: number;
  lng: number;
  bairro: string;
  estabelecimento_id: string | null;
  fotos: string[] | null;
  created_at: string;
  /** Existe no schema desde 28/08 (migration 0003). Nullable: o lugar é localizável por
      lat/lng sozinho, e nem todo cadastro de campo traz o número. */
  endereco: string | null;
}

export interface RolePin {
  id: string;
  titulo: string;
  categoria: string;
  data_inicio: string;
  data_fim: string;
  frescor: Frescor | null;
}

/** GET /mapa */
export interface MapaPin {
  lugar: LugarPublic;
  role_ativo: RolePin | null;
  /** Total histórico, sem janela de tempo — o copy do design ("na última hora") não se aplica. */
  total_comentarios: number;
}

/** GET /lugares/proximos — o pin do mapa mais a distância, em metros. */
export interface LugarProximo {
  lugar: LugarPublic;
  distancia_m: number;
  role_ativo: RolePin | null;
}

export interface ComentarioResumo {
  autor_nome: string;
  texto: string;
  created_at: string;
}

/** GET /lugares/{id} */
export interface LugarDetalhe extends LugarPublic {
  comentarios_recentes: ComentarioResumo[];
  frescor: Frescor | null;
}

export interface UsuarioPublic {
  id: string;
  nome: string;
  email: string;
  papel: PapelUsuario;
  created_at: string;
}

/** GET /salvos — cru: só o id do lugar (ver ../TODO.md item 16). */
export interface SalvoPublic {
  lugar_id: string;
  created_at: string;
}

/* --------------------------------------------------------------------------
 * Conexões — nada disto existe no backend ainda (itens 27–30 de ../TODO.md).
 * Os tipos vivem aqui porque a UI já está implementada e precisa de forma;
 * quando as rotas existirem, é aqui que elas encaixam.
 * ------------------------------------------------------------------------ */

export type StatusConexao = "pendente" | "aceita" | "bloqueada";

export interface Conexao {
  id: string;
  nome: string;
  status: StatusConexao;
  created_at: string;
}

/**
 * Um check-in ativo de uma conexão. `lugar` é null quando a pessoa escolheu
 * avisar só o bairro — a opção de precisão reduzida, que é do v1 de propósito.
 */
export interface CheckInDeConexao {
  id: string;
  conexao_id: string;
  nome: string;
  lugar_id: string | null;
  lugar_nome: string | null;
  bairro: string;
  role_id: string | null;
  role_titulo: string | null;
  frescor: Frescor | null;
  timestamp: string;
}

/** Um lugar salvo por conexões suas, com quem salvou. */
export interface SalvoDeConexao {
  lugar: LugarPublic;
  por: string[];
}

/** GET /estabelecimento/meus */
export interface EstabelecimentoPublic {
  id: string;
  dono_usuario_id: string;
  nome: string;
  /** `organico` = não paga nada. O destaque verificado é o único plano pago previsto. */
  plano: "organico" | "destaque_verificado";
  created_at: string;
}

/**
 * GET /estabelecimento/{id}/engajamento
 *
 * ⚠️ Os dois totais são **desde sempre**, não uma janela de tempo: a agregação em
 * `services/engajamento.py` conta todas as linhas de `Salvo` e `Sinalizacao`. Qualquer
 * rótulo do tipo "esta semana" na tela seria mentira.
 */
export interface EngajamentoPorLugar {
  lugar_id: string;
  lugar_nome: string;
  total_salvos: number;
  total_sinalizacoes: number;
}

export interface EngajamentoEstabelecimento {
  estabelecimento_id: string;
  total_salvos: number;
  total_sinalizacoes: number;
  por_lugar: EngajamentoPorLugar[];
}

/** POST /sinalizacoes */
export interface SinalizacaoPublic {
  id: string;
  role_id: string | null;
  lugar_id: string | null;
  tipo: TipoSinalizacao;
  timestamp: string;
}
