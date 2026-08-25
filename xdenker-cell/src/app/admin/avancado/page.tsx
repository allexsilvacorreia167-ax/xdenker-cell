"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import MasterGuard from "@/components/admin/MasterGuard";
import BrowserTabBar from "@/components/admin/BrowserTabBar";
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer } from "recharts";

function formatPrice(value: number) {
    return value.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

type Settings = {
    id: string;
    tax_regime: string;
    tax_rate: number;
    gateway_a_name: string;
    gateway_a_fee: number;
    gateway_a_active: boolean;
    gateway_b_name: string;
    gateway_b_fee: number;
    gateway_b_active: boolean;
    monthly_marketing_spend: number;
};

export default function AvancadoPage() {
    const [settings, setSettings] = useState<Settings | null>(null);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [saved, setSaved] = useState(false);

    const [cashFlow, setCashFlow] = useState(0);
    const [retention, setRetention] = useState(0);
    const [cac, setCac] = useState(0);
    const [roi, setRoi] = useState(0);
    const [projection, setProjection] = useState<{ label: string; value: number }[]>([]);

    async function load() {
        setLoading(true);

        const { data: settingsData } = await supabase.from("system_settings").select("*").limit(1).maybeSingle();
        setSettings(settingsData as Settings);

        const startOfMonth = new Date();
        startOfMonth.setDate(1);
        startOfMonth.setHours(0, 0, 0, 0);

        const { data: products } = await supabase.from("products").select("name, cost_price");
        const costByName: Record<string, number> = {};
        (products ?? []).forEach((p) => (costByName[p.name] = p.cost_price ?? 0));

        const { data: orders } = await supabase
            .from("orders")
            .select("total, items, user_id, created_at")
            .eq("status", "paid")
            .gte("created_at", startOfMonth.toISOString());

        const list = orders ?? [];
        const revenue = list.reduce((s, o) => s + (o.total as number), 0);
        const cost = list.reduce((s, o) => {
            const items = (o.items as { name: string; quantity: number }[]) ?? [];
            return s + items.reduce((sum, it) => sum + (costByName[it.name] ?? 0) * it.quantity, 0);
        }, 0);

        setCashFlow(revenue - cost);

        // Retenção: % de clientes com mais de 1 pedido pago (histórico completo)
        const { data: allOrders } = await supabase.from("orders").select("user_id").eq("status", "paid");
        const ordersByUser: Record<string, number> = {};
        (allOrders ?? []).forEach((o) => {
            if (!o.user_id) return;
            ordersByUser[o.user_id] = (ordersByUser[o.user_id] ?? 0) + 1;
        });
        const uniqueUsers = Object.keys(ordersByUser).length;
        const repeatUsers = Object.values(ordersByUser).filter((c) => c > 1).length;
        setRetention(uniqueUsers > 0 ? (repeatUsers / uniqueUsers) * 100 : 0);

        // CAC: gasto de marketing do mês / clientes novos no mês
        const newCustomerIds = new Set(list.filter((o) => o.user_id).map((o) => o.user_id));
        const marketingSpend = settingsData?.monthly_marketing_spend ?? 0;
        setCac(newCustomerIds.size > 0 ? marketingSpend / newCustomerIds.size : 0);

        // ROI: receita / (custo + marketing)
        const totalInvested = cost + marketingSpend;
        setRoi(totalInvested > 0 ? revenue / totalInvested : 0);

        // Projeção simples: média diária do mês atual, projetada pros próximos 15 dias
        const daysElapsed = Math.max(1, new Date().getDate());
        const dailyAvg = revenue / daysElapsed;
        const proj: { label: string; value: number }[] = [];
        for (let i = 1; i <= 15; i++) {
            const d = new Date();
            d.setDate(d.getDate() + i);
            proj.push({
                label: d.toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit" }),
                value: Math.round(dailyAvg * (daysElapsed + i)),
            });
        }
        setProjection(proj);

        setLoading(false);
    }

    useEffect(() => {
        load();
    }, []);

    async function handleSaveSettings() {
        if (!settings) return;
        setSaving(true);
        await supabase
            .from("system_settings")
            .update({
                tax_regime: settings.tax_regime,
                tax_rate: settings.tax_rate,
                gateway_a_active: settings.gateway_a_active,
                gateway_a_fee: settings.gateway_a_fee,
                gateway_b_active: settings.gateway_b_active,
                gateway_b_fee: settings.gateway_b_fee,
                monthly_marketing_spend: settings.monthly_marketing_spend,
                updated_at: new Date().toISOString(),
            })
            .eq("id", settings.id);
        setSaving(false);
        setSaved(true);
        setTimeout(() => setSaved(false), 2000);
    }

    const monthLabel = new Date().toLocaleDateString("pt-BR", { month: "long", year: "numeric" });

    const kpis = [
        { label: "Fluxo de Caixa", value: formatPrice(cashFlow) },
        { label: "Retenção de Clientes", value: `${retention.toFixed(0)}%`, progress: retention },
        { label: "Custo de Aquisição (CAC)", value: formatPrice(cac) },
        { label: "ROI Geral", value: `${roi.toFixed(1)}x` },
    ];

    return (
        <MasterGuard>
            <BrowserTabBar title={`Página Adv - ${monthLabel}`} />
            <div className="p-6 lg:p-8 bg-[#0b0f19] min-h-screen">
                <h1 className="text-2xl font-bold text-white mb-6">Configurações Avançadas</h1>

                {loading || !settings ? (
                    <p className="text-gray-400 text-sm">Carregando...</p>
                ) : (
                    <>
                        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
                            {kpis.map((k: any) => (
                                <div key={k.label} className="glass rounded-2xl p-5">
                                    <div className="text-xs text-gray-400 mb-2">{k.label}</div>
                                    <div className="text-xl font-bold text-white mb-2">{k.value}</div>
                                    {"progress" in k && (
                                        <div className="h-1.5 rounded-full bg-white/10 overflow-hidden">
                                            <div className="h-full bg-cyan-400" style={{ width: `${Math.min(100, k.progress)}%` }} />
                                        </div>
                                    )}
                                </div>
                            ))}
                        </div>

                        <div className="glass rounded-2xl p-5 mb-6">
                            <h2 className="text-sm font-semibold text-white mb-4">Projeção de Vendas — Próximos 15 dias</h2>
                            <div className="h-60">
                                <ResponsiveContainer width="100%" height="100%">
                                    <AreaChart data={projection}>
                                        <defs>
                                            <linearGradient id="projGradient" x1="0" y1="0" x2="0" y2="1">
                                                <stop offset="0%" stopColor="#3b82f6" stopOpacity={0.4} />
                                                <stop offset="100%" stopColor="#3b82f6" stopOpacity={0} />
                                            </linearGradient>
                                        </defs>
                                        <XAxis dataKey="label" stroke="#64748b" fontSize={10} />
                                        <YAxis stroke="#64748b" fontSize={10} width={50} />
                                        <Tooltip
                                            contentStyle={{ background: "#0f172a", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 12 }}
                                            formatter={(value: any) => formatPrice(Number(value))}
                                        />
                                        <Area type="monotone" dataKey="value" stroke="#3b82f6" strokeWidth={2} fill="url(#projGradient)" />
                                    </AreaChart>
                                </ResponsiveContainer>
                            </div>
                            <p className="text-[11px] text-gray-500 mt-2">
                                Projeção linear baseada na média diária do mês atual — não é garantia de resultado.
                            </p>
                        </div>

                        <div className="grid lg:grid-cols-2 gap-6">
                            <div className="glass rounded-2xl p-5">
                                <h2 className="text-sm font-semibold text-white mb-4">Regras de Imposto Automatizadas</h2>

                                <label className="text-xs text-gray-400 mb-1 block">Regime Tributário</label>
                                <select
                                    value={settings.tax_regime ?? "MEI"}
                                    onChange={(e) => setSettings({ ...settings, tax_regime: e.target.value })}
                                    className="w-full glass rounded-xl px-4 py-2.5 text-sm outline-none focus:border-blue-400/50 bg-transparent mb-4"
                                >
                                    <option value="MEI" className="bg-slate-900">MEI</option>
                                    <option value="Simples Nacional" className="bg-slate-900">Simples Nacional</option>
                                    <option value="Lucro Presumido" className="bg-slate-900">Lucro Presumido</option>
                                    <option value="Outro" className="bg-slate-900">Outro</option>
                                </select>

                                <label className="text-xs text-gray-400 mb-1 block">Alíquota (Simples Nacional / MEI) %</label>
                                <input
                                    type="number"
                                    step="0.01"
                                    value={settings.tax_rate}
                                    onChange={(e) => setSettings({ ...settings, tax_rate: parseFloat(e.target.value) || 0 })}
                                    className="w-full glass rounded-xl px-4 py-2.5 text-sm outline-none focus:border-blue-400/50 mb-4"
                                />
                                <label className="text-xs text-gray-400 mb-1 block">Gasto mensal com Marketing (R$)</label>
                                <input
                                    type="number"
                                    step="0.01"
                                    value={settings.monthly_marketing_spend}
                                    onChange={(e) =>
                                        setSettings({ ...settings, monthly_marketing_spend: parseFloat(e.target.value) || 0 })
                                    }
                                    className="w-full glass rounded-xl px-4 py-2.5 text-sm outline-none focus:border-blue-400/50"
                                />
                            </div>

                            <div className="glass rounded-2xl p-5">
                                <h2 className="text-sm font-semibold text-white mb-4">Módulos de Pagamento (Gateways)</h2>
                                <div className="space-y-4">
                                    <div className="flex items-center justify-between">
                                        <div>
                                            <div className="text-sm text-white">{settings.gateway_a_name}</div>
                                            <div className="text-xs text-gray-500">Taxa: {settings.gateway_a_fee}%</div>
                                        </div>
                                        <button
                                            onClick={() => setSettings({ ...settings, gateway_a_active: !settings.gateway_a_active })}
                                            className={`w-11 h-6 rounded-full transition-colors relative ${settings.gateway_a_active ? "bg-emerald-500" : "bg-gray-600"
                                                }`}
                                        >
                                            <span
                                                className={`absolute top-0.5 w-5 h-5 rounded-full bg-white transition-transform ${settings.gateway_a_active ? "translate-x-5" : "translate-x-0.5"
                                                    }`}
                                            />
                                        </button>
                                    </div>
                                    <div className="flex items-center justify-between">
                                        <div>
                                            <div className="text-sm text-white">{settings.gateway_b_name}</div>
                                            <div className="text-xs text-gray-500">Taxa: {settings.gateway_b_fee}%</div>
                                        </div>
                                        <button
                                            onClick={() => setSettings({ ...settings, gateway_b_active: !settings.gateway_b_active })}
                                            className={`w-11 h-6 rounded-full transition-colors relative ${settings.gateway_b_active ? "bg-emerald-500" : "bg-gray-600"
                                                }`}
                                        >
                                            <span
                                                className={`absolute top-0.5 w-5 h-5 rounded-full bg-white transition-transform ${settings.gateway_b_active ? "translate-x-5" : "translate-x-0.5"
                                                    }`}
                                            />
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <button
                            onClick={handleSaveSettings}
                            disabled={saving}
                            className="glow-btn px-6 py-2.5 rounded-full text-sm font-semibold mt-6 disabled:opacity-50"
                        >
                            {saving ? "Salvando..." : "Salvar Configurações"}
                        </button>
                        {saved && <p className="text-xs text-emerald-400 mt-2">Configurações salvas!</p>}
                    </>
                )}
            </div>
        </MasterGuard>
    );
}