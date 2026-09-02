import { describe, expect, it } from "vitest";
import { BAIRROS } from "./bairros";
import {
  RAIO_A_PE_M,
  RAIO_DENTRO_M,
  distanciaLegivel,
  interpretar,
  minutosAPe,
} from "./localizacao";
import type { LugarProximo } from "./types";

const atendido = BAIRROS[0].nome;

function proximo(bairro: string, distancia_m: number): LugarProximo {
  return {
    lugar: {
      id: `id-${bairro}-${distancia_m}`,
      nome: `Lugar em ${bairro}`,
      categoria: "bar",
      lat: -23.5,
      lng: -46.6,
      bairro,
      endereco: null,
      descricao: null,
      instagram: null,
      horario_funcionamento: null,
      horarios: null,
      programacao: null,
      preco_longneck: null,
      preco_visto_em: null,
      raio_metros: null,
      estabelecimento_id: null,
      fotos: null,
      tags: null,
      created_at: "2026-09-01T00:00:00Z",
    },
    // `interpretar` não lê este campo, mas o tipo exige — e preencher com null é mais
    // honesto que um `as` que esconderia a divergência no dia em que ela importar.
    role_ativo: null,
    distancia_m,
  };
}

describe("interpretar", () => {
  /**
   * A regra que mais custa errar aqui, e ela é de produto, não de geometria: o banco tem
   * lugares de recortes que o app **não atende** — os fictícios da Vila Madalena, por
   * exemplo. Sugerir um deles deixaria a pessoa num bairro sem curadoria, decidindo sair
   * com base em dado inventado.
   */
  it("ignora lugares de bairro que o app não atende", () => {
    const achado = interpretar([
      proximo("Bairro Inexistente", 100),
      proximo(atendido, 5000),
    ]);
    expect(achado.bairro).toBe(atendido);
    expect(achado.distancia_m).toBe(5000);
  });

  it("devolve nada quando só há bairro não atendido", () => {
    const achado = interpretar([proximo("Bairro Inexistente", 50)]);
    expect(achado.bairro).toBeNull();
    expect(achado.distancia_m).toBeNull();
    expect(achado.proximidade).toBe("longe");
    expect(achado.lugares).toEqual([]);
  });

  it("devolve nada com lista vazia", () => {
    expect(interpretar([]).proximidade).toBe("longe");
  });

  /**
   * Os dois limiares separam três respostas diferentes da tela. O primeiro nasceu como
   * 1500 m de chute de escritório e caiu para 700 m no primeiro teste em aparelho real —
   * a tela dizia "VOCÊ ESTÁ AQUI" para alguém a 17 minutos de caminhada.
   */
  describe("os três níveis de proximidade", () => {
    it("dentro do raio curto é 'aqui'", () => {
      expect(interpretar([proximo(atendido, RAIO_DENTRO_M - 1)]).proximidade).toBe("aqui");
    });

    it("no limite exato ainda é 'aqui'", () => {
      expect(interpretar([proximo(atendido, RAIO_DENTRO_M)]).proximidade).toBe("aqui");
    });

    it("um metro além do curto já é 'a-pe'", () => {
      expect(interpretar([proximo(atendido, RAIO_DENTRO_M + 1)]).proximidade).toBe("a-pe");
    });

    it("no limite da caminhada ainda é 'a-pe'", () => {
      expect(interpretar([proximo(atendido, RAIO_A_PE_M)]).proximidade).toBe("a-pe");
    });

    it("além da caminhada é 'longe'", () => {
      expect(interpretar([proximo(atendido, RAIO_A_PE_M + 1)]).proximidade).toBe("longe");
    });
  });

  it("devolve no máximo três lugares, para a tela não virar lista", () => {
    const achado = interpretar([
      proximo(atendido, 100),
      proximo(atendido, 200),
      proximo(atendido, 300),
      proximo(atendido, 400),
    ]);
    expect(achado.lugares).toHaveLength(3);
  });

  it("usa o primeiro atendido como referência — a API já devolve ordenado", () => {
    const achado = interpretar([proximo(atendido, 120), proximo(atendido, 900)]);
    expect(achado.distancia_m).toBe(120);
  });
});

describe("distanciaLegivel", () => {
  it("usa metros abaixo de 1 km, arredondando à dezena", () => {
    expect(distanciaLegivel(342)).toBe("340 m");
    expect(distanciaLegivel(999)).toBe("1000 m");
  });

  it("vira km a partir de 1000 m, com vírgula decimal", () => {
    expect(distanciaLegivel(1000)).toBe("1,0 km");
    expect(distanciaLegivel(4520)).toBe("4,5 km");
  });

  /** Acima de 10 km a casa decimal não ajuda a decidir nada e só polui. */
  it("perde a casa decimal a partir de 10 km", () => {
    expect(distanciaLegivel(12400)).toBe("12 km");
  });
});

describe("minutosAPe", () => {
  it("converte a ~5 km/h", () => {
    expect(minutosAPe(830)).toBe(10);
    expect(minutosAPe(4150)).toBe(50);
  });

  /** Nunca zero: "0 min a pé" leria como erro, e a distância mínima ainda é um passo. */
  it("nunca devolve zero", () => {
    expect(minutosAPe(0)).toBe(1);
    expect(minutosAPe(10)).toBe(1);
  });
});
