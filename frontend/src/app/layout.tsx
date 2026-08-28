import type { Metadata, Viewport } from "next";
import { Anton, Inter } from "next/font/google";
import { RegistrarSW } from "@/components/ui/registrar-sw";
import "./globals.css";

const anton = Anton({
  variable: "--font-anton",
  subsets: ["latin", "latin-ext"],
  weight: "400",
  display: "swap",
});

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
  themeColor: "#08060f",
  colorScheme: "dark",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="pt-BR" className={`${anton.variable} ${inter.variable} h-full`}>
      <body className="min-h-full">
        {children}
        <RegistrarSW />
      </body>
    </html>
  );
}
