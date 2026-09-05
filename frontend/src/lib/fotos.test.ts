import { afterEach, describe, expect, it } from "vitest";
import { urlDaFoto } from "./fotos";

const ORIGINAL = process.env.NEXT_PUBLIC_API_URL;

function comApiEm(base: string | undefined) {
  if (base === undefined) delete process.env.NEXT_PUBLIC_API_URL;
  else process.env.NEXT_PUBLIC_API_URL = base;
}

afterEach(() => comApiEm(ORIGINAL));

describe("urlDaFoto", () => {
  it("em produção devolve o caminho intacto: front e back são a mesma origem", () => {
    comApiEm("/api/v1");
    expect(urlDaFoto("/fotos/ab12.jpg")).toBe("/fotos/ab12.jpg");
  });

  it("em desenvolvimento prefixa com a origem da API", () => {
    // Sem isto a foto some só na máquina de quem está construindo o upload, com um 404
    // que parece upload quebrado e é roteamento.
    comApiEm("http://192.168.15.63:8000/api/v1");
    expect(urlDaFoto("/fotos/ab12.jpg")).toBe("http://192.168.15.63:8000/fotos/ab12.jpg");
  });

  it("não mexe em URL completa — o campo aceita foto de fora desde antes do upload", () => {
    comApiEm("http://localhost:8000/api/v1");
    expect(urlDaFoto("https://exemplo.com/foto.jpg")).toBe("https://exemplo.com/foto.jpg");
    expect(urlDaFoto("//cdn.exemplo.com/f.jpg")).toBe("//cdn.exemplo.com/f.jpg");
  });

  it("trata ausência sem inventar: nulo, indefinido e vazio viram null", () => {
    comApiEm("/api/v1");
    expect(urlDaFoto(null)).toBeNull();
    expect(urlDaFoto(undefined)).toBeNull();
    expect(urlDaFoto("   ")).toBeNull();
  });

  it("devolve intacto o que não é caminho de raiz, em vez de chutar uma origem", () => {
    comApiEm("http://localhost:8000/api/v1");
    expect(urlDaFoto("foto.jpg")).toBe("foto.jpg");
  });

  it("base inválida não derruba a tela — a foto some, a ficha continua de pé", () => {
    comApiEm("http:// isto nao e url");
    expect(urlDaFoto("/fotos/ab12.jpg")).toBe("/fotos/ab12.jpg");
  });
});
