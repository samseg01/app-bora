/**
 * O vocabulário de tags do **lugar**.
 *
 * `categoria` responde o que o lugar **é** — boteco, praça, casa de show — e é uma só.
 * Tag responde **como ele é por dentro**, e são várias. As duas não se substituem: um
 * boteco com mesa na calçada e um boteco sem são a mesma categoria e decisões diferentes
 * para quem está escolhendo aonde ir hoje.
 *
 * Lista fechada pelo mesmo motivo de `categorias.ts`: sem normalização, "forró", "Forró"
 * e "forro" viram três tags e nenhuma leitura fica consistente. Se o campo do R3 achar
 * algo que não cabe, a resposta é discutir a lista — não abrir texto livre.
 *
 * A ordem dos grupos é deliberada: **o que decide sair de casa vem primeiro.** Preço e
 * mesa na calçada decidem mais que o gênero musical, e uma lista que começa por "forró"
 * conta para quem cadastra que o app é sobre programação — que é justamente o topo da
 * escada do `conceito.md`, não a base que ele quer atender.
 *
 * Só exibição, por decisão: nada aqui filtra o mapa nem a descoberta. Quando houver
 * dezenas de lugares curados e o filtro fizer falta, o passo é um índice GIN na coluna
 * `lugar.tags`, sem mudar a forma do dado.
 */
export const TAGS_LUGAR = [
  // Bolso — o "vai caber?" que decide antes de qualquer outra coisa
  "Barato",
  "Sem couvert",

  // Corpo — como é estar lá
  "Mesa na calçada",
  "Ao ar livre",
  "Em pé",
  "Cabe grupo",
  "Sossegado",
  "Barulhento",

  // Cozinha
  "Tem comida",
  "Petisco",
  "Vegetariano",

  // Som — o topo da escada, de propósito por último
  "Música ao vivo",
  "Samba",
  "Forró",
  "Rock",
  "MPB",
  "Eletrônica",
  "DJ",

  // Quem cabe
  "LGBT+",
  "Pet friendly",
  "Acessível",
] as const;

export type TagLugar = (typeof TAGS_LUGAR)[number];

/** Quantas o curador pode marcar. O limite é de leitura, não de banco: uma ficha com
 *  quinze tags não descreve nada — o que descreve é a escolha do que deixar de fora. */
export const MAX_TAGS = 6;

/**
 * O que veio do banco pode não estar mais na lista (a lista muda, o dado gravado não).
 * Exibir assim mesmo: apagar da tela um dado que o curador escreveu em campo é pior que
 * mostrar uma tag fora do vocabulário atual.
 */
export function tagsDoLugar(tags: string[] | null | undefined): string[] {
  return tags?.filter((t) => t.trim().length > 0) ?? [];
}
