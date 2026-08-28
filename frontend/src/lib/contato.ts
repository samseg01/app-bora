/**
 * Como uma sugestão chega ao curador.
 *
 * Deliberadamente **sem backend**. O `conceito.md` manda ir o mais longe possível no
 * manual — planilha, WhatsApp — antes da primeira linha de sistema, porque o campo
 * serve para descobrir qual é o processo antes de codificá-lo. Uma fila de sugestões no
 * banco hoje seria automatizar um processo que ninguém rodou ainda.
 *
 * E há uma razão de produto: **sugestão não é conteúdo, é pista.** Ela não pode virar um
 * lugar no app, porque aí entraria coisa que ninguém visitou — exatamente o que o
 * produto promete não fazer. Ela vira "vai lá ver esse aqui" para quem cura.
 *
 * Quando o volume justificar, isto vira uma entidade `Sugestao` e uma fila no painel do
 * curador. Até lá, um link.
 */

const WHATSAPP = process.env.NEXT_PUBLIC_CURADOR_WHATSAPP?.replace(/\D/g, "");
const EMAIL = process.env.NEXT_PUBLIC_CURADOR_EMAIL;

/**
 * O link para sugerir, ou null quando nenhum contato foi configurado — nesse caso a
 * interface não oferece o que não funciona.
 */
export function linkDeSugestao(bairro: string, lugar?: string): string | null {
  const assunto = "Sugestão de lugar pro Bora?";
  const texto = lugar
    ? `Oi! Queria sugerir um lugar em ${bairro} pro Bora?: ${lugar} — `
    : `Oi! Queria sugerir um lugar em ${bairro} pro Bora?: `;

  if (WHATSAPP) {
    return `https://wa.me/${WHATSAPP}?text=${encodeURIComponent(texto)}`;
  }
  if (EMAIL) {
    return `mailto:${EMAIL}?subject=${encodeURIComponent(assunto)}&body=${encodeURIComponent(texto)}`;
  }
  return null;
}
