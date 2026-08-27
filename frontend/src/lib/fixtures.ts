import type {
  CheckInDeConexao,
  ComentarioResumo,
  Conexao,
  LugarDetalhe,
  MapaPin,
  RoleDescoberta,
  RolePublic,
  SalvoDeConexao,
} from "./types";

/**
 * Dado de desenvolvimento, usado SÓ quando a API não responde e só fora de produção,
 * e nas telas que ainda dependem de autenticação (salvos, perfil, curador — fase 3).
 *
 * Existe porque o backend roda em Docker local e fica fora do ar com frequência durante
 * o trabalho de UI, e porque ainda não há seed no backend (../TODO.md item 22).
 *
 * O conteúdo é o do próprio design, de propósito: a tela renderizada pode ser comparada
 * lado a lado com a artboard. Não é dado real de campo.
 *
 * Quando o seed existir, apagar este arquivo — dois lugares inventando dados é um a mais.
 */

const HOJE = new Date();
const emHoras = (h: number) => {
  const d = new Date(HOJE);
  d.setHours(d.getHours() + h);
  return d.toISOString();
};

export const BAIRRO_EXEMPLO = "Vila Madalena";

const ID = {
  aurora: "a1000000-0000-4000-8000-000000000001",
  boteco: "a1000000-0000-4000-8000-000000000002",
  garagem: "a1000000-0000-4000-8000-000000000003",
  casa47: "a1000000-0000-4000-8000-000000000004",
  cru: "a1000000-0000-4000-8000-000000000005",
  praca: "a1000000-0000-4000-8000-000000000006",
  roleAurora: "f1000000-0000-4000-8000-000000000001",
  roleBoteco: "f1000000-0000-4000-8000-000000000002",
  roleGaragem: "f1000000-0000-4000-8000-000000000003",
};

export const ROLES_EXEMPLO: RoleDescoberta[] = [
  {
    id: ID.roleAurora,
    titulo: "Selo aberto no rooftop",
    descricao:
      "Entrada livre até meia-noite. Set de house às 23h30, teto aberto. Depois da meia-noite a fila dobra a esquina — vale chegar antes.",
    categoria: "Balada",
    data_inicio: emHoras(-1),
    data_fim: emHoras(5),
    frescor: "live",
    lugar_nome: "Bar Aurora",
    lugar_bairro: BAIRRO_EXEMPLO,
  },
  {
    id: ID.roleBoteco,
    titulo: "Samba de quinta no boteco",
    descricao:
      "Roda de samba na calçada desde as 21h. Sem couvert, cerveja a 12. Cabe pouca gente sentada.",
    categoria: "Bar",
    data_inicio: emHoras(-2),
    data_fim: emHoras(3),
    frescor: "warm",
    lugar_nome: "Boteco do Zé",
    lugar_bairro: BAIRRO_EXEMPLO,
  },
  {
    id: ID.roleGaragem,
    titulo: "Sarau na garagem",
    descricao:
      "Microfone aberto à meia-noite. Cabem 40 pessoas, chega cedo se quiser ler.",
    categoria: "Sarau",
    data_inicio: emHoras(1),
    data_fim: emHoras(4),
    frescor: "new",
    lugar_nome: "Garagem 9",
    lugar_bairro: BAIRRO_EXEMPLO,
  },
];

/** O "motivo pra ir" de cada rolê — o campo que o backend ainda não tem (item 15). */
export const MOTIVO_EXEMPLO: Record<string, string> = {
  [ID.roleAurora]:
    "Entrada livre até meia-noite. Set de house às 23h30, teto aberto. Depois da meia-noite a fila dobra a esquina — vale chegar antes.",
  [ID.roleBoteco]:
    "Roda de samba na calçada desde as 21h. Sem couvert, cerveja a 12. Cabe pouca gente sentada.",
  [ID.roleGaragem]:
    "Microfone aberto à meia-noite. Cabem 40 pessoas, chega cedo se quiser ler.",
};

function lugar(
  id: string,
  nome: string,
  categoria: string,
  lat: number,
  lng: number,
  endereco: string,
  bairro: string = BAIRRO_EXEMPLO,
) {
  return {
    id,
    nome,
    categoria,
    lat,
    lng,
    bairro,
    estabelecimento_id: null,
    fotos: null,
    created_at: emHoras(-720),
    endereco,
  };
}

export const LUGARES_EXEMPLO = [
  lugar(ID.aurora, "Bar Aurora", "bar", -23.5541, -46.6902, "Rua Aspicuelta, 340"),
  lugar(ID.boteco, "Boteco do Zé", "boteco", -23.5563, -46.6871, "Rua Fidalga, 112"),
  lugar(ID.garagem, "Garagem 9", "sarau", -23.5528, -46.6858, "Rua Harmonia, 9"),
  lugar(ID.casa47, "Casa 47", "show ao vivo", -23.5575, -46.6925, "Rua Girassol, 47"),
  lugar(ID.cru, "Espaço Cru", "galeria", -23.5519, -46.6935, "Rua Wisard, 88"),
  lugar(
    ID.praca,
    "Praça Benedito Calixto",
    "feira",
    -23.5606,
    -46.6889,
    "Praça Benedito Calixto, s/n",
    "Pinheiros",
  ),
];

const porId = (id: string) => LUGARES_EXEMPLO.find((l) => l.id === id)!;

