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

/**
 * A cor de cada categoria — sistema novo de 02/09, sem referência no hi-fi.
 *
 * O hi-fi pintava as oito de âmbar, o que respondia "isto é uma categoria" e não
 * "qual". Como âmbar virou o frescor `warm`, nem daria para manter.
 *
 * **A matiz encoda a escada do `conceito.md`**, e isso é informação, não enfeite: as
 * quatro primeiras são a base que o produto quer atender e ficam em tons de terra; as
 * quatro últimas são o topo programado e ficam em tons frios. Quem cadastra vê a lista
 * inteira e lê o eixo sem ninguém explicar.
 *
 * **Todas são dessaturadas de propósito.** Categoria é permanente; frescor é agora. Ao
 * lado de `--color-live` elas precisam recuar — uma casa vazia com categoria vibrante
 * pareceria acesa, que é a mentira que o produto não pode contar. É a mesma regra que já
 * governava as tags.
 *
 * O fallback existe porque `Lugar.categoria` é `String(60)` livre no banco e a deriva já
 * aconteceu de verdade: "forró" e "Bar" com maiúscula convivem com "bar" minúsculo. A
 * comparação é sem caixa, e o que não bater fica neutro em vez de sumir.
 */
const CORES: Record<string, string> = {
  boteco: "text-cat-boteco",
  bar: "text-cat-bar",
  feira: "text-cat-feira",
  praça: "text-cat-praca",
  praca: "text-cat-praca",
  sarau: "text-cat-sarau",
  galeria: "text-cat-galeria",
  "casa de show": "text-cat-show",
  balada: "text-cat-balada",
};

function chave(categoria: string | null | undefined): string | null {
  if (!categoria) return null;
  const k = categoria.trim().toLowerCase();
  return k in CORES ? k : null;
}

/** Classe de cor do rótulo de categoria. Neutro quando a categoria não é do
    vocabulário — ver item 48 do TODO, que era dado real fora da lista. */
export function corDaCategoria(categoria: string | null | undefined): string {
  const k = chave(categoria);
  return k ? CORES[k] : "text-text-faint";
}

/**
 * O gradiente do bloco que fica no lugar da foto — a maior superfície de cor do card.
 *
 * Existe porque o rótulo de categoria sozinho colorava pouco: o card continuava
 * cinza com uma palavra colorida. Aqui a categoria vira a identidade visual do card
 * inteiro, e um lugar sem foto ainda diz de longe **que tipo de lugar é**.
 *
 * ⚠️ **As classes são escritas por extenso, e têm de continuar assim.** O Tailwind v4
 * varre o código-fonte procurando nomes de classe literais; uma montada em template
 * (`from-${cor}/45`) simplesmente não é gerada, e o bloco fica transparente sem erro
 * nenhum — nem no build, nem no lint. Foi o primeiro jeito que tentei aqui.
 *
 * As opacidades são baixas de propósito. Em cheio, oito cards de categorias
 * diferentes viram mostruário de tinta e a tela perde a hierarquia — o que precisa
 * saltar continua sendo o frescor, não a categoria.
 */
const GRADIENTES: Record<string, string> = {
  boteco: "from-cat-boteco/45 via-cat-boteco/15 to-pedra-funda",
  bar: "from-cat-bar/45 via-cat-bar/15 to-pedra-funda",
  feira: "from-cat-feira/45 via-cat-feira/15 to-pedra-funda",
  praça: "from-cat-praca/45 via-cat-praca/15 to-pedra-funda",
  praca: "from-cat-praca/45 via-cat-praca/15 to-pedra-funda",
  sarau: "from-cat-sarau/45 via-cat-sarau/15 to-pedra-funda",
  galeria: "from-cat-galeria/45 via-cat-galeria/15 to-pedra-funda",
  "casa de show": "from-cat-show/45 via-cat-show/15 to-pedra-funda",
  balada: "from-cat-balada/45 via-cat-balada/15 to-pedra-funda",
};

/** O gradiente do bloco-foto. Cinza quando a categoria não é do vocabulário — o
    card fica neutro em vez de inventar uma cor que não lhe pertence. */
export function gradienteDaCategoria(categoria: string | null | undefined): string {
  const k = chave(categoria);
  return k ? GRADIENTES[k] : "from-pedra to-pedra-funda";
}

/** A classe de FUNDO do pin no mapa, para lugar curado sem frescor. Cheia, não
    translúcida: um ponto de 10px com 45% de opacidade não é visto. */
const PINS: Record<string, string> = {
  boteco: "bg-cat-boteco",
  bar: "bg-cat-bar",
  feira: "bg-cat-feira",
  praça: "bg-cat-praca",
  praca: "bg-cat-praca",
  sarau: "bg-cat-sarau",
  galeria: "bg-cat-galeria",
  "casa de show": "bg-cat-show",
  balada: "bg-cat-balada",
};

/**
 * Cor do pin de um lugar curado que **não tem frescor**.
 *
 * Antes era um cinza só (`--color-pin-off`), e o mapa de um bairro sem rolê ficava
 * inteiro apagado — dizendo, sem querer, que não havia nada ali. Agora cada casa
 * mostra o que é, mesmo parada.
 *
 * A hierarquia continua de pé porque o frescor ganha em **três** eixos ao mesmo
 * tempo: cor mais saturada, tamanho maior (16px contra 10px) e o pulso. Cor sozinha
 * nunca foi o que separava os dois.
 */
export function pinDaCategoria(categoria: string | null | undefined): string {
  const k = chave(categoria);
  return k ? PINS[k] : "bg-pin-off";
}
