"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { X, Home, Smartphone, Laptop, LifeBuoy, User, LogOut, ShoppingCart } from "lucide-react";
import { supabase } from "@/lib/supabase";

export default function MobileMenu({ open, onClose }: { open: boolean; onClose: () => void }) {
    const [loggedIn, setLoggedIn] = useState(false);

    useEffect(() => {
        supabase.auth.getUser().then(({ data }) => setLoggedIn(!!data.user));
    }, []);

    async function handleLogout() {
        await supabase.auth.signOut();
        onClose();
        window.location.href = "/";
    }

    if (!open) return null;

    const links = [
        { href: "/", label: "Home", icon: Home },
        { href: "/celulares", label: "Celulares", icon: Smartphone },
        { href: "/computadores", label: "Computadores", icon: Laptop },
        { href: "/suporte", label: "Suporte", icon: LifeBuoy },
        { href: "/carrinho", label: "Carrinho", icon: ShoppingCart },
        { href: loggedIn ? "/conta" : "/login", label: loggedIn ? "Minha Conta" : "Login", icon: User },
    ];

    return (
        <div className="fixed inset-0 z-[100] lg:hidden">
            <div className="absolute inset-0 bg-black/60" onClick={onClose} />
            <div className="absolute left-0 top-0 bottom-0 w-72 glass-strong p-5 flex flex-col">
                <div className="flex items-center justify-between mb-8">
                    <div className="flex items-center gap-2">
                        <div className="w-9 h-9 rounded-full bg-gradient-to-br from-blue-500 to-cyan-400 flex items-center justify-center font-bold text-sm">
                            X
                        </div>
                        <div className="leading-tight">
                            <div className="font-bold text-sm">XDENKER</div>
                            <div className="text-[10px] text-cyan-400 -mt-0.5">CELL</div>
                        </div>
                    </div>
                    <button onClick={onClose} className="w-9 h-9 rounded-full glass flex items-center justify-center">
                        <X className="w-4 h-4" />
                    </button>
                </div>

                <nav className="flex-1 space-y-1">
                    {links.map(({ href, label, icon: Icon }) => (
                        <Link
                            key={href}
                            href={href}
                            onClick={onClose}
                            className="flex items-center gap-3 px-3 py-3 rounded-xl text-sm font-medium text-gray-200 hover:bg-white/5 transition"
                        >
                            <Icon className="w-5 h-5 text-cyan-400" />
                            {label}
                        </Link>
                    ))}
                </nav>

                {loggedIn && (
                    <button
                        onClick={handleLogout}
                        className="flex items-center gap-3 px-3 py-3 rounded-xl text-sm font-medium text-red-400 hover:bg-red-500/10 transition"
                    >
                        <LogOut className="w-5 h-5" />
                        Sair
                    </button>
                )}
            </div>
        </div>
    );
}