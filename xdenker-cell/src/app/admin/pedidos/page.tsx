"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";

type Order = {
    id: string;
    user_id: string | null;
    status: string;
    total: number;
    items: { name: string; quantity: number; variant?: string }[];
    shipping_address: Record<string, string> | null;
    payment_method: string | null;
    created_at: string;
};

type Profile = { id: string; email: string; full_name: string };

const statusOptions = ["pending", "paid", "shipped", "delivered", "cancelled"];
const statusLabel: Record<string, string> = {
    pending: "Pendente",
    paid: "Pago",
    shipped: "Enviado",
    delivered: "Entregue",
    cancelled: "Cancelado",
};

function formatPrice(value: number) {
    return value.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

export default function AdminPedidosPage() {
    const [orders, setOrders] = useState<Order[]>([]);
    const [profiles, setProfiles] = useState<Record<string, Profile>>({});
    const [expanded, setExpanded] = useState<string | null>(null);
    const [loading, setLoading] = useState(true);

    async function load() {
        const { data: ordersData } = await supabase
            .from("orders")
            .select("*")
            .order("created_at", { ascending: false });

        const list = (ordersData as Order[]) ?? [];
        setOrders(list);

        const userIds = Array.from(new Set(list.map((o) => o.user_id).filter(Boolean))) as string[];
        if (userIds.length > 0) {
            const { data: profilesData } = await supabase
                .from("profiles")
                .select("id, email, full_name")
                .in("id", userIds);
            const map: Record<string, Profile> = {};
            (profilesData as Profile[] | null)?.forEach((p) => (map[p.id] = p));
            setProfiles(map);
        }

        setLoading(false);
    }

    useEffect(() => {
        load();
    }, []);

    async function updateStatus(orderId: string, status: string) {
        await supabase.from("orders").update({ status }).eq("id", orderId);
        setOrders((prev) => prev.map((o) => (o.id === orderId ? { ...o, status } : o)));
    }

    return (
        <div>
            <h1 className="text-2xl font-bold mb-6 text-white">Pedidos</h1>

            {loading ? (
                <p className="text-gray-400 text-sm">Carregando...</p>
            ) : orders.length === 0 ? (
                <div className="glass rounded-2xl p-8 text-center text-gray-400 text-sm">Nenhum pedido ainda.</div>
            ) : (
                <div className="space-y-3">
                    {orders.map((order) => {
                        const profile = order.user_id ? profiles[order.user_id] : null;
                        const open = expanded === order.id;
                        return (
                            <div key={order.id} className="glass rounded-2xl overflow-hidden">
                                <button
                                    onClick={() => setExpanded(open ? null : order.id)}
                                    className="w-full flex items-center justify-between px-5 py-4 text-left"
                                >
                                    <div>
                                        <div className="text-sm font-semibold">
                                            #{order.id.slice(0, 8)} — {profile?.full_name || profile?.email || "Cliente"}
                                        </div>
                                        <div className="text-xs text-gray-400">
                                            {new Date(order.created_at).toLocaleString("pt-BR")}
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-4">
                                        <span className="text-sm font-semibold text-cyan-400">{formatPrice(order.total)}</span>
                                        <select
                                            value={order.status}
                                            onClick={(e) => e.stopPropagation()}
                                            onChange={(e) => updateStatus(order.id, e.target.value)}
                                            className="glass rounded-full px-3 py-1.5 text-xs bg-transparent outline-none"
                                        >
                                            {statusOptions.map((s) => (
                                                <option key={s} value={s} className="bg-slate-900">
                                                    {statusLabel[s]}
                                                </option>
                                            ))}
                                        </select>
                                    </div>
                                </button>

                                {open && (
                                    <div className="px-5 pb-5 border-t border-white/5 pt-4 grid sm:grid-cols-2 gap-4 text-sm">
                                        <div>
                                            <div className="text-xs text-gray-400 mb-1 uppercase">Itens</div>
                                            {order.items?.map((item, i) => (
                                                <div key={i} className="text-gray-300">
                                                    {item.quantity}x {item.name} {item.variant ? `(${item.variant})` : ""}
                                                </div>
                                            ))}
                                            <div className="text-xs text-gray-400 mt-2">Pagamento: {order.payment_method ?? "-"}</div>
                                        </div>
                                        <div>
                                            <div className="text-xs text-gray-400 mb-1 uppercase">Cliente e Entrega</div>
                                            <div className="text-gray-300">{profile?.email}</div>
                                            {order.shipping_address && (
                                                <div className="text-gray-400 mt-1">
                                                    {order.shipping_address.street}, {order.shipping_address.number} —{" "}
                                                    {order.shipping_address.city}/{order.shipping_address.state}, {order.shipping_address.cep}
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                )}
                            </div>
                        );
                    })}
                </div>
            )}
        </div>
    );
}