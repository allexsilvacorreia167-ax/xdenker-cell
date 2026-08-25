"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { Search, Menu, ShoppingCart } from "lucide-react";
import { useCartStore } from "@/lib/store/cart";
import { supabase } from "@/lib/supabase";
import MobileMenu from "./MobileMenu";
import SearchOverlay from "./SearchOverlay";

export default function Header() {
  const totalItems = useCartStore((s) => s.totalItems());
  const [mounted, setMounted] = useState(false);
  const [loggedIn, setLoggedIn] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => setLoggedIn(!!data.user));

    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
      setLoggedIn(!!session?.user);
    });

    return () => listener.subscription.unsubscribe();
  }, []);

  const accountHref = loggedIn ? "/conta" : "/login";
  const accountLabel = loggedIn ? "Conta" : "Login";

  return (
    <>
      {/* Desktop Header */}
      <header className="hidden lg:flex items-center justify-between px-8 py-5 relative z-50">
        <Link href="/" className="flex items-center gap-2">
          <div className="w-12 h-12 rounded-full bg-gradient-to-br from-blue-500 to-cyan-400 flex items-center justify-center shadow-lg shadow-blue-500/30">
            <span className="font-bold text-lg">X</span>
          </div>
          <div className="leading-tight">
            <div className="font-bold text-lg tracking-wide">XDENKER</div>
            <div className="text-xs text-cyan-400 -mt-1">CELL</div>
          </div>
        </Link>

        <nav className="nav-pill flex items-center gap-1 px-2 py-1.5 rounded-full">
          <Link href="/" className="px-5 py-2 rounded-full text-sm font-medium bg-blue-500/20 text-blue-300">
            Home
          </Link>
          <Link href="/celulares" className="px-5 py-2 rounded-full text-sm font-medium text-gray-300 hover:text-white hover:bg-white/5 transition">
            Celulares
          </Link>
          <Link href="/computadores" className="px-5 py-2 rounded-full text-sm font-medium text-gray-300 hover:text-white hover:bg-white/5 transition">
            Computadores
          </Link>
          <Link href="/suporte" className="px-5 py-2 rounded-full text-sm font-medium text-gray-300 hover:text-white hover:bg-white/5 transition">
            Suporte
          </Link>
          <Link href={accountHref} className="px-5 py-2 rounded-full text-sm font-medium text-gray-300 hover:text-white hover:bg-white/5 transition">
            {accountLabel}
          </Link>
        </nav>

        <div className="flex items-center gap-3">
          <Link href="/carrinho" className="w-11 h-11 rounded-full glass flex items-center justify-center relative hover:border-blue-400/50 transition">
            <ShoppingCart className="w-5 h-5 text-cyan-300" />
            {mounted && totalItems > 0 && (
              <span className="absolute -top-1 -right-1 w-4 h-4 bg-blue-500 rounded-full text-[10px] flex items-center justify-center font-bold">
                {totalItems}
              </span>
            )}
          </Link>
          <button
            onClick={() => setSearchOpen(true)}
            className="w-11 h-11 rounded-full glass flex items-center justify-center hover:border-blue-400/50 transition"
          >
            <Search className="w-5 h-5 text-cyan-300" />
          </button>
        </div>
      </header>

      {/* Mobile Header */}
      <header className="lg:hidden flex items-center justify-between px-4 py-4 relative z-50">
        <button
          onClick={() => setMenuOpen(true)}
          className="w-10 h-10 rounded-full glass flex items-center justify-center"
        >
          <Menu className="w-5 h-5" />
        </button>

        <Link href="/" className="flex items-center gap-1.5">
          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-cyan-400 flex items-center justify-center text-sm font-bold">
            X
          </div>
          <div className="leading-tight">
            <div className="font-bold text-sm">XDENKER</div>
            <div className="text-[10px] text-cyan-400 -mt-0.5">CELL</div>
          </div>
        </Link>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setSearchOpen(true)}
            className="w-10 h-10 rounded-full glass flex items-center justify-center"
          >
            <Search className="w-5 h-5 text-cyan-300" />
          </button>
          <Link href="/carrinho" className="w-10 h-10 rounded-full glass flex items-center justify-center relative">
            <ShoppingCart className="w-5 h-5 text-cyan-300" />
            {mounted && totalItems > 0 && (
              <span className="absolute -top-1 -right-1 w-4 h-4 bg-blue-500 rounded-full text-[10px] flex items-center justify-center font-bold">
                {totalItems}
              </span>
            )}
          </Link>
        </div>
      </header>

      <MobileMenu open={menuOpen} onClose={() => setMenuOpen(false)} />
      <SearchOverlay open={searchOpen} onClose={() => setSearchOpen(false)} />
    </>
  );
}