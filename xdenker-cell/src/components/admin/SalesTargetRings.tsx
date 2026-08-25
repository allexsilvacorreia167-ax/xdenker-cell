"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";

function formatPrice(value: number) {
    return value.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

function Ring({ percent, color, radius, strokeWidth }: { percent: number; color: string; radius: number; strokeWidth: number }) {
    const circumference = 2 * Math.PI * radius;
    const offset = circumference - (Math.min(percent, 100) / 100) * circumference;
    return (
        <circle
            r={radius}
            cx="0"
            cy="0"
            fill="none"
            stroke={color}
            strokeWidth={strokeWidth}
            strokeDasharray={circumference}
            strokeDashoffset={offset}
            strokeLinecap="round"
            transform="rotate(-90)"
        />
    );
}

export default function SalesTargetRings() {
    const [dailyTarget, setDailyTarget] = useState(0);
    const [monthlyTarget, setMonthlyTarget] = useState(0);
    const [dailySales, setDailySales] = useState(0);
    const [monthlySales, setMonthlySales] = useState(0);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        async function load() {
            const { data: goals } = await supabase.from("sales_goals").select("*").limit(1).maybeSingle();
            setDailyTarget(goals?.daily_target ?? 0);
            setMonthlyTarget(goals?.monthly_target ?? 0);

            const startOfDay = new Date();
            startOfDay.setHours(0, 0, 0, 0);
            const startOfMonth = new Date();
            startOfMonth.setDate(1);
            startOfMonth.setHours(0, 0, 0, 0);

            const [{ data: dayOrders }, { data: monthOrders }] = await Promise.all([
                supabase.from("orders").select("total").eq("status", "paid").gte("created_at", startOfDay.toISOString()),
                supabase.from("orders").select("total").eq("status", "paid").gte("created_at", startOfMonth.toISOString()),
            ]);

            setDailySales((dayOrders ?? []).reduce((sum, o) => sum + (o.total as number), 0));
            setMonthlySales((monthOrders ?? []).reduce((sum, o) => sum + (o.total as number), 0));
            setLoading(false);
        }
        load();
    }, []);

    const dailyPercent = dailyTarget > 0 ? (dailySales / dailyTarget) * 100 : 0;
    const monthlyPercent = monthlyTarget > 0 ? (monthlySales / monthlyTarget) * 100 : 0;

    return (
        <div className="glass rounded-2xl p-5 lg:p-6 w-full lg:w-80 flex-shrink-0">
            <h2 className="text-base font-bold text-white mb-5">Meta de Vendas</h2>

            {loading ? (
                <p className="text-xs text-gray-500">Carregando...</p>
            ) : (
                <>
                    <div className="flex items-center justify-center mb-6">
                        <svg width="160" height="160" viewBox="-80 -80 160 160">
                            <circle r="68" cx="0" cy="0" fill="none" stroke="rgba(255,255,255,0.08)" strokeWidth="10" />
                            <Ring percent={dailyPercent} color="#94a3b8" radius={68} strokeWidth={10} />
                            <circle r="50" cx="0" cy="0" fill="none" stroke="rgba(255,255,255,0.08)" strokeWidth="10" />
                            <Ring percent={monthlyPercent} color="#22d3ee" radius={50} strokeWidth={10} />
                        </svg>
                    </div>

                    <div className="space-y-3">
                        <div className="flex items-center justify-between text-sm">
                            <span className="flex items-center gap-2 text-gray-300">
                                <span className="w-2.5 h-2.5 rounded-full bg-slate-400" />
                                Meta Diária
                            </span>
                            <span className="font-semibold text-white">{formatPrice(dailySales)}</span>
                        </div>
                        <div className="text-xs text-gray-500 pl-4.5">Meta: {formatPrice(dailyTarget)}</div>

                        <div className="flex items-center justify-between text-sm pt-2">
                            <span className="flex items-center gap-2 text-gray-300">
                                <span className="w-2.5 h-2.5 rounded-full bg-cyan-400" />
                                Meta Mensal
                            </span>
                            <span className="font-semibold text-white">{formatPrice(monthlySales)}</span>
                        </div>
                        <div className="text-xs text-gray-500 pl-4.5">Meta: {formatPrice(monthlyTarget)}</div>
                    </div>
                </>
            )}
        </div>
    );
}