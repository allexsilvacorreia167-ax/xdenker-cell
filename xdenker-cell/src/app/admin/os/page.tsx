"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { supabase } from "@/lib/supabase";
import AdminHeader from "@/components/admin/AdminHeader";
import { Plus } from "lucide-react";

type ServiceOrder = {
    id: string;
    customer_name: string;
    equipment: string;
    status: string;
    budget_value: number | null;
    created_at: string;
};

const statusLabel: Record<string, { label: string; color: string }> = {
    em_analise: { label: "Em Análise", color: "text-gray-400 bg-gray-500/10" },
    orcamento_disponivel: { label: "Orçamento Disponível", color: "text-amber-400 bg-amber-500/10" },
    em_manutencao: { label: "Em Manutenção", color: "text-blue-400 bg-blue-500/10" },
    pronto_para_retirada: { label: "Pronto para Retirada", color: "text-emerald-400 bg-emerald-500/10" },
    finalizado: { label: "Finalizado", color: "text-emerald-400 bg-emerald-500/10" },
    cancelado: { label: "Cancelado", color: "text-red-400 bg-red-500/10" },
    recusado: { label: "Recusado pelo Cliente", color: "text-red-400 bg-red-500/10" },
};

export default function AdminOsPage() {
    const [orders, setOrders] = useState<ServiceOrder[]>([]);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState<string>("all");

    useEffect(() => {
        async function load() {
            const { data } = await supabase
                .from("service_orders")
                .select("id, customer_name, equipment, status, budget_value, created_at")
                .order("created_at", { ascending: false });
            setOrders((data as ServiceOrder[]) ?? []);
            setLoading(false);
        }
        load();
    }, []);

    const filtered = filter === "all" ? orders : orders.filter((o) => o.status === filter);

    return (
        <div>
            <AdminHeader title="Ordens de Serviço" range={30} onRangeChange={() => { }} />
            <div className="p-6 lg:p-8">
                <div className="flex flex-wrap items-center justify-between gap-3 mb-6">
                    <div className="flex gap-2 overflow-x-auto scrollbar-hide">
                        <button
                            onClick={() => setFilter("all")}
                            className={`px-4 py-2 rounded-full text-xs font-medium whitespace-nowrap ${filter === "all" ? "bg-blue-500/20 text-blue-300 border border-blue-400/40" : "glass text-gray-300"
                                }`}
                        >
                            Todos
                        </button>
                        {Object.entries(statusLabel).map(([value, { label }]) => (
                            <button
                                key={value}
                                onClick={() => setFilter(value)}
                                className={`px-4 py-2 rounded-full text-xs font-medium whitespace-nowrap ${filter === value ? "bg-blue-500/20 text-blue-300 border border-blue-400/40" : "glass text-gray-300"
                                    }`}
                            >
                                {label}
                            </button>
                        ))}
                    </div>
                    <Link
                        href="/admin/os/nova"
                        className="glow-btn px-5 py-2.5 rounded-full text-sm font-semibold flex items-center gap-2 flex-shrink-0"
                    >
                        <Plus className="w-4 h-4" />
                        Nova OS
                    </Link>
                </div>

                {loading ? (
                    <p className="text-gray-400 text-sm">Carregando...</p>
                ) : filtered.length === 0 ? (
                    <div className="glass rounded-2xl p-10 text-center text-gray-400 text-sm">Nenhuma OS encontrada.</div>
                ) : (
                    <div className="glass rounded-2xl overflow-hidden">
                        <table className="w-full text-sm">
                            <thead>
                                <tr className="text-left text-gray-400 text-xs uppercase border-b border-white/5">
                                    <th className="px-4 py-3">Cliente</th>
                                    <th className="px-4 py-3">Equipamento</th>
                                    <th className="px-4 py-3">Orçamento</th>
                                    <th className="px-4 py-3">Status</th>
                                    <th className="px-4 py-3">Entrada</th>
                                </tr>
                            </thead>
                            <tbody>
                                {filtered.map((o) => {
                                    const s = statusLabel[o.status] ?? { label: o.status, color: "text-gray-400" };
                                    return (
                                        <tr key={o.id} className="border-b border-white/5 last:border-0 hover:bg-white/5">
                                            <td className="px-4 py-3">
                                                <Link href={`/admin/os/${o.id}`} className="text-white hover:text-cyan-300">
                                                    {o.customer_name}
                                                </Link>
                                            </td>
                                            <td className="px-4 py-3 text-gray-400">{o.equipment}</td>
                                            <td className="px-4 py-3">
                                                {o.budget_value ? o.budget_value.toLocaleString("pt-BR", { style: "currency", currency: "BRL" }) : "-"}
                                            </td>
                                            <td className="px-4 py-3">
                                                <span className={`text-xs px-2 py-1 rounded-full ${s.color}`}>{s.label}</span>
                                            </td>
                                            <td className="px-4 py-3 text-gray-500">
                                                {new Date(o.created_at).toLocaleDateString("pt-BR")}
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>
        </div>
    );
}