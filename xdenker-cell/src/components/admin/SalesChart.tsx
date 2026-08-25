"use client";

import { useEffect, useState } from "react";
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer } from "recharts";
import { supabase } from "@/lib/supabase";

function formatPrice(value: number) {
    return value.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

type DayPoint = { day: string; total: number };

export default function SalesChart({ rangeDays }: { rangeDays: number }) {
    const [points, setPoints] = useState<DayPoint[]>([]);
    const [income, setIncome] = useState(0);
    const [expenses, setExpenses] = useState(0);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        async function load() {
            setLoading(true);
            const since = new Date();
            since.setDate(since.getDate() - rangeDays);

            const { data: orders } = await supabase
                .from("orders")
                .select("total, items, created_at")
                .eq("status", "paid")
                .gte("created_at", since.toISOString());

            const list = orders ?? [];
            const totalIncome = list.reduce((sum, o) => sum + (o.total as number), 0);

            // Custo (despesas): busca preço de custo dos produtos vendidos
            const { data: products } = await supabase.from("products").select("id, name, cost_price");
            const costByName: Record<string, number> = {};
            (products ?? []).forEach((p) => {
                costByName[p.name] = p.cost_price ?? 0;
            });

            let totalExpenses = 0;
            const byDay: Record<string, number> = {};

            list.forEach((o) => {
                const day = new Date(o.created_at as string).toLocaleDateString("pt-BR", {
                    day: "2-digit",
                    month: "short",
                });
                byDay[day] = (byDay[day] ?? 0) + (o.total as number);

                const items = (o.items as { name: string; quantity: number }[]) ?? [];
                items.forEach((item) => {
                    totalExpenses += (costByName[item.name] ?? 0) * item.quantity;
                });
            });

            setIncome(totalIncome);
            setExpenses(totalExpenses);
            setPoints(Object.entries(byDay).map(([day, total]) => ({ day, total })));
            setLoading(false);
        }
        load();
    }, [rangeDays]);

    const balance = income - expenses;

    return (
        <div className="glass rounded-2xl p-5 lg:p-6 flex-1 min-w-0">
            <div className="flex items-center justify-between mb-5">
                <h2 className="text-base font-bold text-white">Análise de Vendas</h2>
                <span className="text-xs text-gray-400">
                    Últimos {rangeDays} dias
                </span>
            </div>

            <div className="flex flex-wrap gap-8 mb-6">
                <div>
                    <div className="text-xs text-gray-400 mb-1">Income</div>
                    <div className="text-lg font-bold text-white">{formatPrice(income)}</div>
                </div>
                <div>
                    <div className="text-xs text-gray-400 mb-1">Expenses</div>
                    <div className="text-lg font-bold text-white">{formatPrice(expenses)}</div>
                </div>
                <div>
                    <div className="text-xs text-gray-400 mb-1">Balance</div>
                    <div className={`text-lg font-bold ${balance >= 0 ? "text-emerald-400" : "text-red-400"}`}>
                        {formatPrice(balance)}
                    </div>
                </div>
            </div>

            {loading ? (
                <p className="text-xs text-gray-500">Carregando gráfico...</p>
            ) : points.length === 0 ? (
                <div className="h-[220px] flex items-center justify-center text-sm text-gray-500">
                    Sem vendas pagas nesse período.
                </div>
            ) : (
                <div className="h-[220px]">
                    <ResponsiveContainer width="100%" height="100%">
                        <AreaChart data={points}>
                            <defs>
                                <linearGradient id="salesGradient" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="0%" stopColor="#22d3ee" stopOpacity={0.4} />
                                    <stop offset="100%" stopColor="#22d3ee" stopOpacity={0} />
                                </linearGradient>
                            </defs>
                            <XAxis dataKey="day" stroke="#64748b" fontSize={11} tickLine={false} axisLine={false} />
                            <YAxis stroke="#64748b" fontSize={11} tickLine={false} axisLine={false} width={40} />
                            <Tooltip
                                contentStyle={{ background: "#0f172a", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 12 }}
                                labelStyle={{ color: "#94a3b8" }}
                                formatter={(value: any) => formatPrice(Number(value))}
                            />
                            <Area type="monotone" dataKey="total" stroke="#22d3ee" strokeWidth={2} fill="url(#salesGradient)" />
                        </AreaChart>
                    </ResponsiveContainer>
                </div>
            )}
        </div>
    );
}