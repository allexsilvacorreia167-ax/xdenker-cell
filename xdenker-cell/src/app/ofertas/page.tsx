"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import Header from "@/components/layout/Header";
import BottomNav from "@/components/layout/BottomNav";
import { supabase } from "@/lib/supabase";
import { getActiveCampaigns, PromoCampaign } from "@/lib/queries";
import CouponBadge from "@/components/promo/CouponBadge";
import CountdownTimer from "@/components/promo/CountdownTimer";
import { ArrowRight } from "lucide-react";

type Coupon = {
    id: string;
    code: string;
    title: string;
    discount_type: "percentage" | "fixed";
    discount_value: number;
    expires_at: string | null;
};

export default function OfertasPage() {
    const [coupons, setCoupons] = useState<Coupon[]>([]);
    const [campaigns, setCampaigns] = useState<PromoCampaign[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        async function load() {
            const [{ data: couponsData }, campaignsData] = await Promise.all([
                supabase.from("coupons").select("*").eq("active", true).order("created_at", { ascending: false }),
                getActiveCampaigns(),
            ]);
            setCoupons((couponsData as Coupon[]) ?? []);
            setCampaigns(campaignsData);
            setLoading(false);
        }
        load();
    }, []);

    return (
        <>
            <Header />
            <main className="px-4 lg:px-8 py-6 pb-28 lg:pb-12 max-w-5xl mx-auto">
                <h1 className="text-2xl font-bold mb-6">Ofertas e Cupons</h1>

                {loading ? (
                    <p className="text-sm text-gray-400">Carregando...</p>
                ) : (
                    <>
                        {campaigns.length > 0 && (
                            <div className="space-y-3 mb-10">
                                <h2 className="text-sm font-semibold text-gray-300 uppercase tracking-wide">Campanhas em Destaque</h2>
                                {campaigns.map((c) => (
                                    <Link
                                        key={c.id}
                                        href={`/ofertas/${c.slug}`}
                                        className="glass rounded-2xl p-5 flex items-center justify-between gap-4 hover:border-cyan-400/40 transition"
                                    >
                                        <div>
                                            <div className="text-xs text-gray-400 uppercase mb-1">{c.brand_label}</div>
                                            <div className="text-base font-bold text-white">
                                                {c.title_line1} <span className="text-cyan-400">{c.title_line2}</span>
                                            </div>
                                            {c.expires_at && (
                                                <div className="mt-2">
                                                    <CountdownTimer expiresAt={c.expires_at} />
                                                </div>
                                            )}
                                        </div>
                                        <ArrowRight className="w-5 h-5 text-cyan-400 flex-shrink-0" />
                                    </Link>
                                ))}
                            </div>
                        )}

                        <h2 className="text-sm font-semibold text-gray-300 uppercase tracking-wide mb-4">Cupons de Desconto</h2>
                        {coupons.length === 0 ? (
                            <div className="glass rounded-2xl p-10 text-center text-gray-400">Nenhum cupom ativo no momento.</div>
                        ) : (
                            <div className="flex flex-wrap gap-6">
                                {coupons.map((c) => (
                                    <CouponBadge key={c.id} coupon={c} />
                                ))}
                            </div>
                        )}
                    </>
                )}
            </main>
            <BottomNav />
        </>
    );
}