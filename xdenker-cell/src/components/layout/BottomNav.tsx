"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { Home, Smartphone, ShoppingCart, User } from "lucide-react";
import { supabase } from "@/lib/supabase";

export default function BottomNav() {
  const pathname = usePathname();
  const [loggedIn, setLoggedIn] = useState(false);

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => setLoggedIn(!!data.user));

    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
      setLoggedIn(!!session?.user);
    });

    return () => listener.subscription.unsubscribe();
  }, []);

  const items = [
    { href: "/", label: "Home", icon: Home },
    { href: "/celulares", label: "Celulares", icon: Smartphone },
    { href: "/carrinho", label: "Carrinho", icon: ShoppingCart },
    { href: loggedIn ? "/conta" : "/login", label: "Conta", icon: User },
  ];

  return (
    <nav className="lg:hidden fixed bottom-4 left-4 right-4 z-50">
      <div className="nav-pill flex items-center justify-between px-6 py-3 rounded-full max-w-md mx-auto shadow-lg shadow-black/30">
        {items.map(({ href, label, icon: Icon }) => {
          const active = pathname === href;
          return (
            <Link
              key={href}
              href={href}
              className={`flex flex-col items-center gap-0.5 transition ${active ? "text-blue-300" : "text-gray-400 hover:text-white"
                }`}
            >
              <Icon className="w-5 h-5" fill={active ? "currentColor" : "none"} />
              <span className="text-[10px] font-medium">{label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}