"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Header from "@/components/layout/Header";
import BottomNav from "@/components/layout/BottomNav";
import { supabase } from "@/lib/supabase";
import type { User } from "@supabase/supabase-js";
import { LogOut, Check, Wrench } from "lucide-react";
import AddressBook, { Address } from "@/components/ui/AddressBook";

type Order = {
    id: string;
    status: string;
    total: number;
    created_at: string;
};

export default function ContaPage() {
    const router = useRouter();
    const [user, setUser] = useState<User | null>(null);
    const [orders, setOrders] = useState<Order[]>([]);
    const [addresses, setAddresses] = useState<Address[]>([]);
    const [savingAddresses, setSavingAddresses] = useState(false);
    const [savedFlash, setSavedFlash] = useState(false);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        async function load() {
            const {
                data: { user },
            } = await supabase.auth.getUser();

            if (!user) {
                router.replace("/login");
                return;
            }

            setUser(user);
            setAddresses((user.user_metadata?.addresses as Address[]) || []);

            const { data } = await supabase
                .from("orders")
                .select("id, status, total, created_at")
                .eq("user_id", user.id)
                .order("created_at", { ascending: false });

            setOrders((data as Order[]) ?? []);
            setLoading(false);
        }
        load();
    }, [router]);

    async function handleLogout() {
        await supabase.auth.signOut();
        router.push("/");
        router.refresh();
    }

    async function handleAddressesChange(next: Address[]) {
        setAddresses(next);
        setSavingAddresses(true);
        const { error } = await supabase.auth.updateUser({
            data: { addresses: next },
        });
        setSavingAddresses(false);
        if (!error) {
            setSavedFlash(true);
            setTimeout(() => setSavedFlash(false), 2000);
        }
    }

    const statusLabel: Record<string, { label: string; color: string }> = {
        pending: { label: "Pendente", color: "text-amber-400" },
        paid: { label: "Pago", color: "text-emerald-400" },
        shipped: { label: "Enviado", color: "text-blue-400" },
        delivered: { label: "Entregue", color: "text-emerald-400" },
        cancelled: { label: "Cancelado", color: "text-red-400" },
    };

    if (loading) {
        return (
            <>
                <Header />
                <main className="px-4 py-10 max-w-2xl mx-auto text-center pb-28 text-gray-400 text-sm">
                    Carregando...
                </main>
                <BottomNav />
            </>
        );
    }

    return (
        <>
            <Header />
            <main className="px-4 lg:px-8 py-6 pb-28 lg:pb-12 max-w-2xl mx-auto">
                <div className="glass-strong rounded-2xl p-6 mb-6 flex items-center justify-between">
                    <div>
                        <h1 className="text-lg font-bold mb-1">
                            {(user?.user_metadata?.full_name as string) || "Minha Conta"}
                        </h1>
                        <p className="text-sm text-gray-400">{user?.email}</p>
                    </div>
                    <button
                        onClick={handleLogout}
                        className="glass px-4 py-2 rounded-full text-xs font-semibold border border-red-400/30 text-red-400 flex items-center gap-2"
                    >
                        <LogOut className="w-3.5 h-3.5" />
                        Sair
                    </button>
                </div>

                <Link
                    href="/conta/aparelhos"
                    className="glass rounded-2xl p-4 mb-6 flex items-center justify-between hover:border-cyan-400/40 transition"
                >
                    <span className="text-sm font-medium flex items-center gap-2">
                        <Wrench className="w-4 h-4 text-cyan-400" />
                        Meus Aparelhos / Ordens de Serviço
                    </span>
                    <span className="text-cyan-400 text-sm">Ver →</span>
                </Link>

                <div className="flex items-center justify-between mb-3">
                    <h2 className="text-sm font-semibold text-gray-300 uppercase tracking-wide">Meus Endereços</h2>
                    {savingAddresses && <span className="text-xs text-gray-500">Salvando...</span>}
                    {savedFlash && (
                        <span className="text-xs text-emerald-400 flex items-center gap-1">
                            <Check className="w-3 h-3" /> Salvo
                        </span>
                    )}
                </div>
                <div className="mb-8">
                    <AddressBook addresses={addresses} onChange={handleAddressesChange} />
                </div>

                <h2 className="text-sm font-semibold text-gray-300 mb-3 uppercase tracking-wide">Meus Pedidos</h2>
                {orders.length === 0 ? (
                    <div className="glass rounded-2xl p-8 text-center text-gray-400 text-sm">
                        Você ainda não fez nenhum pedido.
                    </div>
                ) : (
                    <div className="space-y-3">
                        {orders.map((order) => {
                            const status = statusLabel[order.status] ?? { label: order.status, color: "text-gray-400" };
                            return (
                                <Link
                                    key={order.id}
                                    href={`/conta/pedido/${order.id}`}
                                    className="glass rounded-2xl p-4 flex items-center justify-between hover:border-cyan-400/30 transition"
                                >
                                    <div>
                                        <div className="text-sm font-medium">Pedido #{order.id.slice(0, 8)}</div>
                                        <div className="text-xs text-gray-400">
                                            {new Date(order.created_at).toLocaleDateString("pt-BR")}
                                        </div>
                                        <Link
                                            href={`/conta/pedido/${order.id}/recibo`}
                                            className="text-xs text-cyan-400 hover:underline mt-1 inline-block"
                                        >
                                            Ver comprovante
                                        </Link>
                                    </div>
                                    <div className="text-right">
                                        <div className="text-sm font-semibold text-cyan-400">
                                            {order.total.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}
                                        </div>
                                        <div className={`text-xs font-medium ${status.color}`}>{status.label}</div>
                                    </div>
                                </Link>
                            );
                        })}
                    </div>
                )}
            </main>
            <BottomNav />
        </>
    );
}