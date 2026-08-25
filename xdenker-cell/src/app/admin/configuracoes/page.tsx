"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import AdminHeader from "@/components/admin/AdminHeader";

export default function AdminConfiguracoesPage() {
    const [goalId, setGoalId] = useState<string | null>(null);
    const [daily, setDaily] = useState("");
    const [monthly, setMonthly] = useState("");
    const [saved, setSaved] = useState(false);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        async function load() {
            const { data } = await supabase.from("sales_goals").select("*").limit(1).maybeSingle();
            if (data) {
                setGoalId(data.id);
                setDaily(String(data.daily_target));
                setMonthly(String(data.monthly_target));
            }
            setLoading(false);
        }
        load();
    }, []);

    async function handleSave(e: React.FormEvent) {
        e.preventDefault();
        if (!goalId) return;
        await supabase
            .from("sales_goals")
            .update({ daily_target: parseFloat(daily), monthly_target: parseFloat(monthly), updated_at: new Date().toISOString() })
            .eq("id", goalId);
        setSaved(true);
        setTimeout(() => setSaved(false), 2000);
    }

    return (
        <div>
            <AdminHeader title="Configurações" range={30} onRangeChange={() => { }} />
            <div className="p-6 lg:p-8 max-w-lg">
                {loading ? (
                    <p className="text-gray-400 text-sm">Carregando...</p>
                ) : (
                    <form onSubmit={handleSave} className="glass rounded-2xl p-5 space-y-4">
                        <h2 className="text-sm font-semibold text-white mb-1">Metas de Vendas</h2>
                        <p className="text-xs text-gray-400 mb-3">
                            Usadas no anel &quot;Sales Target&quot; da Visão Geral.
                        </p>
                        <div>
                            <label className="text-xs text-gray-400 mb-1 block">Meta Diária (R$)</label>
                            <input
                                type="number"
                                step="0.01"
                                value={daily}
                                onChange={(e) => setDaily(e.target.value)}
                                className="w-full glass rounded-xl px-4 py-2.5 text-sm outline-none focus:border-blue-400/50"
                            />
                        </div>
                        <div>
                            <label className="text-xs text-gray-400 mb-1 block">Meta Mensal (R$)</label>
                            <input
                                type="number"
                                step="0.01"
                                value={monthly}
                                onChange={(e) => setMonthly(e.target.value)}
                                className="w-full glass rounded-xl px-4 py-2.5 text-sm outline-none focus:border-blue-400/50"
                            />
                        </div>
                        <button type="submit" className="glow-btn px-6 py-2.5 rounded-full text-sm font-semibold">
                            Salvar Metas
                        </button>
                        {saved && <p className="text-xs text-emerald-400">Salvo!</p>}
                    </form>
                )}
            </div>
        </div>
    );
}