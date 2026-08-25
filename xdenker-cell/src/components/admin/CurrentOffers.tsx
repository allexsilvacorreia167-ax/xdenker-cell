"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { supabase } from "@/lib/supabase";

type Coupon = {
    id: string;
    code: string;
    title: string;
    discount_type: "percentage" | "fixed";
    discount_value: number;
    usage_limit: number | null;
    usage_count: number;
    expires_at: string | null;
};

export default function CurrentOffers() {
    const [coupons, setCoupons] = useState<Coupon[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        async function load() {
            const { data } = await supabase
                .from("coupons")
                .select("*")
                .eq("active", true)
                .order("created_at", { ascending: false })
                .limit(5);
            setCoupons((data as Coupon[]) ?? []);
            setLoading(false);
        }
        load();
    }, []);

    return (
        <div className="glass rounded-2xl p-5 lg:p-6 w-full lg:w-80 flex-shrink-0">
            <div className="flex items-center justify-between mb-4">
                <h2 className="text-base font-bold text-white">Oferta Atual</h2>
                <Link href="/admin/ofertas" className="text-xs text-cyan-400 hover:underline">
                    Ver todas
                </Link>
            </div>

            {loading ? (
                <p className="text-xs text-gray-500">Carregando...</p>
            ) : coupons.length === 0 ? (
                <p className="text-sm text-gray-500">Nenhuma oferta ativa. Crie uma em &quot;Ofertas&quot;.</p>
            ) : (
                <div className="space-y-4">
                    {coupons.map((c) => {
                        const percent = c.usage_limit ? Math.min(100, (c.usage_count / c.usage_limit) * 100) : 0;
                        return (
                            <div key={c.id}>
                                <div className="flex items-center justify-between text-sm mb-1">
                                    <span className="text-white font-medium">{c.title}</span>
                                    <span className="text-[11px] text-gray-400">
                                        {c.expires_at
                                            ? `Expira em ${new Date(c.expires_at).toLocaleDateString("pt-BR")}`
                                            : "Sem validade"}
                                    </span>
                                </div>
                                <div className="h-1.5 rounded-full bg-white/10 overflow-hidden">
                                    <div className="h-full bg-cyan-400" style={{ width: `${percent}%` }} />
                                </div>
                                <div className="text-[11px] text-gray-500 mt-1">
                                    Código {c.code} — {c.usage_count}/{c.usage_limit ?? "∞"} usos
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}
        </div>
    );
}