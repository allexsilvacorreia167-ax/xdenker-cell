"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import MasterGuard from "@/components/admin/MasterGuard";
import BrowserTabBar from "@/components/admin/BrowserTabBar";
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from "recharts";
import { Download, RefreshCw } from "lucide-react";

function formatPrice(value: number) {
    return value.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

type Row = {
    date: string;
    revenue: number;
    tax: number;
    gatewayFee: number;
    margin: number;
};

function todayISO(daysAgo = 0) {
    const d = new Date();
    d.setDate(d.getDate() - daysAgo);
    return d.toISOString().slice(0, 10);
}

export default function FinanceiroPage() {
    const [startDate, setStartDate] = useState(todayISO(30));
    const [endDate, setEndDate] = useState(todayISO(0));
    const [rows, setRows] = useState<Row[]>([]);
    const [revenue, setRevenue] = useState(0);
    const [orderCount, setOrderCount] = useState(0);
    const [netProfit, setNetProfit] = useState(0);
    const [prevRevenue, setPrevRevenue] = useState(0);
    const [prevOrderCount, setPrevOrderCount] = useState(0);
    const [loading, setLoading] = useState(true);

    async function load() {
        setLoading(true);

        const { data: settings } = await supabase.from("system_settings").select("*").limit(1).maybeSingle();
        const taxRate = settings?.tax_rate ?? 6;
        const gatewayFee = settings?.gateway_a_active ? settings.gateway_a_fee : settings?.gateway_b_fee ?? 3;

        const { data: products } = await supabase.from("products").select("name, cost_price");
        const costByName: Record<string, number> = {};
        (products ?? []).forEach((p) => (costByName[p.name] = p.cost_price ?? 0));

        const { data: orders } = await supabase
            .from("orders")
            .select("total, items, created_at")
            .eq("status", "paid")
            .gte("created_at", `${startDate}T00:00:00`)
            .lte("created_at", `${endDate}T23:59:59`);

        const list = orders ?? [];
        const byDate: Record<string, Row> = {};

        let totalRevenue = 0;

        list.forEach((o) => {
            const date = new Date(o.created_at as string).toISOString().slice(0, 10);
            const total = o.total as number;
            const tax = total * (taxRate / 100);
            const fee = total * (gatewayFee / 100);
            const items = (o.items as { name: string; quantity: number }[]) ?? [];
            const cost = items.reduce((sum, it) => sum + (costByName[it.name] ?? 0) * it.quantity, 0);
            const margin = total - tax - fee - cost;

            totalRevenue += total;

            if (!byDate[date]) byDate[date] = { date, revenue: 0, tax: 0, gatewayFee: 0, margin: 0 };
            byDate[date].revenue += total;
            byDate[date].tax += tax;
            byDate[date].gatewayFee += fee;
            byDate[date].margin += margin;
        });

        const rowsArr = Object.values(byDate).sort((a, b) => a.date.localeCompare(b.date));
        setRows(rowsArr);
        setRevenue(totalRevenue);
        setOrderCount(list.length);
        setNetProfit(rowsArr.reduce((sum, r) => sum + r.margin, 0));

        // período anterior, mesmo tamanho, pra calcular variação %
        const rangeDays = Math.max(
            1,
            Math.round((new Date(endDate).getTime() - new Date(startDate).getTime()) / 86400000)
        );
        const prevStart = new Date(startDate);
        prevStart.setDate(prevStart.getDate() - rangeDays);
        const prevEnd = new Date(startDate);
        prevEnd.setDate(prevEnd.getDate() - 1);

        const { data: prevOrders, count } = await supabase
            .from("orders")
            .select("total", { count: "exact" })
            .eq("status", "paid")
            .gte("created_at", prevStart.toISOString())
            .lte("created_at", prevEnd.toISOString());

        setPrevRevenue((prevOrders ?? []).reduce((sum, o) => sum + (o.total as number), 0));
        setPrevOrderCount(count ?? 0);

        setLoading(false);
    }

    useEffect(() => {
        load();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    function handleExportCSV() {
        const header = "Data,Faturamento,Impostos,Taxas Gateway,Margem Bruta\n";
        const body = rows
            .map((r) => `${r.date},${r.revenue.toFixed(2)},${r.tax.toFixed(2)},${r.gatewayFee.toFixed(2)},${r.margin.toFixed(2)}`)
            .join("\n");
        const blob = new Blob([header + body], { type: "text/csv;charset=utf-8;" });
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `balanco-financeiro-${startDate}-a-${endDate}.csv`;
        a.click();
        URL.revokeObjectURL(url);
    }

    const avgTicket = orderCount > 0 ? revenue / orderCount : 0;
    const revenueGrowth = prevRevenue > 0 ? ((revenue - prevRevenue) / prevRevenue) * 100 : 0;
    const ordersGrowth = prevOrderCount > 0 ? ((orderCount - prevOrderCount) / prevOrderCount) * 100 : 0;

    const monthLabel = new Date(endDate).toLocaleDateString("pt-BR", { month: "long", year: "numeric" });

    const kpis = [
        { label: "Receita Bruta", value: formatPrice(revenue), growth: revenueGrowth },
        { label: "Pedidos", value: orderCount, growth: ordersGrowth },
        { label: "Ticket Médio", value: formatPrice(avgTicket), growth: null },
        { label: "Lucro Líquido", value: formatPrice(netProfit), growth: null },
    ];

    return (
        <MasterGuard>
            <BrowserTabBar title={`Balanço Financeiro - ${monthLabel}`} />
            <div className="p-6 lg:p-8 bg-[#0b0f19] min-h-screen">
                <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
                    <h1 className="text-2xl font-bold text-white">Balanço Financeiro</h1>
                    <div className="flex items-center gap-2">
                        <button onClick={load} className="glow-btn px-4 py-2.5 rounded-full text-xs font-semibold flex items-center gap-2">
                            <RefreshCw className="w-3.5 h-3.5" />
                            Gerar Relatório
                        </button>
                        <button
                            onClick={handleExportCSV}
                            className="glass px-4 py-2.5 rounded-full text-xs font-semibold flex items-center gap-2 border border-cyan-400/30"
                        >
                            <Download className="w-3.5 h-3.5" />
                            Exportar CSV
                        </button>
                    </div>
                </div>

                <div className="glass rounded-2xl p-4 mb-6 flex flex-wrap items-end gap-4">
                    <div>
                        <label className="text-xs text-gray-400 mb-1 block">Data inicial</label>
                        <input
                            type="date"
                            value={startDate}
                            onChange={(e) => setStartDate(e.target.value)}
                            className="glass rounded-xl px-3 py-2 text-sm outline-none"
                        />
                    </div>
                    <div>
                        <label className="text-xs text-gray-400 mb-1 block">Data final</label>
                        <input
                            type="date"
                            value={endDate}
                            onChange={(e) => setEndDate(e.target.value)}
                            className="glass rounded-xl px-3 py-2 text-sm outline-none"
                        />
                    </div>
                    <button onClick={load} className="glass px-4 py-2 rounded-full text-xs font-semibold border border-blue-400/30">
                        Aplicar
                    </button>
                </div>

                {loading ? (
                    <p className="text-gray-400 text-sm">Carregando...</p>
                ) : (
                    <>
                        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
                            {kpis.map((k) => (
                                <div key={k.label} className="glass rounded-2xl p-5">
                                    <div className="text-xs text-gray-400 mb-2">{k.label}</div>
                                    <div className="text-xl font-bold text-white mb-1">{k.value}</div>
                                    {k.growth !== null && (
                                        <span
                                            className={`text-xs font-semibold px-1.5 py-0.5 rounded-full ${k.growth >= 0 ? "text-emerald-400 bg-emerald-500/10" : "text-red-400 bg-red-500/10"
                                                }`}
                                        >
                                            {k.growth >= 0 ? "↗" : "↘"} {Math.abs(k.growth).toFixed(1)}%
                                        </span>
                                    )}
                                </div>
                            ))}
                        </div>

                        <div className="grid lg:grid-cols-2 gap-6 mb-6">
                            <div className="glass rounded-2xl p-5">
                                <h2 className="text-sm font-semibold text-white mb-4">Receita Bruta Mensal</h2>
                                {rows.length === 0 ? (
                                    <p className="text-xs text-gray-500">Sem dados no período.</p>
                                ) : (
                                    <div className="h-[220px]">
                                        <ResponsiveContainer width="100%" height="100%">
                                            <LineChart data={rows}>
                                                <XAxis
                                                    dataKey="date"
                                                    stroke="#64748b"
                                                    fontSize={10}
                                                    tickFormatter={(d) => new Date(d).toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit" })}
                                                />
                                                <YAxis stroke="#64748b" fontSize={10} width={40} />
                                                <Tooltip
                                                    contentStyle={{ background: "#0f172a", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 12 }}
                                                    formatter={(value: number | string) => formatPrice(Number(value))}
                                                />
                                                <Line type="monotone" dataKey="revenue" stroke="#22d3ee" strokeWidth={2} dot={{ r: 3 }} />
                                            </LineChart>
                                        </ResponsiveContainer>
                                    </div>
                                )}
                            </div>

                            <div className="glass rounded-2xl p-5">
                                <h2 className="text-sm font-semibold text-white mb-4">Margem Bruta por Dia</h2>
                                {rows.length === 0 ? (
                                    <p className="text-xs text-gray-500">Sem dados no período.</p>
                                ) : (
                                    <div className="h-[220px]">
                                        <ResponsiveContainer width="100%" height="100%">
                                            <BarChart data={rows}>
                                                <XAxis
                                                    dataKey="date"
                                                    stroke="#64748b"
                                                    fontSize={10}
                                                    tickFormatter={(d) => new Date(d).toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit" })}
                                                />
                                                <YAxis stroke="#64748b" fontSize={10} width={40} />
                                                <Tooltip
                                                    contentStyle={{ background: "#0f172a", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 12 }}
                                                    formatter={(value: number | string) => formatPrice(Number(value))}
                                                />
                                                <Bar dataKey="margin" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                                            </BarChart>
                                        </ResponsiveContainer>
                                    </div>
                                )}
                            </div>
                        </div>

                        <div className="glass rounded-2xl overflow-hidden">
                            <table className="w-full text-sm">
                                <thead>
                                    <tr className="text-left text-gray-400 text-xs uppercase border-b border-white/5">
                                        <th className="px-4 py-3">Data</th>
                                        <th className="px-4 py-3">Faturamento</th>
                                        <th className="px-4 py-3">Impostos (MEI/Simples)</th>
                                        <th className="px-4 py-3">Taxas do Gateway</th>
                                        <th className="px-4 py-3">Margem Bruta</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {rows.length === 0 ? (
                                        <tr>
                                            <td colSpan={5} className="px-4 py-6 text-center text-gray-500">
                                                Nenhum dado no período selecionado.
                                            </td>
                                        </tr>
                                    ) : (
                                        rows.map((r) => (
                                            <tr key={r.date} className="border-b border-white/5 last:border-0">
                                                <td className="px-4 py-3">{new Date(r.date).toLocaleDateString("pt-BR")}</td>
                                                <td className="px-4 py-3">{formatPrice(r.revenue)}</td>
                                                <td className="px-4 py-3 text-amber-400">{formatPrice(r.tax)}</td>
                                                <td className="px-4 py-3 text-gray-400">{formatPrice(r.gatewayFee)}</td>
                                                <td className="px-4 py-3 text-emerald-400 font-medium">{formatPrice(r.margin)}</td>
                                            </tr>
                                        ))
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </>
                )}
            </div>
        </MasterGuard>
    );
}