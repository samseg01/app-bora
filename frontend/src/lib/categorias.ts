/**
 * O vocabulário de categoria — e ele descreve o **lugar**, não o rolê.
 *
 * Antes os botões estavam no formulário de rolê e o lugar tinha campo de texto livre, o
 * que produzia o que se via no banco: o Bar do China cadastrado como "forró" e o rolê de
 * lá publicado como "Bar". Duas categorias para a mesma coisa, e o card mostrando a do
 * rolê. Categoria é o que o lugar **é**: um boteco continua boteco em qualquer noite. O
 * que muda de uma noite para outra é o rolê, e isso quem conta é o título e o motivo pra
 * ir — não um rótulo.
 *
 * A ordem é deliberada e responde ao item 33 do TODO: o design partiu de Balada, Bar,
 * Sarau e Show ao vivo, tudo do topo da escada. Boteco, feira e praça vêm primeiro aqui
 * porque são a base que o `conceito.md` diz querer atender — e uma lista onde eles
 * aparecem por último conta outra história para quem cadastra.
 *
 * Lista fechada de propósito: é o que faz o filtro do mapa e a leitura do card serem
 * consistentes. Se o trabalho de campo do R3 encontrar um lugar que não cabe em nenhuma,
 * a resposta é discutir a lista, não abrir texto livre de volta.
 */
export const CATEGORIAS_LUGAR = [
  "Boteco",
  "Bar",
  "Feira",
  "Praça",
  "Sarau",
  "Galeria",
  "Casa de show",
  "Balada",
] as const;

export type CategoriaLugar = (typeof CATEGORIAS_LUGAR)[number];
