import { defineConfig } from "vitest/config";
import { fileURLToPath } from "node:url";

/**
 * Vitest sobre `lib/`, e só sobre `lib/` — por enquanto.
 *
 * Por que aqui e não em componente: `lib/` é onde a regra de negócio do frontend mora
 * por decisão de arquitetura (ver `CLAUDE.md`, "Partição mobile / desktop"), e são
 * funções puras — sem DOM, sem rede, sem React. Isso significa **zero setup de ambiente**:
 * nada de jsdom, nada de mock de fetch, nada de renderizar árvore. O custo de manter é
 * quase nulo, e é o que cobre o tipo de erro mais caro do projeto.
 *
 * O que isto NÃO cobre, e é preciso ter honestidade sobre: componente e fluxo. O bug do
 * ✓ branco dentro de um círculo branco não seria pego aqui — ele exige renderizar. Esse
 * degrau vem depois (item 50 do TODO), com jsdom ou Playwright.
 *
 * A extensão é `.mts`, não `.ts`: o `package.json` do Next não declara
 * `"type": "module"`, então um `.ts` aqui é carregado como CommonJS e o Vite avisa que
 * a sintaxe ESM vai parar de funcionar numa versão futura. Renomear é mais barato que
 * mexer no tipo de módulo do projeto inteiro.
 *
 * `environment: node` é deliberado: pedir jsdom sem precisar dele custa segundos em toda
 * execução e convida a escrever teste de componente sem a biblioteca certa.
 */
export default defineConfig({
  test: {
    environment: "node",
    include: ["src/lib/**/*.test.ts"],
    // O relógio real deixaria "aberta agora" verde ou vermelho conforme a hora em que a
    // suíte roda — os testes de tempo passam a data explicitamente, e é obrigatório.
    clearMocks: true,
  },
  resolve: {
    alias: {
      "@": fileURLToPath(new URL("./src", import.meta.url)),
    },
  },
});
