import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import { RegistrarSW } from "@/components/ui/registrar-sw";
import "./globals.css";

/* Uma família só, e é decisão de sistema, não economia: o monocromático faz
   hierarquia por peso, tamanho e régua, então uma segunda fonte não teria
   trabalho a fazer — e num app de descoberta espontânea o primeiro
   carregamento é onde se ganha ou se perde alguém.
   Passaram por aqui em 02/09 e saíram: Instrument Serif (bonita, mas serifa
   briga com a régua suíça), Space Grotesk e Archivo (personalidade a mais),
   Anton (o grito do sistema antigo). */
const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin", "latin-ext"],
  weight: ["400", "500", "600", "700"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "Bora? — o rolê de hoje, perto de você",
  description:
    "O que está rolando agora no seu bairro — não o que você já conhece. Curadoria de campo, a pé.",
  // O iOS ignora o manifest para o ícone da tela inicial e usa este.
  appleWebApp: { capable: true, title: "Bora?", statusBarStyle: "black-translucent" },
  icons: { apple: "/icons/apple-touch-icon.png" },
};

export const viewport: Viewport = {
  themeColor: "#000000",
  colorScheme: "dark",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="pt-BR" className={`${inter.variable} h-full`}>
      <body className="min-h-full">
        {children}
        <RegistrarSW />
      </body>
    </html>
  );
}
