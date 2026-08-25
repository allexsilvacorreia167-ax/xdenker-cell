"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Header from "@/components/layout/Header";
import BottomNav from "@/components/layout/BottomNav";
import { useCartStore } from "@/lib/store/cart";
import { supabase } from "@/lib/supabase";

function formatPrice(value: number) {
    return value.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

type PaymentMethod = "cartao" | "pix" | "boleto";

export default function CheckoutPagamentoPage() {
    const router = useRouter();
    const { items, subtotal, clearCart } = useCartStore();
    const [info, setInfo] = useState<Record<string, string> | null>(null);
    const [method, setMethod] = useState<PaymentMethod>("cartao");
    const [card, setCard] = useState({ name: "", number: "", cvv: "", expiry: "", installments: "1" });
    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const raw = sessionStorage.getItem("xdenker-checkout-info");
        if (!raw) {
            router.replace("/checkout");
            return;
        }
        setInfo(JSON.parse(raw));
    }, [router]);

    const total = subtotal();

    async function handleConfirm() {
        if (!info) return;
        setSubmitting(true);
        setError(null);

        const {
            data: { user },
        } = await supabase.auth.getUser();

        const { error: insertError } = await supabase.from("orders").insert({
            user_id: user?.id ?? null,
            status: "pending",
            total,
            items,
            shipping_address: info,
            payment_method: method,
        });

        setSubmitting(false);

        if (insertError) {
            setError("Não foi possível confirmar o pagamento. Tente novamente.");
            return;
        }

        sessionStorage.removeItem("xdenker-checkout-info");
        clearCart();
        router.push("/");
    }

    if (items.length === 0) {
        return (
            <>
                <Header />
                <main className="px-4 py-10 max-w-lg mx-auto text-center pb-28">
                    <p className="text-gray-400 mb-4">Seu carrinho está vazio.</p>
                    <button onClick={() => router.push("/")} className="glow-btn px-6 py-3 rounded-full text-sm font-semibold">
                        Voltar para Home
                    </button>
                </main>
                <BottomNav />
            </>
        );
    }

    return (
        <>
            <Header />
            <main className="px-4 lg:px-8 py-6 pb-28 lg:pb-12 max-w-2xl mx-auto">
                <h1 className="text-xl font-bold mb-6 text-center">Checkout e Pagamento</h1>

                <div className="glass rounded-2xl p-5 mb-5">
                    <h2 className="text-sm font-semibold mb-4">Resumo do Pedido</h2>
                    <div className="space-y-2 mb-3">
                        {items.map((item) => (
                            <div key={`${item.productId}-${item.variant ?? ""}`} className="flex justify-between text-sm">
                                <span className="text-gray-300">
                                    {item.quantity}x {item.name}
                                </span>
                                <span>{formatPrice(item.price * item.quantity)}</span>
                            </div>
                        ))}
                    </div>
                    <div className="flex justify-between text-sm font-semibold border-t border-white/10 pt-3">
                        <span>Subtotal</span>
                        <span>{formatPrice(total)}</span>
                    </div>
                </div>

                {info && (
                    <div className="glass rounded-2xl p-5 mb-5">
                        <h2 className="text-sm font-semibold mb-2">Endereço de Entrega</h2>
                        <p className="text-sm text-gray-300">
                            {info.street}, {info.number}
                            {info.complement ? ` - ${info.complement}` : ""}, {info.neighborhood}, {info.city} - {info.state}, {info.cep}
                        </p>
                        <p className="text-xs text-emerald-400 mt-1">Estimativa de Entrega: 3 dias úteis</p>
                    </div>
                )}

                <div className="glass rounded-2xl p-5 mb-5">
                    <h2 className="text-sm font-semibold mb-4">Forma de Pagamento</h2>
                    <div className="grid grid-cols-3 gap-2 mb-4">
                        {(
                            [
                                { value: "cartao", label: "Cartão de Crédito" },
                                { value: "pix", label: "PIX" },
                                { value: "boleto", label: "Boleto Bancário" },
                            ] as { value: PaymentMethod; label: string }[]
                        ).map((opt) => (
                            <button
                                key={opt.value}
                                onClick={() => setMethod(opt.value)}
                                className={`py-3 rounded-xl text-xs font-medium border transition ${method === opt.value
                                    ? "bg-blue-500/20 border-blue-400/50 text-blue-300"
                                    : "glass border-white/10 text-gray-300"
                                    }`}
                            >
                                {opt.label}
                            </button>
                        ))}
                    </div>

                    {method === "cartao" && (
                        <div className="grid grid-cols-2 gap-3">
                            <input
                                placeholder="Nome no Cartão"
                                value={card.name}
                                onChange={(e) => setCard((c) => ({ ...c, name: e.target.value }))}
                                className="col-span-2 glass rounded-xl px-4 py-3 text-sm outline-none focus:border-blue-400/50"
                            />
                            <input
                                placeholder="Número"
                                value={card.number}
                                onChange={(e) => setCard((c) => ({ ...c, number: e.target.value }))}
                                className="glass rounded-xl px-4 py-3 text-sm outline-none focus:border-blue-400/50"
                            />
                            <input
                                placeholder="CVV"
                                value={card.cvv}
                                onChange={(e) => setCard((c) => ({ ...c, cvv: e.target.value }))}
                                className="glass rounded-xl px-4 py-3 text-sm outline-none focus:border-blue-400/50"
                            />
                            <input
                                placeholder="Validade"
                                value={card.expiry}
                                onChange={(e) => setCard((c) => ({ ...c, expiry: e.target.value }))}
                                className="glass rounded-xl px-4 py-3 text-sm outline-none focus:border-blue-400/50"
                            />
                            <select
                                value={card.installments}
                                onChange={(e) => setCard((c) => ({ ...c, installments: e.target.value }))}
                                className="glass rounded-xl px-4 py-3 text-sm outline-none focus:border-blue-400/50 bg-transparent"
                            >
                                {[1, 2, 3, 4, 5, 6].map((n) => (
                                    <option key={n} value={n} className="bg-slate-900">
                                        {n}x sem juros
                                    </option>
                                ))}
                            </select>
                        </div>
                    )}
                    {method === "pix" && (
                        <p className="text-sm text-gray-400">O QR Code PIX será gerado após a confirmação do pedido.</p>
                    )}
                    {method === "boleto" && (
                        <p className="text-sm text-gray-400">O boleto será emitido após a confirmação e enviado por e-mail.</p>
                    )}
                </div>

                <div className="glass-strong rounded-2xl p-5 mb-5">
                    <div className="flex justify-between text-sm text-gray-300 mb-1">
                        <span>Subtotal</span>
                        <span>{formatPrice(total)}</span>
                    </div>
                    <div className="flex justify-between text-sm text-gray-300 mb-3">
                        <span>Frete</span>
                        <span className="text-emerald-400">Grátis</span>
                    </div>
                    <div className="flex justify-between text-base font-bold border-t border-white/10 pt-3">
                        <span>Total</span>
                        <span className="text-cyan-400">{formatPrice(total)}</span>
                    </div>
                </div>

                {error && <p className="text-sm text-red-400 mb-4 text-center">{error}</p>}

                <button
                    onClick={handleConfirm}
                    disabled={submitting}
                    className="glow-btn w-full py-3 rounded-full text-sm font-semibold disabled:opacity-50"
                >
                    {submitting ? "Confirmando..." : "Confirmar Pagamento"}
                </button>
            </main>
            <BottomNav />
        </>
    );
}