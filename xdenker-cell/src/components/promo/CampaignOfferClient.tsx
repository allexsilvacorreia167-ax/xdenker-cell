"use client";

import { useRouter } from "next/navigation";
import Link from "next/link";
import { useCartStore } from "@/lib/store/cart";
import { PromoLeftItem, PromoKit } from "@/lib/queries";

function formatPrice(value: number) {
    return value.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

export default function CampaignOfferClient({
    leftItems,
    kit,
    campaignTitle,
}: {
    leftItems: PromoLeftItem[];
    kit: PromoKit | null;
    campaignTitle: string;
}) {
    const router = useRouter();
    const addItem = useCartStore((s) => s.addItem);

    function addItemToCart(item: PromoLeftItem) {
        addItem({
            productId: item.id,
            slug: item.product_slug || item.id,
            name: item.name,
            image: item.image_url || "",
            price: item.discount_price,
            variant: campaignTitle,
        });
    }

    function handleBuyOne(item: PromoLeftItem) {
        addItemToCart(item);
        router.push("/carrinho");
    }

    function handleClaimOffer() {
        leftItems.forEach((item) => addItemToCart(item));
        router.push("/carrinho");
    }

    function detailsHref(item: PromoLeftItem) {
        if (!item.product_slug) return null;
        const params = new URLSearchParams({
            promoPrice: String(item.discount_price),
            promoOriginal: String(item.original_price),
            promoLabel: campaignTitle,
        });
        return `/produto/${item.product_slug}?${params.toString()}`;
    }

    return (
        <div className="grid lg:grid-cols-3 gap-6">
            <div className="lg:col-span-1 space-y-4">
                {leftItems.map((item) => {
                    const discountPercent = Math.round(
                        ((item.original_price - item.discount_price) / item.original_price) * 100
                    );
                    const href = detailsHref(item);
                    return (
                        <div key={item.id} className="glass rounded-2xl p-4 flex items-center gap-4">
                            <div className="w-16 h-16 rounded-xl bg-slate-800 overflow-hidden flex-shrink-0">
                                {item.image_url && (
                                    // eslint-disable-next-line @next/next/no-img-element
                                    <img src={item.image_url} alt={item.name} className="w-full h-full object-cover" />
                                )}
                            </div>
                            <div className="flex-1 min-w-0">
                                <div className="text-sm font-medium text-white truncate mb-1">{item.name}</div>
                                <div className="text-gray-500 text-xs line-through">{formatPrice(item.original_price)}</div>
                                <div className="text-cyan-400 font-bold text-sm">{formatPrice(item.discount_price)}</div>
                                {item.installment_price && (
                                    <div className="text-[11px] text-gray-400">
                                        {item.installment_count}x {formatPrice(item.installment_price)}
                                    </div>
                                )}
                                {href ? (
                                    <Link href={href} className="text-[11px] text-cyan-400 hover:underline inline-block mt-1">
                                        Ver detalhes
                                    </Link>
                                ) : (
                                    <span className="text-[11px] text-gray-600 inline-block mt-1">
                                        Produto não vinculado ao estoque
                                    </span>
                                )}
                            </div>
                            <div className="flex-shrink-0 flex flex-col items-end gap-2">
                                <span className="inline-block bg-amber-400/20 text-amber-300 text-[10px] font-bold px-2 py-1 rounded-full">
                                    -{discountPercent}%
                                </span>
                                <button
                                    onClick={() => handleBuyOne(item)}
                                    className="glow-btn text-xs px-3 py-2 rounded-full font-semibold whitespace-nowrap"
                                >
                                    Comprar
                                </button>
                            </div>
                        </div>
                    );
                })}
            </div>

            {kit && (
                <div className="lg:col-span-2 glass rounded-2xl p-6 flex flex-col lg:flex-row gap-6 items-center">
                    <div className="w-full lg:w-56 aspect-square rounded-xl bg-slate-800 overflow-hidden flex-shrink-0">
                        {kit.image_url && (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img src={kit.image_url} alt={kit.title} className="w-full h-full object-cover" />
                        )}
                    </div>
                    <div className="flex-1">
                        <h2 className="text-lg font-bold text-white mb-1">{kit.title}</h2>
                        {kit.original_price && (
                            <div className="text-gray-500 text-sm line-through mb-3">{formatPrice(kit.original_price)}</div>
                        )}
                        {kit.items.length > 0 && (
                            <ul className="space-y-1.5 mb-5">
                                {kit.items.map((item, i) => (
                                    <li key={i} className="text-sm text-gray-300 flex items-center gap-2">
                                        <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 flex-shrink-0" />
                                        {item}
                                    </li>
                                ))}
                            </ul>
                        )}
                        <button onClick={handleClaimOffer} className="glow-btn px-6 py-3 rounded-full text-sm font-semibold">
                            {kit.cta_text}
                        </button>
                        <p className="text-[11px] text-gray-500 mt-2">
                            Adiciona os {leftItems.length} produtos da oferta ao carrinho com o preço promocional.
                        </p>
                    </div>
                </div>
            )}
        </div>
    );
}