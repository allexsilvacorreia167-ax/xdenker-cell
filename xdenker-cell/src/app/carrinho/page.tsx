"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import Header from "@/components/layout/Header";
import BottomNav from "@/components/layout/BottomNav";
import { useCartStore } from "@/lib/store/cart";
import { supabase } from "@/lib/supabase";
import { calcularFrete, type OpcaoFrete } from "@/services/freteService";
import { formatarCep } from "@/services/cepService";
import type { Address } from "@/components/ui/AddressBook";
import { Minus, Plus, X, Loader2, MapPin, Pencil, Tag } from "lucide-react";

function formatPrice(value: number) {
    return value.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

type AppliedCoupon = {
    code: string;
    discount_type: "percentage" | "fixed";
    discount_value: number;
};

export default function CarrinhoPage() {
    const {
        items,
        updateQuantity,
        removeItem,
        subtotal,
        freteSelecionado,
        setFrete,
        totalComFrete,
    } = useCartStore();

    // === Estados de Frete e Endereço ===
    const [cep, setCep] = useState("");
    const [opcoesFrete, setOpcoesFrete] = useState<OpcaoFrete[]>([]);
    const [carregandoFrete, setCarregandoFrete] = useState(false);
    const [erroFrete, setErroFrete] = useState("");

    const [loggedIn, setLoggedIn] = useState(false);
    const [loadingUser, setLoadingUser] = useState(true);
    const [enderecoPadrao, setEnderecoPadrao] = useState<Address | null>(null);
    const [mostrarCepManual, setMostrarCepManual] = useState(false);

    // === Estados de Cupom ===
    const [couponInput, setCouponInput] = useState("");
    const [applied, setApplied] = useState<AppliedCoupon | null>(null);
    const [couponError, setCouponError] = useState<string | null>(null);
    const [checking, setChecking] = useState(false);

    const subtotalValue = subtotal();

    // Cálculo do desconto do cupom
    const discountAmount = applied
        ? applied.discount_type === "percentage"
            ? subtotalValue * (applied.discount_value / 100)
            : Math.min(applied.discount_value, subtotalValue)
        : 0;

    const subtotalComDesconto = Math.max(0, subtotalValue - discountAmount);

    // Carrega usuário e endereço padrão do Supabase
    useEffect(() => {
        async function loadUser() {
            try {
                const { data: { user } } = await supabase.auth.getUser();

                if (user) {
                    setLoggedIn(true);
                    const addresses = (user.user_metadata?.addresses as Address[]) || [];
                    const padrao = addresses.find((a) => a.isDefault) || addresses[0] || null;
                    setEnderecoPadrao(padrao);

                    if (padrao?.cep) {
                        await calcularFreteAutomatico(padrao.cep);
                    }
                }
            } catch (err) {
                console.error(err);
            } finally {
                setLoadingUser(false);
            }
        }
        loadUser();
    }, []);

    async function calcularFreteAutomatico(cepValue: string) {
        setCarregandoFrete(true);
        setErroFrete("");
        try {
            const resultado = await calcularFrete(cepValue, subtotalComDesconto);
            if (resultado.sucesso) {
                setOpcoesFrete(resultado.opcoes);
                if (resultado.opcoes.length > 0) {
                    const atual = freteSelecionado
                        ? resultado.opcoes.find((o) => o.id === freteSelecionado.id)
                        : null;
                    setFrete(atual || resultado.opcoes[0], cepValue);
                }
            } else {
                setErroFrete(resultado.mensagem || "Erro ao calcular frete");
            }
        } catch {
            setErroFrete("Não foi possível calcular o frete.");
        } finally {
            setCarregandoFrete(false);
        }
    }

    async function handleCalcularFrete() {
        await calcularFreteAutomatico(cep);
    }

    async function handleApplyCoupon(e: React.FormEvent) {
        e.preventDefault();
        if (!couponInput.trim()) return;
        setChecking(true);
        setCouponError(null);

        const { data, error } = await supabase
            .from("coupons")
            .select("code, discount_type, discount_value, usage_limit, usage_count, expires_at, active")
            .eq("code", couponInput.trim().toUpperCase())
            .maybeSingle();

        setChecking(false);

        if (error || !data || !data.active) {
            setCouponError("Cupom inválido ou inexistente.");
            return;
        }
        if (data.expires_at && new Date(data.expires_at) < new Date()) {
            setCouponError("Esse cupom expirou.");
            return;
        }
        if (data.usage_limit && data.usage_count >= data.usage_limit) {
            setCouponError("Esse cupom já atingiu o limite de usos.");
            return;
        }

        setApplied({ code: data.code, discount_type: data.discount_type, discount_value: data.discount_value });
        setCouponError(null);
    }

    function removeCoupon() {
        setApplied(null);
        setCouponInput("");
    }

    return (
        <>
            <Header />
            <main className="px-4 lg:px-8 py-6 pb-28 lg:pb-12 max-w-7xl mx-auto">
                <h1 className="text-xl lg:text-2xl font-bold mb-6">Seu Carrinho de Compras</h1>

                {items.length === 0 ? (
                    <div className="glass rounded-2xl p-10 text-center">
                        <p className="text-gray-400 mb-4">Seu carrinho está vazio.</p>
                        <Link href="/" className="glow-btn px-6 py-3 rounded-full text-sm font-semibold inline-block">
                            Continuar Comprando
                        </Link>
                    </div>
                ) : (
                    <div className="grid lg:grid-cols-3 gap-6">
                        {/* Lista de produtos */}
                        <div className="lg:col-span-2 glass rounded-2xl p-4 lg:p-6 space-y-4">
                            {items.map((item) => (
                                <div
                                    key={`${item.productId}-${item.variant ?? ""}`}
                                    className="flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-4 border-b border-white/5 pb-4 last:border-0 last:pb-0"
                                >
                                    <div className="flex items-center gap-3 flex-1 min-w-0">
                                        <Link
                                            href={`/produto/${item.slug}`}
                                            className="w-16 h-16 rounded-xl bg-gradient-to-b from-slate-600 to-slate-900 border border-white/10 overflow-hidden flex-shrink-0 hover:border-cyan-400/40 transition"
                                        >
                                            {item.image && (
                                                // eslint-disable-next-line @next/next/no-img-element
                                                <img src={item.image} alt={item.name} className="w-full h-full object-cover" />
                                            )}
                                        </Link>
                                        <Link href={`/produto/${item.slug}`} className="flex-1 min-w-0 hover:text-cyan-300 transition">
                                            <div className="text-sm font-medium truncate">{item.name}</div>
                                            {item.variant && <div className="text-xs text-gray-400 truncate">{item.variant}</div>}
                                        </Link>
                                        <button
                                            onClick={() => removeItem(item.productId, item.variant)}
                                            className="text-gray-500 hover:text-red-400 transition flex-shrink-0 sm:hidden"
                                        >
                                            <X className="w-4 h-4" />
                                        </button>
                                    </div>

                                    <div className="flex items-center justify-between sm:justify-end gap-3 sm:gap-4 flex-shrink-0">
                                        <div className="flex items-center gap-2 glass rounded-full px-1 py-1">
                                            <button
                                                onClick={() => updateQuantity(item.productId, item.quantity - 1, item.variant)}
                                                className="w-7 h-7 rounded-full flex items-center justify-center hover:bg-white/10"
                                            >
                                                <Minus className="w-3.5 h-3.5" />
                                            </button>
                                            <span className="text-sm w-5 text-center">{item.quantity}</span>
                                            <button
                                                onClick={() => updateQuantity(item.productId, item.quantity + 1, item.variant)}
                                                className="w-7 h-7 rounded-full flex items-center justify-center hover:bg-white/10"
                                            >
                                                <Plus className="w-3.5 h-3.5" />
                                            </button>
                                        </div>
                                        <div className="text-sm font-semibold text-cyan-400 sm:w-24 sm:text-right">
                                            {formatPrice(item.price * item.quantity)}
                                        </div>
                                        <button
                                            onClick={() => removeItem(item.productId, item.variant)}
                                            className="hidden sm:block text-gray-500 hover:text-red-400 transition flex-shrink-0"
                                        >
                                            <X className="w-4 h-4" />
                                        </button>
                                    </div>
                                </div>
                            ))}
                            <Link href="/" className="inline-block text-sm text-cyan-400 hover:underline mt-2">
                                Continuar Comprando
                            </Link>
                        </div>

                        {/* Coluna da direita (Frete, Cupom e Resumo) */}
                        <div className="space-y-4">
                            {/* ===== FRETE E ENDEREÇO ===== */}
                            <div className="glass rounded-2xl p-5">
                                <h2 className="text-sm font-semibold mb-3">Frete e Entrega</h2>

                                {loadingUser ? (
                                    <div className="flex items-center gap-2 text-sm text-gray-400">
                                        <Loader2 className="w-4 h-4 animate-spin" /> Carregando...
                                    </div>
                                ) : loggedIn && enderecoPadrao && !mostrarCepManual ? (
                                    <div className="space-y-3">
                                        <div className="flex items-start gap-3 p-3 rounded-xl bg-white/5 border border-white/10">
                                            <MapPin className="w-4 h-4 text-cyan-400 mt-0.5 flex-shrink-0" />
                                            <div className="min-w-0 flex-1">
                                                <div className="text-sm font-medium">
                                                    {enderecoPadrao.label || "Endereço"}{" "}
                                                    <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-blue-500/20 text-blue-300 ml-1">
                                                        Padrão
                                                    </span>
                                                </div>
                                                <p className="text-xs text-gray-400 mt-0.5">
                                                    {enderecoPadrao.street}, {enderecoPadrao.number}
                                                    {enderecoPadrao.complement ? ` - ${enderecoPadrao.complement}` : ""}
                                                    <br />
                                                    {enderecoPadrao.neighborhood}, {enderecoPadrao.city} - {enderecoPadrao.state}
                                                    <br />
                                                    CEP {enderecoPadrao.cep}
                                                </p>
                                            </div>
                                        </div>

                                        <button
                                            onClick={() => setMostrarCepManual(true)}
                                            className="text-xs text-cyan-400 hover:underline flex items-center gap-1"
                                        >
                                            <Pencil className="w-3 h-3" />
                                            Usar outro endereço / CEP
                                        </button>
                                    </div>
                                ) : (
                                    <div className="space-y-3">
                                        {loggedIn && (
                                            <button
                                                onClick={() => setMostrarCepManual(false)}
                                                className="text-xs text-cyan-400 hover:underline"
                                            >
                                                ← Voltar para endereço cadastrado
                                            </button>
                                        )}
                                        <div className="flex gap-2">
                                            <input
                                                type="text"
                                                placeholder="00000-000"
                                                value={cep}
                                                onChange={(e) => setCep(formatarCep(e.target.value))}
                                                maxLength={9}
                                                className="flex-1 glass rounded-xl px-4 py-2.5 text-sm outline-none focus:border-cyan-400/50"
                                            />
                                            <button
                                                type="button"
                                                onClick={handleCalcularFrete}
                                                disabled={carregandoFrete || cep.replace(/\D/g, "").length !== 8}
                                                className="glow-btn px-4 py-2.5 rounded-xl text-xs font-semibold disabled:opacity-50 flex items-center gap-2"
                                            >
                                                {carregandoFrete ? <Loader2 className="w-4 h-4 animate-spin" /> : "Calcular"}
                                            </button>
                                        </div>
                                    </div>
                                )}

                                {erroFrete && <p className="text-xs text-red-400 mt-2">{erroFrete}</p>}

                                {opcoesFrete.length > 0 && (
                                    <div className="mt-4 space-y-2">
                                        {opcoesFrete.map((opcao) => (
                                            <label
                                                key={opcao.id}
                                                className={`flex items-center justify-between p-3 rounded-xl cursor-pointer border transition ${freteSelecionado?.id === opcao.id
                                                    ? "border-cyan-400/60 bg-cyan-500/10"
                                                    : "border-white/10 hover:border-white/20"
                                                    }`}
                                            >
                                                <div className="flex items-center gap-3">
                                                    <input
                                                        type="radio"
                                                        name="frete"
                                                        checked={freteSelecionado?.id === opcao.id}
                                                        onChange={() => setFrete(opcao, cep || enderecoPadrao?.cep)}
                                                        className="accent-cyan-400"
                                                    />
                                                    <div>
                                                        <div className="text-sm font-medium">{opcao.nome}</div>
                                                        <div className="text-xs text-gray-400">{opcao.prazo}</div>
                                                    </div>
                                                </div>
                                                <div className="text-sm font-semibold text-cyan-400">
                                                    {opcao.gratis || opcao.preco === 0 ? "Grátis" : formatPrice(opcao.preco)}
                                                </div>
                                            </label>
                                        ))}
                                    </div>
                                )}
                            </div>

                            {/* ===== RESUMO DO PEDIDO E CUPOM ===== */}
                            <div className="glass-strong rounded-2xl p-5 lg:p-6 h-fit">
                                <h2 className="text-base lg:text-lg font-semibold mb-4">Resumo do Pedido</h2>

                                {!applied ? (
                                    <form onSubmit={handleApplyCoupon} className="flex gap-2 mb-4">
                                        <div className="flex-1 relative">
                                            <Tag className="w-3.5 h-3.5 text-gray-500 absolute left-3 top-1/2 -translate-y-1/2" />
                                            <input
                                                value={couponInput}
                                                onChange={(e) => setCouponInput(e.target.value)}
                                                placeholder="Cupom de desconto"
                                                className="w-full glass rounded-full pl-9 pr-3 py-2.5 text-sm outline-none focus:border-blue-400/50 uppercase"
                                            />
                                        </div>
                                        <button
                                            type="submit"
                                            disabled={checking}
                                            className="glass px-4 py-2.5 rounded-full text-xs font-semibold border border-cyan-400/30 disabled:opacity-50"
                                        >
                                            {checking ? "..." : "Aplicar"}
                                        </button>
                                    </form>
                                ) : (
                                    <div className="flex items-center justify-between glass rounded-full px-4 py-2.5 mb-4 border border-emerald-400/30">
                                        <span className="text-xs text-emerald-400 font-medium flex items-center gap-1.5">
                                            <Tag className="w-3.5 h-3.5" />
                                            {applied.code} aplicado
                                        </span>
                                        <button type="button" onClick={removeCoupon} className="text-gray-400 hover:text-red-400">
                                            <X className="w-3.5 h-3.5" />
                                        </button>
                                    </div>
                                )}
                                {couponError && <p className="text-xs text-red-400 mb-4">{couponError}</p>}

                                <div className="flex justify-between text-sm text-gray-300 mb-2">
                                    <span>Subtotal</span>
                                    <span>{formatPrice(subtotalValue)}</span>
                                </div>
                                {applied && (
                                    <div className="flex justify-between text-sm text-emerald-400 mb-2">
                                        <span>Desconto ({applied.code})</span>
                                        <span>-{formatPrice(discountAmount)}</span>
                                    </div>
                                )}
                                <div className="flex justify-between text-sm text-gray-300 mb-4">
                                    <span>Frete</span>
                                    <span className={freteSelecionado?.gratis || freteSelecionado?.preco === 0 ? "text-emerald-400" : ""}>
                                        {freteSelecionado
                                            ? freteSelecionado.gratis || freteSelecionado.preco === 0
                                                ? "Grátis"
                                                : formatPrice(freteSelecionado.preco)
                                            : "A calcular"}
                                    </span>
                                </div>
                                <div className="flex justify-between text-base font-bold border-t border-white/10 pt-4 mb-6">
                                    <span>Total</span>
                                    <span className="text-cyan-400">
                                        {formatPrice(freteSelecionado ? totalComFrete() : subtotalComDesconto)}
                                    </span>
                                </div>
                                <Link
                                    href="/checkout"
                                    className="glow-btn w-full py-3 rounded-full text-sm font-semibold text-center block"
                                >
                                    Finalizar Compra
                                </Link>
                            </div>
                        </div>
                    </div>
                )}
            </main>
            <BottomNav />
        </>
    );
}