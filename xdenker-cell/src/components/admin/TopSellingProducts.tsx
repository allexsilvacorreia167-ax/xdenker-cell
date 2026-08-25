"use client";

import { useEffect, useRef, useState } from "react";
import { supabase, Product } from "@/lib/supabase";
import { ChevronLeft, ChevronRight } from "lucide-react";

type RankedProduct = Product & { soldQty: number };

export default function TopSellingProducts() {
    const [products, setProducts] = useState<RankedProduct[]>([]);
    const [loading, setLoading] = useState(true);
    const scrollRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        async function load() {
            const [{ data: orders }, { data: allProducts }] = await Promise.all([
                supabase.from("orders").select("items").eq("status", "paid"),
                supabase.from("products").select("*"),
            ]);

            const soldByName: Record<string, number> = {};
            (orders ?? []).forEach((o) => {
                const items = (o.items as { name: string; quantity: number }[]) ?? [];
                items.forEach((item) => {
                    soldByName[item.name] = (soldByName[item.name] ?? 0) + item.quantity;
                });
            });

            const ranked = ((allProducts as Product[]) ?? [])
                .map((p) => ({ ...p, soldQty: soldByName[p.name] ?? 0 }))
                .sort((a, b) => b.soldQty - a.soldQty)
                .slice(0, 10);

            setProducts(ranked);
            setLoading(false);
        }
        load();
    }, []);

    function scroll(dir: number) {
        scrollRef.current?.scrollBy({ left: dir * 200, behavior: "smooth" });
    }

    return (
        <div className="glass rounded-2xl p-5 lg:p-6 flex-1 min-w-0">
            <div className="flex items-center justify-between mb-4">
                <h2 className="text-base font-bold text-white">Top Selling Products</h2>
                <div className="flex gap-2">
                    <button onClick={() => scroll(-1)} className="w-8 h-8 rounded-full glass flex items-center justify-center">
                        <ChevronLeft className="w-4 h-4" />
                    </button>
                    <button onClick={() => scroll(1)} className="w-8 h-8 rounded-full glass flex items-center justify-center">
                        <ChevronRight className="w-4 h-4" />
                    </button>
                </div>
            </div>

            {loading ? (
                <p className="text-xs text-gray-500">Carregando...</p>
            ) : products.length === 0 ? (
                <p className="text-sm text-gray-500">Nenhuma venda registrada ainda.</p>
            ) : (
                <div ref={scrollRef} className="flex gap-3 overflow-x-auto scrollbar-hide pb-1">
                    {products.map((p) => (
                        <div key={p.id} className="w-32 flex-shrink-0">
                            <div className="w-32 h-32 rounded-xl bg-slate-800 overflow-hidden mb-2">
                                {p.images?.[0] && (
                                    // eslint-disable-next-line @next/next/no-img-element
                                    <img src={p.images[0]} alt={p.name} className="w-full h-full object-cover" />
                                )}
                            </div>
                            <div className="text-xs font-medium text-white truncate">{p.name}</div>
                            <div className="text-[11px] text-gray-400">{p.stock} Pcs em estoque</div>
                            <div className="text-[11px] text-cyan-400">{p.soldQty} vendidos</div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}