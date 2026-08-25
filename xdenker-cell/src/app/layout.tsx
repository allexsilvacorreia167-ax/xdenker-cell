import VisitTracker from "@/components/VisitTracker";

import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "XDENKER CELL | Tecnologia de Ponta",
  description: "Loja de celulares, computadores, acessórios e PCs gamer. XDENKER CELL.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="pt-BR">
      <head>
        <link
          href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="antialiased min-h-screen text-white relative">
        {/* Fundo fixo - Desktop */}
        <div
          className="fixed inset-0 -z-10 hidden lg:block bg-cover bg-center bg-no-repeat"
          style={{ backgroundImage: "url('/backgrounds/home-bg-desktop.jpg')" }}
        />
        {/* Fundo fixo - Mobile */}
        <div
          className="fixed inset-0 -z-10 block lg:hidden bg-cover bg-center bg-no-repeat"
          style={{ backgroundImage: "url('/backgrounds/home-bg-mobile.jpg')" }}
        />
        {/* Overlay escuro para legibilidade do texto */}
        <div className="fixed inset-0 -z-10 bg-black/55" />

        {children}

        <VisitTracker />
      </body>
    </html>
  );
}