import type { MetadataRoute } from "next";

/**
 * O manifest que torna o app instalável.
 *
 * Isto é o que o ADR-001 (`docs/adr/0001-pwa-agora-nativo-depois.md`) chama de "o PWA
 * é o produto até a validação": nativo é o destino, mas até lá é aqui que mora o ícone
 * na tela inicial e a abertura sem barra de navegador.
 *
 * `start_url` é `/`, não `/abertura`: quem instalou já escolheu bairro, e a home
 * redireciona sozinha para a abertura se o cookie não existir.
 *
 * O ícone é o pin magenta pulsando — o "acontecendo agora", que é a identidade do
 * produto. Sem palavra escrita de propósito: a marca é Anton condensado e rasterizar
 * uma fonte do sistema no lugar dela produziria um logotipo que não é o nosso.
 */
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Bora? — o rolê de hoje, perto de você",
    short_name: "Bora?",
    description:
      "O que está rolando agora no seu bairro — não o que você já conhece. Curadoria de campo, a pé.",
    start_url: "/",
    display: "standalone",
    orientation: "portrait",
    background_color: "#08060f",
    theme_color: "#08060f",
    lang: "pt-BR",
    categories: ["lifestyle", "entertainment", "social"],
    icons: [
      { src: "/icons/icon-192.png", sizes: "192x192", type: "image/png", purpose: "any" },
      { src: "/icons/icon-512.png", sizes: "512x512", type: "image/png", purpose: "any" },
      {
        // O Android recorta em círculo; esta versão tem margem de segurança e fundo
        // sangrando para não perder o pin na borda.
        src: "/icons/icon-maskable-512.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "maskable",
      },
    ],
  };
}
