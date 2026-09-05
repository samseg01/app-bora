import { describe, expect, it } from "vitest";
import { ApiError, ApiOffline } from "./api";
import { porQueFalhou } from "./erros";

describe("porQueFalhou", () => {
  it("500 diz que é do servidor, e diz para NÃO procurar campo errado", () => {
    // O caso que originou a função: um AttributeError no backend virou "confere os
    // campos", e quem estava no formulário procurou o erro onde ele não estava.
    const frase = porQueFalhou(new ApiError(500, "Internal Server Error"));
    expect(frase).toContain("500");
    expect(frase).toContain("não é campo errado");
  });

  it("4xx repassa a mensagem do servidor, que é mais específica que a nossa", () => {
    const frase = porQueFalhou(new ApiError(415, "Esse arquivo não é JPEG, PNG nem WebP"));
    expect(frase).toContain("Esse arquivo não é JPEG");
    expect(frase).toContain("415");
  });

  it("401 e 403 têm resposta acionável, não o texto genérico", () => {
    expect(porQueFalhou(new ApiError(401, "Token inválido"))).toContain("sessão expirou");
    expect(porQueFalhou(new ApiError(403, "Sem permissão"))).toContain("não é de curador");
  });

  it("API fora do ar é distinta de erro HTTP", () => {
    expect(porQueFalhou(new ApiOffline(new Error("rede")))).toContain("Sem resposta da API");
  });

  it("erro desconhecido cai no genérico, com o verbo da ação", () => {
    expect(porQueFalhou(new Error("qualquer coisa"), "cadastrar")).toBe(
      "Não deu pra cadastrar. Tenta de novo.",
    );
  });
});
