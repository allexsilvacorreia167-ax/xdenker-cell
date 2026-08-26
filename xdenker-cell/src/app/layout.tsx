import VisitTracker from "@/components/VisitTracker";

import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  metadataBase: new URL("https://cell.xdenker.com.br"),
  title: "XDENKER CELL | Tecnologia de Ponta",
  description: "Celulares, computadores e acessórios com os melhores preços de Fortaleza. iPhone, Android, MacBook, PC Gamer e muito mais.",
  icons: {
    icon: "/favicon.ico",
  },
  openGraph: {
    title: "XDENKER CELL | Tecnologia de Ponta",
    description: "Celulares, computadores e acessórios com os melhores preços de Fortaleza.",
    url: "https://cell.xdenker.com.br",
    siteName: "XDENKER CELL",
    images: [
      {
        url: "/opengraph-image.png",
        width: 1200,
        height: 630,
      },
    ],
    locale: "pt_BR",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "XDENKER CELL | Tecnologia de Ponta",
    description: "Celulares, computadores e acessórios com os melhores preços de Fortaleza.",
    images: ["/opengraph-image.png"],
  },
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