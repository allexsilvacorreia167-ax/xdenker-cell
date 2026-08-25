"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { DollarSign, ShoppingBag, Users, Clock } from "lucide-react";
import AdminHeader from "@/components/admin/AdminHeader";
import SalesChart from "@/components/admin/SalesChart";
import SalesTargetRings from "@/components/admin/SalesTargetRings";
import TopSellingProducts from "@/components/admin/TopSellingProducts";
import CurrentOffers from "@/components/admin/CurrentOffers";

function formatPrice(value: number) {
    return value.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

export default function AdminOverviewPage() {
    const [range, setRange] = useState(30);
    const [counts, setCounts] = useState({ revenue: 0, orders: 0, users: 0, pending: 0 });
    const [growth, setGrowth] = useState({ revenue: 0, orders: 0 });
    const [loading, setLoading] = useState(true);
    const [adminEmail, setAdminEmail] = useState<string | null>(null);

    useEffect(() => {
        supabase.auth.getUser().then(({ data }) => setAdminEmail(data.user?.email ?? null));
    }, []);

    useEffect(() => {
        async function load() {
            setLoading(true);

            // Dispara a checagem do Alerta Fiscal MEI de forma segura
            await supabase.rpc("check_mei_alert");

            const since = new Date();
            since.setDate(since.getDate() - range);
            const prevSince = new Date();
            prevSince.setDate(prevSince.getDate() - range * 2);

            const [{ data: paidOrders }, { data: prevPaidOrders }, { count: orders }, { count: prevOrders }, { count: users }, { count: pending }] =
                await Promise.all([
                    supabase.from("orders").select("total").eq("status", "paid").gte("created_at", since.toISOString()),
                    supabase
                        .from("orders")
                        .select("total")
                        .eq("status", "paid")
                        .gte("created_at", prevSince.toISOString())
                        .lt("created_at", since.toISOString()),
                    supabase.from("orders").select("*", { count: "exact", head: true }).gte("created_at", since.toISOString()),
                    supabase
                        .from("orders")
                        .select("*", { count: "exact", head: true })
                        .gte("created_at", prevSince.toISOString())
                        .lt("created_at", since.toISOString()),
                    supabase.from("profiles").select("*", { count: "exact", head: true }),
                    supabase.from("orders").select("*", { count: "exact", head: true }).eq("status", "pending"),
                ]);

            const revenue = (paidOrders ?? []).reduce((sum, o) => sum + (o.total as number), 0);
            const prevRevenue = (prevPaidOrders ?? []).reduce((sum, o) => sum + (o.total as number), 0);

            const revenueGrowth = prevRevenue > 0 ? ((revenue - prevRevenue) / prevRevenue) * 100 : 0;
            const ordersGrowth = (prevOrders ?? 0) > 0 ? (((orders ?? 0) - (prevOrders ?? 0)) / (prevOrders ?? 1)) * 100 : 0;

            setCounts({ revenue, orders: orders ?? 0, users: users ?? 0, pending: pending ?? 0 });
            setGrowth({ revenue: revenueGrowth, orders: ordersGrowth });
            setLoading(false);
        }
        load();
    }, [range]);

    const cards = [
        {
            label: "Faturamento",
            value: formatPrice(counts.revenue),
            icon: DollarSign,
            color: "text-emerald-400 bg-emerald-500/10",
            growth: growth.revenue,
        },
        {
            label: "Pedidos",
            value: counts.orders,
            icon: ShoppingBag,
            color: "text-blue-400 bg-blue-500/10",
            growth: growth.orders,
        },
        {
            label: "Clientes",
            value: counts.users,
            icon: Users,
            color: "text-purple-400 bg-purple-500/10",
            growth: null,
        },
        {
            label: "Entregas Pendentes",
            value: counts.pending,
            icon: Clock,
            color: "text-amber-400 bg-amber-500/10",
            growth: null,
        },
    ];

    return (
        <div>
            <AdminHeader title="Painel Principal" range={range} onRangeChange={setRange} adminEmail={adminEmail} />

            <div className="p-6 lg:p-8 space-y-6">
                {loading ? (
                    <p className="text-gray-400 text-sm">Carregando...</p>
                ) : (
                    <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
                        {cards.map((c) => (
                            <div key={c.label} className="glass rounded-2xl p-5 shadow-lg shadow-black/20">
                                <div className="flex items-center justify-between mb-4">
                                    <span className="text-xs text-gray-400">Últimos {range} dias</span>
                                    <div className={`w-9 h-9 rounded-full flex items-center justify-center ${c.color}`}>
                                        <c.icon className="w-4 h-4" />
                                    </div>
                                </div>
                                <div className="text-2xl font-bold text-white mb-1">{c.value}</div>
                                <div className="flex items-center justify-between">
                                    <span className="text-sm text-gray-400">{c.label}</span>
                                    {c.growth !== null && (
                                        <span
                                            className={`text-xs font-semibold px-1.5 py-0.5 rounded-full ${c.growth >= 0 ? "text-emerald-400 bg-emerald-500/10" : "text-red-400 bg-red-500/10"
                                                }`}
                                        >
                                            {c.growth >= 0 ? "↗️" : "↘️"} {Math.abs(c.growth).toFixed(0)}%
                                        </span>
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>
                )}

                <div className="flex flex-col lg:flex-row gap-6">
                    <SalesChart rangeDays={range} />
                    <SalesTargetRings />
                </div>

                <div className="flex flex-col lg:flex-row gap-6">
                    <TopSellingProducts />
                    <CurrentOffers />
                </div>
            </div>
        </div>
    );
}