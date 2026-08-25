"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { getAdminSession, AdminRole } from "@/lib/adminAuth";
import { supabase } from "@/lib/supabase";
import {
    LayoutDashboard,
    Package,
    ShoppingBag,
    Users,
    MessageCircle,
    LogOut,
    BarChart3,
    Tag,
    Boxes,
    TrendingUp,
    Settings,
    Lock,
    Barcode,
    Scale,
    Wrench,
    Bell,
} from "lucide-react";

export default function AdminLayout({ children }: { children: React.ReactNode }) {
    const pathname = usePathname();
    const router = useRouter();
    const [checking, setChecking] = useState(true);
    const [authorized, setAuthorized] = useState(false);
    const [expanded, setExpanded] = useState(false);
    const [adminEmail, setAdminEmail] = useState<string | null>(null);
    const [role, setRole] = useState<AdminRole>("staff");

    useEffect(() => {
        if (pathname === "/admin/login") {
            setChecking(false);
            return;
        }
        getAdminSession().then((session) => {
            if (!session) {
                router.replace("/admin/login");
            } else {
                setAuthorized(true);
                setAdminEmail(session.user.email ?? null);
                setRole(session.role);
            }
            setChecking(false);
        });
    }, [pathname, router]);

    if (pathname === "/admin/login") return <>{children}</>;

    if (checking) {
        return (
            <div className="min-h-screen flex items-center justify-center text-gray-400 text-sm bg-slate-950">
                Verificando acesso...
            </div>
        );
    }

    if (!authorized) return null;

    const nav = [
        { href: "/admin", label: "Visão Geral", icon: LayoutDashboard, locked: false },
        { href: "/admin/analytics", label: "Análises", icon: BarChart3, locked: false },
        { href: "/admin/produtos", label: "Produtos", icon: Package, locked: false },
        { href: "/admin/ofertas", label: "Ofertas", icon: Tag, locked: false },
        { href: "/admin/estoque", label: "Estoque", icon: Boxes, locked: false },
        { href: "/admin/pedidos", label: "Pedidos", icon: ShoppingBag, locked: false },
        { href: "/admin/os", label: "Ordens de Serviço", icon: Wrench, locked: false },
        { href: "/admin/pdv", label: "PDV / Caixa", icon: Barcode, locked: false },
        { href: "/admin/vendas", label: "Vendas", icon: TrendingUp, locked: false },
        { href: "/admin/financeiro", label: "Balanço Financeiro", icon: Scale, locked: true },
        { href: "/admin/usuarios", label: "Usuários", icon: Users, locked: false },
        { href: "/admin/chat", label: "Chat", icon: MessageCircle, locked: false },
        { href: "/admin/notificacoes", label: "Notificações", icon: Bell, locked: false },
        { href: "/admin/avancado", label: "Config. Avançadas", icon: Settings, locked: true },
    ];

    async function handleLogout() {
        await supabase.auth.signOut();
        router.push("/admin/login");
    }

    return (
        <div className="min-h-screen flex bg-[#0b0f19]">
            <aside
                onMouseEnter={() => setExpanded(true)}
                onMouseLeave={() => setExpanded(false)}
                className={`flex-shrink-0 border-r border-white/5 flex flex-col py-4 transition-all duration-300 ease-in-out overflow-hidden ${expanded ? "w-60 px-3" : "w-[68px] px-2"
                    }`}
            >
                <div className="flex items-center gap-3 mb-6 px-1 h-9">
                    <div className="w-9 h-9 rounded-full bg-gradient-to-br from-blue-500 to-cyan-400 flex items-center justify-center font-bold flex-shrink-0 text-white">
                        X
                    </div>
                    <span className={`text-sm font-bold whitespace-nowrap transition-opacity duration-200 text-white ${expanded ? "opacity-100" : "opacity-0"}`}>
                        Admin
                    </span>
                </div>

                <nav className="flex-1 space-y-1 overflow-y-auto">
                    {nav.map(({ href, label, icon: Icon, locked }) => {
                        const active = pathname === href;
                        return (
                            <Link
                                key={href}
                                href={href}
                                title={label}
                                className={`flex items-center gap-3 px-2.5 py-2.5 rounded-xl text-sm font-medium transition-colors whitespace-nowrap ${active ? "bg-blue-500/20 text-blue-300" : "text-gray-400 hover:bg-white/5 hover:text-white"
                                    }`}
                            >
                                <Icon className="w-5 h-5 flex-shrink-0" />
                                <span className={`flex-1 flex items-center gap-1.5 transition-opacity duration-200 ${expanded ? "opacity-100" : "opacity-0"}`}>
                                    {label}
                                    {locked && <Lock className="w-3 h-3 text-amber-400 flex-shrink-0" />}
                                </span>
                            </Link>
                        );
                    })}
                </nav>

                <div className="border-t border-white/5 pt-3 mt-2">
                    {expanded && (
                        <div className="px-2.5 pb-2 text-[11px] text-gray-500 truncate">
                            {adminEmail}
                            {role === "master" && <span className="ml-1 text-amber-400">· Master</span>}
                        </div>
                    )}
                    <button
                        onClick={handleLogout}
                        title="Sair"
                        className="flex items-center gap-3 px-2.5 py-2.5 rounded-xl text-sm font-medium text-red-400 hover:bg-red-500/10 transition-colors whitespace-nowrap w-full cursor-pointer"
                    >
                        <LogOut className="w-5 h-5 flex-shrink-0" />
                        <span className={`transition-opacity duration-200 ${expanded ? "opacity-100" : "opacity-0"}`}>Sair</span>
                    </button>
                </div>
            </aside>

            <main className="flex-1 overflow-x-auto">{children}</main>
        </div>
    );
}