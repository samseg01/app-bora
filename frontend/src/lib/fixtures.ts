import type {
  ComentarioResumo,
  LugarDetalhe,
  MapaPin,
  RoleDescoberta,
  RolePublic,
} from "./types";

/**
 * Dado de desenvolvimento, usado **só** quando a API não responde, e só fora de produção.
 * Nada mais no app depende disto: salvos, perfil e o painel do curador passaram a
 * consumir a API de verdade, e conexões diz que não está pronta em vez de inventar gente.
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
    lugar_id: ID.aurora,
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
    lugar_id: ID.boteco,
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
    lugar_id: ID.garagem,
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
    // A ficha do lugar fica vazia no exemplo de propósito: ela existe para o dado de
    // campo, e inventar descrição e preço aqui é exatamente o que este arquivo não pode
    // fazer — ele já é a única ficção do app, e só em dev.
    descricao: null,
    instagram: null,
    horario_funcionamento: null,
    programacao: null,
    preco_longneck: null,
    preco_visto_em: null,
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
    descricao: encontrado.descricao,
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
