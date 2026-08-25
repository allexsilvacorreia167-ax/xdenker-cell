"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Product } from "@/lib/supabase";
import { useCartStore } from "@/lib/store/cart";
import { ChevronDown, Sparkles } from "lucide-react";
import ProductImageCarousel from "./ProductImageCarousel";

function formatPrice(value: number) {
    return value.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

const specLabels: { key: string; label: string }[] = [
    { key: "camera", label: "Câmera" },
    { key: "battery", label: "Bateria" },
    { key: "processor", label: "Processador" },
    { key: "connectivity", label: "Conectividade" },
];

type PromoInfo = { price: number; original: number; label: string } | null;

export default function ProductDetailClient({
    product,
    promo = null,
}: {
    product: Product & { specs?: Record<string, string> };
    promo?: PromoInfo;
}) {
    const router = useRouter();
    const addItem = useCartStore((s) => s.addItem);
    const [storage, setStorage] = useState(product.variations?.storage?.[0] ?? "");
    const [color, setColor] = useState(product.variations?.colors?.[0] ?? "");
    const [openSpec, setOpenSpec] = useState<string | null>(null);

    const variantLabel = [storage, color].filter(Boolean).join(" - ");
    const finalPrice = promo ? promo.price : product.price;

    function handleAddToCart() {
        addItem({
            productId: product.id,
            slug: product.slug,
            name: product.name,
            image: product.images?.[0] || "",
            price: finalPrice,
            variant: promo ? [variantLabel, promo.label].filter(Boolean).join(" - ") : variantLabel || undefined,
        });
    }

    function handleBuyNow() {
        handleAddToCart();
        router.push("/carrinho");
    }

    return (
        <div>
            {promo && (
                <div className="mb-4 flex items-center gap-2 glass rounded-full px-4 py-2 w-fit border border-amber-400/30">
                    <Sparkles className="w-4 h-4 text-amber-300" />
                    <span className="text-sm font-semibold text-amber-300">{promo.label} — desconto já aplicado</span>
                </div>
            )}

            <div className="grid lg:grid-cols-2 gap-6">
                <div className="glass-strong rounded-2xl p-6">
                    <ProductImageCarousel images={product.images ?? []} name={product.name} />
                </div>

                <div className="glass rounded-2xl p-6 flex flex-col">
                    <h1 className="text-xl font-bold mb-3">{product.name}</h1>
                    {product.description && (
                        <p className="text-sm text-gray-300 mb-4 whitespace-pre-line">{product.description}</p>
                    )}

                    {product.variations?.storage && product.variations.storage.length > 0 && (
                        <div className="flex gap-2 mb-4 flex-wrap">
                            {product.variations.storage.map((s) => (
                                <button
                                    key={s}
                                    onClick={() => setStorage(s)}
                                    className={`px-4 py-2 rounded-full text-xs font-medium border transition ${storage === s ? "bg-blue-500/20 border-blue-400/50 text-blue-300" : "glass border-white/10 text-gray-300"
                                        }`}
                                >
                                    {s}
                                </button>
                            ))}
                        </div>
                    )}

                    {product.variations?.colors && product.variations.colors.length > 0 && (
                        <div className="flex gap-2 mb-6 flex-wrap">
                            {product.variations.colors.map((c) => (
                                <button
                                    key={c}
                                    onClick={() => setColor(c)}
                                    className={`px-4 py-2 rounded-full text-xs font-medium border transition ${color === c ? "bg-blue-500/20 border-blue-400/50 text-blue-300" : "glass border-white/10 text-gray-300"
                                        }`}
                                >
                                    {c}
                                </button>
                            ))}
                        </div>
                    )}

                    <div className="mb-4">
                        {promo && (
                            <div className="text-gray-500 text-sm line-through">{formatPrice(promo.original)}</div>
                        )}
                        <div className="text-2xl font-bold text-cyan-400">{formatPrice(finalPrice)}</div>
                    </div>

                    <div className="flex gap-3 mb-2">
                        <button
                            onClick={handleAddToCart}
                            disabled={product.stock < 1}
                            className="glow-btn flex-1 py-3 rounded-full text-sm font-semibold disabled:opacity-40 disabled:cursor-not-allowed disabled:shadow-none"
                        >
                            {product.stock < 1 ? "Esgotado" : "Adicionar ao Carrinho"}
                        </button>
                        <button
                            onClick={handleBuyNow}
                            disabled={product.stock < 1}
                            className="glass px-6 py-3 rounded-full text-sm font-semibold border border-cyan-400/30 disabled:opacity-40 disabled:cursor-not-allowed"
                        >
                            Comprar Agora
                        </button>
                    </div>
                    {product.stock > 0 && product.stock <= 5 && (
                        <p className="text-xs text-amber-400 mt-2">Últimas {product.stock} unidades</p>
                    )}
                </div>
            </div>

            <div className="mt-6 glass rounded-2xl divide-y divide-white/5">
                {specLabels.map((section) => {
                    const value = product.specs?.[section.key];
                    return (
                        <div key={section.key}>
                            <button
                                onClick={() => setOpenSpec(openSpec === section.key ? null : section.key)}
                                className="w-full flex items-center justify-between px-5 py-4 text-sm font-medium"
                            >
                                {section.label}
                                <ChevronDown className={`w-4 h-4 transition-transform ${openSpec === section.key ? "rotate-180" : ""}`} />
                            </button>
                            {openSpec === section.key && (
                                <div className="px-5 pb-4 text-sm text-gray-400 whitespace-pre-line">
                                    {value && value.trim() ? value : "Especificação ainda não cadastrada para este produto."}
                                </div>
                            )}
                        </div>
                    );
                })}
            </div>
        </div>
    );
}