"use client";

import { useEffect, useRef, useState } from "react";
import { supabase, Product } from "@/lib/supabase";
import { getProductByBarcode, searchProducts } from "@/lib/queries";
import { Barcode, Search, Minus, Plus, X, Check } from "lucide-react";

type CartItem = {
    productId: string;
    name: string;
    price: number;
    quantity: number;
    stock: number;
};

function formatPrice(value: number) {
    return value.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

type PaymentMethod = "dinheiro" | "pix" | "credito" | "debito";

export default function PdvPage() {
    const [barcodeInput, setBarcodeInput] = useState("");
    const [searchQuery, setSearchQuery] = useState("");
    const [searchResults, setSearchResults] = useState<Product[]>([]);
    const [cart, setCart] = useState<CartItem[]>([]);
    const [method, setMethod] = useState<PaymentMethod>("dinheiro");
    const [cashReceived, setCashReceived] = useState("");
    const [processing, setProcessing] = useState(false);
    const [feedback, setFeedback] = useState<{ type: "error" | "success"; text: string } | null>(null);
    const barcodeRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        barcodeRef.current?.focus();
    }, []);

    useEffect(() => {
        if (!searchQuery.trim()) {
            setSearchResults([]);
            return;
        }
        const timer = setTimeout(async () => {
            const results = await searchProducts(searchQuery);
            setSearchResults(results);
        }, 250);
        return () => clearTimeout(timer);
    }, [searchQuery]);

    function addToCart(product: Product) {
        if (product.stock < 1) {
            setFeedback({ type: "error", text: `${product.name} está sem estoque.` });
            setTimeout(() => setFeedback(null), 2500);
            return;
        }
        setCart((prev) => {
            const existing = prev.find((i) => i.productId === product.id);
            if (existing) {
                if (existing.quantity >= product.stock) {
                    setFeedback({ type: "error", text: `Estoque máximo atingido para ${product.name}.` });
                    setTimeout(() => setFeedback(null), 2500);
                    return prev;
                }
                return prev.map((i) => (i.productId === product.id ? { ...i, quantity: i.quantity + 1 } : i));
            }
            return [...prev, { productId: product.id, name: product.name, price: product.price, quantity: 1, stock: product.stock }];
        });
    }

    async function handleBarcodeSubmit(e: React.FormEvent) {
        e.preventDefault();
        const code = barcodeInput.trim();
        if (!code) return;
        setBarcodeInput("");

        const product = await getProductByBarcode(code);
        if (!product) {
            setFeedback({ type: "error", text: `Nenhum produto encontrado com o código ${code}.` });
            setTimeout(() => setFeedback(null), 2500);
            return;
        }
        addToCart(product);
        barcodeRef.current?.focus();
    }

    function updateQuantity(productId: string, quantity: number) {
        setCart((prev) => {
            if (quantity < 1) return prev.filter((i) => i.productId !== productId);
            return prev.map((i) => (i.productId === productId ? { ...i, quantity: Math.min(quantity, i.stock) } : i));
        });
    }

    function removeItem(productId: string) {
        setCart((prev) => prev.filter((i) => i.productId !== productId));
    }

    const total = cart.reduce((sum, i) => sum + i.price * i.quantity, 0);
    const received = parseFloat(cashReceived) || 0;
    const change = method === "dinheiro" ? Math.max(0, received - total) : 0;

    async function handleFinalizeSale() {
        if (cart.length === 0) return;
        if (method === "dinheiro" && received < total) {
            setFeedback({ type: "error", text: "Valor recebido é menor que o total da venda." });
            setTimeout(() => setFeedback(null), 2500);
            return;
        }

        setProcessing(true);

        const orderItems = cart.map((i) => ({ name: i.name, quantity: i.quantity, price: i.price }));

        const { error: orderError } = await supabase.from("orders").insert({
            user_id: null,
            status: "paid",
            total,
            items: orderItems,
            payment_method: method,
            source: "pdv",
            change_amount: method === "dinheiro" ? change : null,
        });

        if (orderError) {
            setProcessing(false);
            setFeedback({ type: "error", text: "Erro ao registrar a venda: " + orderError.message });
            setTimeout(() => setFeedback(null), 3000);
            return;
        }

        // Baixa de estoque item por item
        for (const item of cart) {
            const { data: current } = await supabase.from("products").select("stock").eq("id", item.productId).single();
            const newStock = Math.max(0, (current?.stock ?? item.stock) - item.quantity);
            await supabase.from("products").update({ stock: newStock }).eq("id", item.productId);
        }

        setProcessing(false);
        setFeedback({ type: "success", text: `Venda de ${formatPrice(total)} finalizada com sucesso!` });
        setCart([]);
        setCashReceived("");
        setSearchQuery("");
        setSearchResults([]);
        barcodeRef.current?.focus();
        setTimeout(() => setFeedback(null), 3500);
    }

    return (
        <div className="p-6 lg:p-8 bg-[#0b0f19] min-h-screen">
            <h1 className="text-2xl font-bold text-white mb-6 flex items-center gap-2">
                <Barcode className="w-6 h-6 text-cyan-400" />
                PDV / Caixa
            </h1>

            {feedback && (
                <div
                    className={`rounded-xl px-4 py-3 mb-4 text-sm ${feedback.type === "error" ? "bg-red-500/10 text-red-400 border border-red-400/30" : "bg-emerald-500/10 text-emerald-400 border border-emerald-400/30"
                        }`}
                >
                    {feedback.text}
                </div>
            )}

            <div className="grid lg:grid-cols-3 gap-6">
                {/* Coluna esquerda: leitor + busca + carrinho */}
                <div className="lg:col-span-2 space-y-4">
                    <form onSubmit={handleBarcodeSubmit} className="glass rounded-2xl p-4">
                        <label className="text-xs text-gray-400 mb-1 block flex items-center gap-1.5">
                            <Barcode className="w-3.5 h-3.5" />
                            Leitor de Código de Barras
                        </label>
                        <input
                            ref={barcodeRef}
                            value={barcodeInput}
                            onChange={(e) => setBarcodeInput(e.target.value)}
                            placeholder="Escaneie ou digite o código e pressione Enter"
                            autoComplete="off"
                            className="w-full glass rounded-xl px-4 py-3 text-sm outline-none focus:border-cyan-400/50 transition font-mono"
                        />
                    </form>

                    <div className="glass rounded-2xl p-4">
                        <label className="text-xs text-gray-400 mb-1 block flex items-center gap-1.5">
                            <Search className="w-3.5 h-3.5" />
                            Busca Manual (nome do produto)
                        </label>
                        <input
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            placeholder="Ex: iPhone 15 Pro Max, Processador AMD Ryzen..."
                            className="w-full glass rounded-xl px-4 py-3 text-sm outline-none focus:border-blue-400/50 transition"
                        />
                        {searchResults.length > 0 && (
                            <div className="mt-3 space-y-2 max-h-64 overflow-y-auto">
                                {searchResults.map((p) => (
                                    <button
                                        key={p.id}
                                        onClick={() => addToCart(p)}
                                        className="w-full flex items-center justify-between px-3 py-2.5 rounded-xl glass hover:border-cyan-400/40 transition text-left"
                                    >
                                        <div className="min-w-0">
                                            <div className="text-sm text-white truncate">{p.name}</div>
                                            <div className="text-xs text-gray-500">Estoque: {p.stock}</div>
                                        </div>
                                        <span className="text-sm text-cyan-400 font-medium flex-shrink-0 ml-3">{formatPrice(p.price)}</span>
                                    </button>
                                ))}
                            </div>
                        )}
                    </div>

                    <div className="glass rounded-2xl overflow-hidden">
                        <div className="px-4 py-3 border-b border-white/5 text-sm font-semibold text-white">
                            Itens da Venda ({cart.length})
                        </div>
                        {cart.length === 0 ? (
                            <p className="text-sm text-gray-500 p-6 text-center">
                                Nenhum item ainda. Escaneie um código de barras ou busque por nome.
                            </p>
                        ) : (
                            <table className="w-full text-sm">
                                <thead>
                                    <tr className="text-left text-gray-400 text-xs uppercase border-b border-white/5">
                                        <th className="px-4 py-2">Produto</th>
                                        <th className="px-4 py-2">Qtd</th>
                                        <th className="px-4 py-2">Unitário</th>
                                        <th className="px-4 py-2">Subtotal</th>
                                        <th className="px-4 py-2"></th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {cart.map((item) => (
                                        <tr key={item.productId} className="border-b border-white/5 last:border-0">
                                            <td className="px-4 py-3 text-white">{item.name}</td>
                                            <td className="px-4 py-3">
                                                <div className="flex items-center gap-1.5">
                                                    <button
                                                        onClick={() => updateQuantity(item.productId, item.quantity - 1)}
                                                        className="w-6 h-6 rounded-full glass flex items-center justify-center"
                                                    >
                                                        <Minus className="w-3 h-3" />
                                                    </button>
                                                    <span className="w-6 text-center">{item.quantity}</span>
                                                    <button
                                                        onClick={() => updateQuantity(item.productId, item.quantity + 1)}
                                                        className="w-6 h-6 rounded-full glass flex items-center justify-center"
                                                    >
                                                        <Plus className="w-3 h-3" />
                                                    </button>
                                                </div>
                                            </td>
                                            <td className="px-4 py-3 text-gray-400">{formatPrice(item.price)}</td>
                                            <td className="px-4 py-3 text-cyan-400 font-medium">{formatPrice(item.price * item.quantity)}</td>
                                            <td className="px-4 py-3">
                                                <button onClick={() => removeItem(item.productId)} className="text-gray-500 hover:text-red-400">
                                                    <X className="w-4 h-4" />
                                                </button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        )}
                    </div>
                </div>

                {/* Coluna direita: pagamento */}
                <div className="glass-strong rounded-2xl p-5 h-fit">
                    <h2 className="text-sm font-semibold text-white mb-4">Resumo de Pagamento</h2>

                    <div className="text-3xl font-bold text-cyan-400 mb-5">{formatPrice(total)}</div>

                    <div className="grid grid-cols-2 gap-2 mb-4">
                        {(
                            [
                                { value: "dinheiro", label: "Dinheiro" },
                                { value: "pix", label: "PIX" },
                                { value: "credito", label: "Cartão Crédito" },
                                { value: "debito", label: "Cartão Débito" },
                            ] as { value: PaymentMethod; label: string }[]
                        ).map((opt) => (
                            <button
                                key={opt.value}
                                onClick={() => setMethod(opt.value)}
                                className={`py-2.5 rounded-xl text-xs font-medium border transition ${method === opt.value ? "bg-blue-500/20 border-blue-400/50 text-blue-300" : "glass border-white/10 text-gray-300"
                                    }`}
                            >
                                {opt.label}
                            </button>
                        ))}
                    </div>

                    {method === "dinheiro" && (
                        <div className="mb-4">
                            <label className="text-xs text-gray-400 mb-1 block">Valor Recebido</label>
                            <input
                                type="number"
                                step="0.01"
                                value={cashReceived}
                                onChange={(e) => setCashReceived(e.target.value)}
                                placeholder="0,00"
                                className="w-full glass rounded-xl px-4 py-2.5 text-sm outline-none focus:border-blue-400/50"
                            />
                            {received > 0 && (
                                <div className="flex justify-between text-sm mt-2">
                                    <span className="text-gray-400">Troco</span>
                                    <span className={`font-semibold ${change > 0 ? "text-emerald-400" : "text-gray-500"}`}>
                                        {formatPrice(change)}
                                    </span>
                                </div>
                            )}
                        </div>
                    )}

                    <button
                        onClick={handleFinalizeSale}
                        disabled={cart.length === 0 || processing}
                        className="glow-btn w-full py-3 rounded-full text-sm font-semibold flex items-center justify-center gap-2 disabled:opacity-40"
                    >
                        <Check className="w-4 h-4" />
                        {processing ? "Processando..." : "Finalizar Venda"}
                    </button>
                </div>
            </div>
        </div>
    );
}