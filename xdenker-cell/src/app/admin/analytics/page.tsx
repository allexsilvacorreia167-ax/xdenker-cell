"use client";

import { useEffect, useState } from "react";
import AdminHeader from "@/components/admin/AdminHeader";
import { getOnlineAnalytics } from "@/lib/queries";
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer } from "recharts";
import { TrendingUp, ShoppingBag, Percent, DollarSign, Truck, CheckCircle2, XCircle } from "lucide-react";

function formatPrice(value: number) {
    return value.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

type Analytics = Awaited<ReturnType<typeof getOnlineAnalytics>>;

export default function AdminAnalyticsPage() {
    const [range, setRange] = useState(30);
    const [data, setData] = useState<Analytics | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        async function load() {
            setLoading(true);
            const endDate = new Date();
            const startDate = new Date();
            startDate.setDate(startDate.getDate() - range);
            const result = await getOnlineAnalytics(startDate, endDate);
            setData(result);
            setLoading(false);
        }
        load();
    }, [range]);

    const kpis = data
        ? [
            { label: "Faturamento Online", value: formatPrice(data.revenue), icon: DollarSign, color: "text-emerald-400 bg-emerald-500/10" },
            { label: "Pedidos Online", value: data.orderCount, icon: ShoppingBag, color: "text-blue-400 bg-blue-500/10" },
            { label: "Ticket Médio", value: formatPrice(data.avgTicket), icon: TrendingUp, color: "text-cyan-400 bg-cyan-500/10" },
            { label: "Taxa de Conversão", value: `${data.conversionRate.toFixed(1)}%`, icon: Percent, color: "text-purple-400 bg-purple-500/10" },
        ]
        : [];

    const deliveryTotal = data?.deliveryStats.total ?? 0;
    const deliveredPercent = deliveryTotal > 0 ? ((data?.deliveryStats.delivered ?? 0) / deliveryTotal) * 100 : 0;
    const shippedPercent = deliveryTotal > 0 ? ((data?.deliveryStats.shipped ?? 0) / deliveryTotal) * 100 : 0;
    const cancelledPercent = deliveryTotal > 0 ? ((data?.deliveryStats.cancelled ?? 0) / deliveryTotal) * 100 : 0;

    return (
        <div>
            <AdminHeader title="Análises Online" range={range} onRangeChange={setRange} />

            <div className="p-6 lg:p-8 space-y-6">
                {loading || !data ? (
                    <p className="text-gray-400 text-sm">Carregando...</p>
                ) : (
                    <>
                        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
                            {kpis.map((k) => (
                                <div key={k.label} className="glass rounded-2xl p-5">
                                    <div className="flex items-center justify-between mb-3">
                                        <span className="text-xs text-gray-400">Últimos {range} dias</span>
                                        <div className={`w-9 h-9 rounded-full flex items-center justify-center ${k.color}`}>
                                            <k.icon className="w-4 h-4" />
                                        </div>
                                    </div>
                                    <div className="text-2xl font-bold text-white mb-1">{k.value}</div>
                                    <div className="text-sm text-gray-400">{k.label}</div>
                                </div>
                            ))}
                        </div>

                        <div className="glass rounded-2xl p-5">
                            <h2 className="text-sm font-semibold text-white mb-4">Evolução do Faturamento Online</h2>
                            {data.revenueByDay.length === 0 ? (
                                <p className="text-sm text-gray-500">Sem vendas online nesse período.</p>
                            ) : (
                                <div className="h-[240px]">
                                    <ResponsiveContainer width="100%" height="100%">
                                        <AreaChart data={data.revenueByDay}>
                                            <defs>
                                                <linearGradient id="revGradient" x1="0" y1="0" x2="0" y2="1">
                                                    <stop offset="0%" stopColor="#22d3ee" stopOpacity={0.4} />
                                                    <stop offset="100%" stopColor="#22d3ee" stopOpacity={0} />
                                                </linearGradient>
                                            </defs>
                                            <XAxis
                                                dataKey="date"
                                                stroke="#64748b"
                                                fontSize={10}
                                                tickFormatter={(d) => new Date(d).toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit" })}
                                            />
                                            <YAxis stroke="#64748b" fontSize={10} width={50} />
                                            <Tooltip
                                                contentStyle={{ background: "#0f172a", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 12 }}
                                                formatter={(value: any) => formatPrice(Number(value))}
                                            />
                                            <Area type="monotone" dataKey="total" stroke="#22d3ee" strokeWidth={2} fill="url(#revGradient)" />
                                        </AreaChart>
                                    </ResponsiveContainer>
                                </div>
                            )}
                        </div>

                        <div className="grid lg:grid-cols-2 gap-6">
                            <div className="glass rounded-2xl p-5">
                                <h2 className="text-sm font-semibold text-white mb-4">Mais Vendidos Online</h2>
                                {data.topProducts.length === 0 ? (
                                    <p className="text-sm text-gray-500">Nenhuma venda online registrada.</p>
                                ) : (
                                    <div className="space-y-3">
                                        {data.topProducts.map((p, i) => (
                                            <div key={p.name} className="flex items-center justify-between">
                                                <div className="flex items-center gap-3">
                                                    <span className="text-xs text-gray-500 w-4">{i + 1}º</span>
                                                    <span className="text-sm text-white truncate max-w-[220px]">{p.name}</span>
                                                </div>
                                                <span className="text-sm text-cyan-400 font-medium">{p.qty} un.</span>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>

                            <div className="glass rounded-2xl p-5">
                                <h2 className="text-sm font-semibold text-white mb-4">Status de Entrega e Logística</h2>
                                <div className="space-y-4">
                                    <div>
                                        <div className="flex justify-between text-sm mb-1">
                                            <span className="flex items-center gap-1.5 text-gray-300">
                                                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                                                Entregues
                                            </span>
                                            <span className="text-white">{data.deliveryStats.delivered}</span>
                                        </div>
                                        <div className="h-1.5 rounded-full bg-white/10 overflow-hidden">
                                            <div className="h-full bg-emerald-400" style={{ width: `${deliveredPercent}%` }} />
                                        </div>
                                    </div>
                                    <div>
                                        <div className="flex justify-between text-sm mb-1">
                                            <span className="flex items-center gap-1.5 text-gray-300">
                                                <Truck className="w-3.5 h-3.5 text-cyan-400" />
                                                Enviados (a caminho)
                                            </span>
                                            <span className="text-white">{data.deliveryStats.shipped}</span>
                                        </div>
                                        <div className="h-1.5 rounded-full bg-white/10 overflow-hidden">
                                            <div className="h-full bg-cyan-400" style={{ width: `${shippedPercent}%` }} />
                                        </div>
                                    </div>
                                    <div>
                                        <div className="flex justify-between text-sm mb-1">
                                            <span className="flex items-center gap-1.5 text-gray-300">
                                                <XCircle className="w-3.5 h-3.5 text-red-400" />
                                                Cancelados/Estornados
                                            </span>
                                            <span className="text-white">{data.deliveryStats.cancelled}</span>
                                        </div>
                                        <div className="h-1.5 rounded-full bg-white/10 overflow-hidden">
                                            <div className="h-full bg-red-400" style={{ width: `${cancelledPercent}%` }} />
                                        </div>
                                    </div>
                                </div>
                                {deliveryTotal === 0 && (
                                    <p className="text-xs text-gray-500 mt-3">Nenhum pedido online no período.</p>
                                )}
                            </div>
                        </div>

                        <div className="glass rounded-2xl p-4 text-xs text-gray-500 flex items-center gap-2">
                            <TrendingUp className="w-3.5 h-3.5" />
                            {data.uniqueVisitors} visitantes únicos registrados no período — base do cálculo de conversão.
                        </div>
                    </>
                )}
            </div>
        </div>
    );
}