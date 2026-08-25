"use client";

import Link from "next/link";
import { Product } from "@/lib/supabase";
import { useCartStore } from "@/lib/store/cart";

function formatPrice(value: number) {
    return value.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

export default function ProductCard({ product }: { product: Product }) {
    const addItem = useCartStore((s) => s.addItem);
    const image = product.images?.[0] || "";

    return (
        <Link href={`/produto/${product.slug}`} className="glass rounded-2xl p-4 flex flex-col hover:border-cyan-400/30 transition">
            <div className="w-full aspect-square rounded-xl bg-gradient-to-b from-slate-600 to-slate-900 border border-white/10 mb-3 overflow-hidden flex items-center justify-center">
                {image ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={image} alt={product.name} className="w-full h-full object-cover" />
                ) : (
                    <div className="w-1/2 h-2/3 rounded-lg bg-white/5" />
                )}
            </div>
            <div className="text-sm font-medium mb-1 line-clamp-2">{product.name}</div>

            <div className="flex items-center gap-2 mb-3">
                <span className="text-cyan-400 font-semibold text-sm">{formatPrice(product.price)}</span>
                {product.compare_at_price && product.compare_at_price > product.price && (
                    <span className="text-gray-500 text-xs line-through">{formatPrice(product.compare_at_price)}</span>
                )}
            </div>

            <button
                onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    addItem({ productId: product.id, slug: product.slug, name: product.name, image, price: product.price });
                }}
                disabled={product.stock < 1}
                className="glow-btn mt-auto py-2.5 rounded-full text-sm font-semibold disabled:opacity-40 disabled:cursor-not-allowed disabled:shadow-none"
            >
                {product.stock < 1 ? "Esgotado" : "Comprar"}
            </button>
        </Link>
    );
}