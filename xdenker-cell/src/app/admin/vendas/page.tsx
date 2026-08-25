"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { supabase } from "@/lib/supabase";
import AdminHeader from "@/components/admin/AdminHeader";
import { Package, Truck, CheckCircle2, Clock, CreditCard } from "lucide-react";

type Order = {
    id: string;
    total: number;
    status: string;
    source: string;
    created_at: string;
    shipping_address: { city?: string; state?: string } | null;
};

const columns = [
    { key: "pending", label: "Aguardando Pagamento", icon: Clock, color: "text-amber-400" },
    { key: "paid", label: "Pagamento Confirmado", icon: CreditCard, color: "text-blue-400" },
    { key: "separating", label: "Separando no Estoque", icon: Package, color: "text-purple-400" },
    { key: "shipped", label: "Enviado", icon: Truck, color: "text-cyan-400" },
    { key: "delivered", label: "Entregue", icon: CheckCircle2, color: "text-emerald-400" },
];

function formatPrice(value: number) {
    return value.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

export default function AdminVendasPage() {
    const [orders, setOrders] = useState<Order[]>([]);
    const [loading, setLoading] = useState(true);
    const [onlineToday, setOnlineToday] = useState(0);
    const [physicalToday, setPhysicalToday] = useState(0);

    async function load() {
        setLoading(true);

        const { data } = await supabase
            .from("orders")
            .select("id, total, status, source, created_at, shipping_address")
            .not("status", "in", "(cancelled,refunded)")
            .order("created_at", { ascending: false });

        setOrders((data as Order[]) ?? []);

        const startOfDay = new Date();
        startOfDay.setHours(0, 0, 0, 0);

        const { data: todayOrders } = await supabase
            .from("orders")
            .select("total, source")
            .eq("status", "paid")
            .gte("created_at", startOfDay.toISOString());

        const online = (todayOrders ?? []).filter((o) => o.source === "online").reduce((s, o) => s + o.total, 0);
        const physical = (todayOrders ?? []).filter((o) => o.source === "pdv").reduce((s, o) => s + o.total, 0);
        setOnlineToday(online);
        setPhysicalToday(physical);

        setLoading(false);
    }

    useEffect(() => {
        load();
    }, []);

    return (
        <div>
            <AdminHeader title="Vendas Online" range={30} onRangeChange={() => { }} />

            <div className="p-6 lg:p-8">
                <div className="grid sm:grid-cols-2 gap-4 mb-8">
                    <div className="glass rounded-2xl p-5">
                        <div className="text-xs text-gray-400 mb-1">Faturamento E-commerce Hoje</div>
                        <div className="text-2xl font-bold text-cyan-400">{formatPrice(onlineToday)}</div>
                    </div>
                    <div className="glass rounded-2xl p-5">
                        <div className="text-xs text-gray-400 mb-1">Faturamento Loja Física (PDV) Hoje</div>
                        <div className="text-2xl font-bold text-white">{formatPrice(physicalToday)}</div>
                    </div>
                </div>

                {loading ? (
                    <p className="text-gray-400 text-sm">Carregando...</p>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-3 xl:grid-cols-5 gap-4">
                        {columns.map((col) => {
                            const colOrders = orders.filter((o) => o.status === col.key);
                            return (
                                <div key={col.key} className="glass rounded-2xl p-4">
                                    <div className="flex items-center gap-2 mb-4">
                                        <col.icon className={`w-4 h-4 ${col.color}`} />
                                        <h2 className="text-sm font-semibold text-white">{col.label}</h2>
                                        <span className="text-xs text-gray-500 ml-auto">{colOrders.length}</span>
                                    </div>

                                    <div className="space-y-2 max-h-[600px] overflow-y-auto">
                                        {colOrders.length === 0 ? (
                                            <p className="text-xs text-gray-600 text-center py-4">Nenhum pedido</p>
                                        ) : (
                                            colOrders.map((order) => (
                                                <Link
                                                    key={order.id}
                                                    href={`/admin/vendas/${order.id}`}
                                                    className="block glass rounded-xl p-3 hover:border-cyan-400/40 transition"
                                                >
                                                    <div className="flex items-center justify-between mb-1">
                                                        <span className="text-xs font-mono text-gray-400">#{order.id.slice(0, 8)}</span>
                                                        {order.source === "pdv" && (
                                                            <span className="text-[9px] px-1.5 py-0.5 rounded-full bg-purple-500/20 text-purple-300">
                                                                PDV
                                                            </span>
                                                        )}
                                                    </div>
                                                    <div className="text-sm font-semibold text-cyan-400">{formatPrice(order.total)}</div>
                                                    {order.shipping_address?.city && (
                                                        <div className="text-[11px] text-gray-500 mt-1">
                                                            {order.shipping_address.city}/{order.shipping_address.state}
                                                        </div>
                                                    )}
                                                    <div className="text-[10px] text-gray-600 mt-1">
                                                        {new Date(order.created_at).toLocaleDateString("pt-BR")}
                                                    </div>
                                                </Link>
                                            ))
                                        )}
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>
        </div>
    );
}