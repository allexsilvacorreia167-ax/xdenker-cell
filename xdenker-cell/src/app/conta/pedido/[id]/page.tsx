"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import Header from "@/components/layout/Header";
import BottomNav from "@/components/layout/BottomNav";
import { supabase } from "@/lib/supabase";
import {
    CheckCircle2,
    Clock,
    Truck,
    Package,
    MapPin,
    Copy,
    Check,
    ChevronRight,
    ArrowLeft,
    MessageCircle,
} from "lucide-react";

type OrderItem = {
    productId?: string;
    slug?: string;
    name: string;
    image?: string;
    price: number;
    quantity: number;
    variant?: string;
};

type ShippingAddress = {
    label?: string;
    street?: string;
    number?: string;
    complement?: string;
    neighborhood?: string;
    city?: string;
    state?: string;
    cep?: string;
    name?: string;
    phone?: string;
};

type Order = {
    id: string;
    status: string;
    total: number;
    items: OrderItem[];
    shipping_address: ShippingAddress;
    payment_method: string;
    created_at: string;
    source?: string;
};

function formatPrice(value: number) {
    return value.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

function formatDate(dateStr: string) {
    return new Date(dateStr).toLocaleString("pt-BR", {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
    });
}

const statusConfig: Record<
    string,
    { label: string; color: string; bg: string; icon: any }
> = {
    pending: {
        label: "Aguardando Pagamento",
        color: "text-amber-400",
        bg: "bg-amber-500/15 border-amber-400/30",
        icon: Clock,
    },
    analysis: {
        label: "Em Análise",
        color: "text-blue-400",
        bg: "bg-blue-500/15 border-blue-400/30",
        icon: Clock,
    },
    paid: {
        label: "Pago",
        color: "text-emerald-400",
        bg: "bg-emerald-500/15 border-emerald-400/30",
        icon: CheckCircle2,
    },
    shipped: {
        label: "Enviado",
        color: "text-cyan-400",
        bg: "bg-cyan-500/15 border-cyan-400/30",
        icon: Truck,
    },
    delivered: {
        label: "Entregue",
        color: "text-emerald-400",
        bg: "bg-emerald-500/15 border-emerald-400/30",
        icon: Package,
    },
    cancelled: {
        label: "Cancelado",
        color: "text-red-400",
        bg: "bg-red-500/15 border-red-400/30",
        icon: Clock,
    },
};

export default function PedidoDetalhePage() {
    const params = useParams();
    const router = useRouter();
    const orderId = params.id as string;

    const [order, setOrder] = useState<Order | null>(null);
    const [loading, setLoading] = useState(true);
    const [copied, setCopied] = useState(false);

    useEffect(() => {
        async function loadOrder() {
            const {
                data: { user },
            } = await supabase.auth.getUser();

            if (!user) {
                router.replace("/login");
                return;
            }

            const { data, error } = await supabase
                .from("orders")
                .select("*")
                .eq("id", orderId)
                .eq("user_id", user.id)
                .single();

            if (error || !data) {
                setLoading(false);
                return;
            }

            setOrder(data as Order);
            setLoading(false);
        }

        loadOrder();
    }, [orderId, router]);

    function copyOrderId() {
        navigator.clipboard.writeText(orderId);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    }

    if (loading) {
        return (
            <>
                <Header />
                <main className="px-4 py-16 text-center text-gray-400 text-sm pb-28">
                    Carregando pedido...
                </main>
                <BottomNav />
            </>
        );
    }

    if (!order) {
        return (
            <>
                <Header />
                <main className="px-4 py-16 text-center pb-28">
                    <p className="text-gray-400 mb-4">Pedido não encontrado.</p>
                    <Link href="/conta" className="text-cyan-400 text-sm hover:underline">
                        Voltar para Minha Conta
                    </Link>
                </main>
                <BottomNav />
            </>
        );
    }

    const status = statusConfig[order.status] || statusConfig.pending;
    const StatusIcon = status.icon;
    const address = order.shipping_address || {};
    const items = Array.isArray(order.items) ? order.items : [];

    // Timeline básica baseada no status
    const timelineSteps = [
        { key: "created", label: "Pedido criado", done: true },
        {
            key: "paid",
            label: "Pagamento confirmado",
            done: ["paid", "shipped", "delivered"].includes(order.status),
        },
        {
            key: "shipped",
            label: "Pedido enviado",
            done: ["shipped", "delivered"].includes(order.status),
        },
        {
            key: "delivered",
            label: "Pedido entregue",
            done: order.status === "delivered",
        },
    ];

    return (
        <>
            <Header />
            <main className="px-4 lg:px-8 py-6 pb-28 lg:pb-12 max-w-2xl mx-auto">
                {/* Voltar */}
                <button
                    onClick={() => router.back()}
                    className="flex items-center gap-2 text-sm text-gray-400 hover:text-white mb-5 transition"
                >
                    <ArrowLeft className="w-4 h-4" />
                    Voltar
                </button>

                {/* Status principal */}
                <div className={`glass rounded-2xl p-5 mb-5 border ${status.bg}`}>
                    <div className="flex items-center gap-3 mb-2">
                        <StatusIcon className={`w-6 h-6 ${status.color}`} />
                        <h1 className={`text-lg font-bold ${status.color}`}>{status.label}</h1>
                    </div>

                    {order.status === "paid" && (
                        <p className="text-sm text-emerald-300/80 mt-1">
                            Vendedor notificado. Seu pedido está sendo preparado.
                        </p>
                    )}

                    {order.status === "pending" && (
                        <p className="text-sm text-amber-300/80 mt-1">
                            Aguardando confirmação do pagamento.
                        </p>
                    )}

                    {order.status === "shipped" && (
                        <p className="text-sm text-cyan-300/80 mt-1">
                            Seu pedido está a caminho.
                        </p>
                    )}

                    {order.status === "delivered" && (
                        <p className="text-sm text-emerald-300/80 mt-1">
                            Pedido entregue com sucesso.
                        </p>
                    )}
                </div>

                {/* Timeline */}
                <div className="glass rounded-2xl p-5 mb-5">
                    <h2 className="text-sm font-semibold mb-4">Acompanhamento</h2>
                    <div className="space-y-0">
                        {timelineSteps.map((step, index) => (
                            <div key={step.key} className="flex gap-3">
                                <div className="flex flex-col items-center">
                                    <div
                                        className={`w-3 h-3 rounded-full border-2 ${step.done
                                            ? "bg-emerald-400 border-emerald-400"
                                            : "bg-transparent border-gray-600"
                                            }`}
                                    />
                                    {index < timelineSteps.length - 1 && (
                                        <div
                                            className={`w-0.5 h-10 ${step.done ? "bg-emerald-400/50" : "bg-gray-700"
                                                }`}
                                        />
                                    )}
                                </div>
                                <div className="pb-6">
                                    <p
                                        className={`text-sm font-medium ${step.done ? "text-white" : "text-gray-500"
                                            }`}
                                    >
                                        {step.label}
                                    </p>
                                    {step.key === "created" && (
                                        <p className="text-xs text-gray-500 mt-0.5">
                                            {formatDate(order.created_at)}
                                        </p>
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Endereço de entrega */}
                <div className="glass rounded-2xl p-5 mb-5">
                    <h2 className="text-sm font-semibold mb-3 flex items-center gap-2">
                        <MapPin className="w-4 h-4 text-cyan-400" />
                        Informações de Entrega
                    </h2>
                    <div className="text-sm">
                        {(address.name || address.label) && (
                            <p className="font-medium mb-1">
                                {address.name || address.label}
                                {address.phone && (
                                    <span className="text-gray-400 font-normal">
                                        {" "}
                                        ({address.phone})
                                    </span>
                                )}
                            </p>
                        )}
                        <p className="text-gray-400 text-xs leading-relaxed">
                            {address.street}
                            {address.number ? `, ${address.number}` : ""}
                            {address.complement ? ` - ${address.complement}` : ""}
                            <br />
                            {address.neighborhood && `${address.neighborhood}, `}
                            {address.city} - {address.state}
                            <br />
                            CEP {address.cep}
                        </p>
                    </div>
                </div>

                {/* Produtos */}
                <div className="glass rounded-2xl p-5 mb-5">
                    <h2 className="text-sm font-semibold mb-4">Produtos</h2>
                    <div className="space-y-4">
                        {items.map((item, idx) => (
                            <Link
                                key={idx}
                                href={item.slug ? `/produto/${item.slug}` : "#"}
                                className="flex gap-3 group"
                            >
                                <div className="w-16 h-16 rounded-xl bg-gradient-to-b from-slate-600 to-slate-900 border border-white/10 overflow-hidden flex-shrink-0">
                                    {item.image && (
                                        // eslint-disable-next-line @next/next/no-img-element
                                        <img
                                            src={item.image}
                                            alt={item.name}
                                            className="w-full h-full object-cover group-hover:scale-105 transition"
                                        />
                                    )}
                                </div>
                                <div className="flex-1 min-w-0">
                                    <p className="text-sm font-medium group-hover:text-cyan-300 transition truncate">
                                        {item.name}
                                    </p>
                                    {item.variant && (
                                        <p className="text-xs text-gray-400">{item.variant}</p>
                                    )}
                                    <div className="flex items-center justify-between mt-1">
                                        <span className="text-xs text-gray-500">
                                            Qtd: {item.quantity}
                                        </span>
                                        <span className="text-sm font-semibold text-cyan-400">
                                            {formatPrice(item.price * item.quantity)}
                                        </span>
                                    </div>
                                </div>
                                <ChevronRight className="w-4 h-4 text-gray-600 group-hover:text-cyan-400 transition flex-shrink-0 mt-1" />
                            </Link>
                        ))}
                    </div>
                </div>

                {/* Resumo */}
                <div className="glass rounded-2xl p-5 mb-5">
                    <h2 className="text-sm font-semibold mb-3">Resumo do Pedido</h2>
                    <div className="space-y-2 text-sm">
                        <div className="flex justify-between text-gray-300">
                            <span>Total</span>
                            <span className="font-bold text-cyan-400">
                                {formatPrice(Number(order.total))}
                            </span>
                        </div>
                        {order.payment_method && (
                            <div className="flex justify-between text-gray-400 text-xs">
                                <span>Forma de pagamento</span>
                                <span className="uppercase">{order.payment_method}</span>
                            </div>
                        )}
                    </div>
                </div>

                {/* ID do pedido */}
                <div className="glass rounded-2xl p-4 mb-5 flex items-center justify-between">
                    <div>
                        <p className="text-xs text-gray-500 mb-0.5">ID do Pedido</p>
                        <p className="text-sm font-mono">{order.id.slice(0, 8)}...</p>
                    </div>
                    <button
                        onClick={copyOrderId}
                        className="glass px-3 py-2 rounded-xl text-xs font-semibold flex items-center gap-1.5 border border-white/10 hover:border-cyan-400/40 transition"
                    >
                        {copied ? (
                            <>
                                <Check className="w-3.5 h-3.5 text-emerald-400" />
                                Copiado
                            </>
                        ) : (
                            <>
                                <Copy className="w-3.5 h-3.5" />
                                Copiar
                            </>
                        )}
                    </button>
                </div>

                {/* Ações */}
                <div className="space-y-3">
                    <Link
                        href="/"
                        className="glow-btn w-full py-3 rounded-full text-sm font-semibold text-center block"
                    >
                        Continuar Comprando
                    </Link>

                    <Link
                        href="/suporte"
                        className="glass w-full py-3 rounded-full text-sm font-semibold text-center flex items-center justify-center gap-2 border border-white/10"
                    >
                        <MessageCircle className="w-4 h-4" />
                        Falar com o Suporte
                    </Link>
                </div>
            </main>
            <BottomNav />
        </>
    );
}