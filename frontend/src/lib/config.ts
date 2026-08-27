/**
 * O bairro do piloto — o recorte que o app realmente consulta na API.
 *
 * Recorte: **República**, no eixo Largo do Arouche / Av. Vieira de Carvalho / Praça
 * da República. Escolhido por densidade noturna real, por dar pra atravessar a pé em
 * ~10 min e por ter metrô na porta (ver item R1 do TODO da raiz).
 *
 * Deliberadamente separado de `BAIRRO_EXEMPLO` em `fixtures.ts`, que é Vila Madalena
 * fictícia: os dados de exemplo precisam continuar reconhecíveis como inventados, para
 * que ninguém mostre lugar imaginário a um dono de casa. Quando a API responde, o app
 * usa esta constante; quando cai em exemplo, usa o bairro do próprio exemplo — e a
 * faixa de aviso explica que é dado falso.
 *
 * Vira `localStorage` + escolha no onboarding (telas 2a/2b) quando houver mais de um
 * bairro. Enquanto é um só, constante é mais honesto que um seletor de uma opção.
 *
 * `NEXT_PUBLIC_BAIRRO` sobrescreve — serve para desenvolver contra o seed fictício
 * (`NEXT_PUBLIC_BAIRRO="Vila Madalena" npm run dev`) enquanto o recorte real ainda
 * não tem curadoria. É configuração, não dado inventado: o que a tela mostra continua
 * vindo da API.
 */
export const BAIRRO_PILOTO = process.env.NEXT_PUBLIC_BAIRRO ?? "República";