export const PINS_EXEMPLO: MapaPin[] = [
  {
    lugar: porId(ID.aurora),
    role_ativo: {
      id: ID.roleAurora,
      titulo: "Selo aberto no rooftop",
      categoria: "Balada",
      data_inicio: emHoras(-1),
      data_fim: emHoras(5),
      frescor: "live",
    },
    total_comentarios: 4,
  },
  {
    lugar: porId(ID.boteco),
    role_ativo: {
      id: ID.roleBoteco,
      titulo: "Samba de quinta no boteco",
      categoria: "Bar",
      data_inicio: emHoras(-2),
      data_fim: emHoras(3),
      frescor: "warm",
    },
    total_comentarios: 1,
  },
  {
    lugar: porId(ID.garagem),
    role_ativo: {
      id: ID.roleGaragem,
      titulo: "Sarau na garagem",
      categoria: "Sarau",
      data_inicio: emHoras(1),
      data_fim: emHoras(4),
      frescor: "new",
    },
    total_comentarios: 0,
  },
  { lugar: porId(ID.casa47), role_ativo: null, total_comentarios: 2 },
  { lugar: porId(ID.cru), role_ativo: null, total_comentarios: 0 },
];

export const COMENTARIOS_EXEMPLO: ComentarioResumo[] = [
  {
    autor_nome: "Marina",
    texto: "chegou banda nova, tá cheio mas cabe",
    created_at: emHoras(-0.4),
  },
  { autor_nome: "Rafa", texto: "fila andando rápido", created_at: emHoras(-0.7) },
];

export function roleExemplo(id: string): RolePublic | null {
  const encontrado = ROLES_EXEMPLO.find((r) => r.id === id);
  if (!encontrado) return null;
  const pin = PINS_EXEMPLO.find((p) => p.role_ativo?.id === id);
  return {
    id: encontrado.id,
    lugar_id: pin?.lugar.id ?? ID.aurora,
    titulo: encontrado.titulo,
    categoria: encontrado.categoria,
    data_inicio: encontrado.data_inicio,
    data_fim: encontrado.data_fim,
    frescor: encontrado.frescor,
    created_at: emHoras(-6),
    descricao: MOTIVO_EXEMPLO[id] ?? null,
    sinais_recentes: encontrado.frescor === "live" ? 6 : encontrado.frescor === "warm" ? 2 : 0,
  };
}

export function lugarDetalheExemplo(id: string): LugarDetalhe | null {
  const l = LUGARES_EXEMPLO.find((x) => x.id === id);
  if (!l) return null;
  const pin = PINS_EXEMPLO.find((p) => p.lugar.id === id);
  return {
    ...l,
    frescor: pin?.role_ativo?.frescor ?? null,
    comentarios_recentes: pin && pin.total_comentarios > 0 ? COMENTARIOS_EXEMPLO : [],
  };
}

/** Os lugares do caderninho. Depende de auth, que ainda não existe no front (fase 3). */
export const SALVOS_EXEMPLO = [
  ID.aurora,
  ID.garagem,
  ID.boteco,
  ID.casa47,
  ID.praca,
  ID.cru,
].map((id) => porId(id));

/* ---------------------------- Conexões ---------------------------------- */

export const CONEXOES_EXEMPLO: Conexao[] = [
  { id: "c1", nome: "Marina", status: "aceita", created_at: emHoras(-2000) },
  { id: "c2", nome: "Rafa", status: "aceita", created_at: emHoras(-1800) },
  { id: "c3", nome: "Bia", status: "aceita", created_at: emHoras(-1500) },
  { id: "c4", nome: "Nina", status: "aceita", created_at: emHoras(-900) },
  { id: "c5", nome: "Caio", status: "aceita", created_at: emHoras(-700) },
  { id: "c6", nome: "Duda", status: "aceita", created_at: emHoras(-400) },
  { id: "c7", nome: "Ju", status: "aceita", created_at: emHoras(-200) },
  { id: "c8", nome: "Téo", status: "pendente", created_at: emHoras(-3) },
];

/** Quem está fora agora. Bia é o check-in de bairro — sem lugar exato. */
export const FORA_AGORA_EXEMPLO: CheckInDeConexao[] = [
  {
    id: "k1",
    conexao_id: "c1",
    nome: "Marina",
    lugar_id: ID.aurora,
    lugar_nome: "Bar Aurora",
    bairro: BAIRRO_EXEMPLO,
    role_id: ID.roleAurora,
    role_titulo: "Selo aberto no rooftop",
    frescor: "live",
    timestamp: emHoras(-0.2),
  },
  {
    id: "k2",
    conexao_id: "c2",
    nome: "Rafa",
    lugar_id: ID.boteco,
    lugar_nome: "Boteco do Zé",
    bairro: BAIRRO_EXEMPLO,
    role_id: ID.roleBoteco,
    role_titulo: "Samba de quinta",
    frescor: "warm",
    timestamp: emHoras(-0.63),
  },
  {
    id: "k3",
    conexao_id: "c3",
    nome: "Bia",
    lugar_id: null,
    lugar_nome: null,
    bairro: BAIRRO_EXEMPLO,
    role_id: null,
    role_titulo: null,
    frescor: null,
    timestamp: emHoras(-0.07),
  },
];

/** A peça que serve à descoberta: lugares salvos por quem você confia. */
export const SALVOS_CONEXOES_EXEMPLO: SalvoDeConexao[] = [
  { lugar: porId(ID.cru), por: ["Marina"] },
  { lugar: porId(ID.casa47), por: ["Rafa", "Bia"] },
  { lugar: porId(ID.praca), por: ["Marina"] },
  { lugar: porId(ID.garagem), por: ["Rafa"] },
];

/** O que a aba mostra quando você ainda não tem conexão nenhuma. */
export const SALVOS_DO_CURADOR_EXEMPLO = [ID.cru, ID.casa47, ID.praca].map((id) => porId(id));
