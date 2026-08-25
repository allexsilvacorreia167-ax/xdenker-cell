"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import AdminHeader from "@/components/admin/AdminHeader";
import { ArrowLeft, Truck, AlertTriangle } from "lucide-react";
import Link from "next/link";

type OrderItem = { name: string; quantity: number; price: number; variant?: string };

type Order = {
    id: string;
    user_id: string | null;
    total: number;
    items: OrderItem[];
    status: string;
    source: string;
    payment_method: string | null;
    shipping_address: Record<string, string> | null;
    tracking_code: string | null;
    refund_reason: string | null;
    created_at: string;
};

type Profile = { id: string; email: string; full_name: string };

const statusOptions = [
    { value: "pending", label: "Aguardando Pagamento" },
    { value: "paid", label: "Pagamento Confirmado" },
    { value: "separating", label: "Separando no Estoque" },
    { value: "shipped", label: "Enviado" },
    { value: "delivered", label: "Entregue" },
];

function formatPrice(value: number) {
    return value.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

export default function AdminVendaDetalhePage() {
    const params = useParams<{ id: string }>();
    const router = useRouter();
    const [order, setOrder] = useState<Order | null>(null);
    const [profile, setProfile] = useState<Profile | null>(null);
    const [tracking, setTracking] = useState("");
    const [saving, setSaving] = useState(false);
    const [showRefund, setShowRefund] = useState(false);
    const [refundReason, setRefundReason] = useState("");

    async function load() {
        const { data } = await supabase.from("orders").select("*").eq("id", params.id).single();
        if (!data) return;
        setOrder(data as Order);
        setTracking(data.tracking_code ?? "");

        if (data.user_id) {
            const { data: p } = await supabase.from("profiles").select("id, email, full_name").eq("id", data.user_id).single();
            setProfile(p as Profile);
        }
    }

    useEffect(() => {
        load();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [params.id]);

    async function updateStatus(status: string) {
        if (!order) return;
        setSaving(true);
        await supabase.from("orders").update({ status }).eq("id", order.id);
        setSaving(false);
        load();
    }

    async function saveTracking() {
        if (!order) return;
        setSaving(true);
        await supabase.from("orders").update({ tracking_code: tracking }).eq("id", order.id);
        setSaving(false);
        load();
    }

    async function handleCancel() {
        if (!order) return;
        if (!confirm("Cancelar este pedido? Essa ação não pode ser desfeita.")) return;
        await supabase.from("orders").update({ status: "cancelled" }).eq("id", order.id);
        router.push("/admin/vendas");
    }

    async function handleRefund() {
        if (!order) return;
        setSaving(true);
        await supabase
            .from("orders")
            .update({ status: "refunded", refund_reason: refundReason, refunded_at: new Date().toISOString() })
            .eq("id", order.id);
        setSaving(false);
        router.push("/admin/vendas");
    }

    if (!order) return <p className="text-gray-400 text-sm p-8">Carregando...</p>;

    return (
        <div>
            <AdminHeader title={`Pedido #${order.id.slice(0, 8)}`} range={30} onRangeChange={() => { }} />

            <div className="p-6 lg:p-8 max-w-4xl">
                <div className="flex items-center justify-between mb-6">
                    <Link href="/admin/vendas" className="text-sm text-cyan-400 hover:underline flex items-center gap-1">
                        <ArrowLeft className="w-4 h-4" />
                        Voltar pra Vendas
                    </Link>
                    <Link
                        href={`/admin/vendas/${order.id}/recibo`}
                        className="glass px-4 py-2 rounded-full text-xs font-semibold border border-cyan-400/30 ml-auto"
                    >
                        Ver Comprovante Completo
                    </Link>
                </div>

                <div className="grid lg:grid-cols-3 gap-6">
                    <div className="lg:col-span-2 space-y-6">
                        <div className="glass rounded-2xl p-5">
                            <h2 className="text-sm font-semibold text-white mb-4">Produtos Comprados</h2>
                            <div className="space-y-3">
                                {order.items?.map((item, i) => (
                                    <div key={i} className="flex justify-between text-sm border-b border-white/5 pb-3 last:border-0 last:pb-0">
                                        <div>
                                            <div className="text-white">
                                                {item.quantity}x {item.name}
                                            </div>
                                            {item.variant && <div className="text-xs text-gray-500">{item.variant}</div>}
                                        </div>
                                        <span className="text-cyan-400 font-medium">{formatPrice(item.price * item.quantity)}</span>
                                    </div>
                                ))}
                            </div>
                            <div className="flex justify-between text-base font-bold border-t border-white/10 pt-4 mt-4">
                                <span>Total</span>
                                <span className="text-cyan-400">{formatPrice(order.total)}</span>
                            </div>
                        </div>

                        <div className="glass rounded-2xl p-5">
                            <h2 className="text-sm font-semibold text-white mb-4">Endereço de Entrega</h2>
                            {order.shipping_address ? (
                                <p className="text-sm text-gray-300">
                                    {order.shipping_address.street}, {order.shipping_address.number}
                                    {order.shipping_address.complement ? ` - ${order.shipping_address.complement}` : ""}
                                    <br />
                                    {order.shipping_address.neighborhood}, {order.shipping_address.city} - {order.shipping_address.state}
                                    <br />
                                    CEP: {order.shipping_address.cep}
                                </p>
                            ) : (
                                <p className="text-sm text-gray-500">Sem endereço (venda de balcão/PDV).</p>
                            )}
                        </div>

                        <div className="glass rounded-2xl p-5">
                            <h2 className="text-sm font-semibold text-white mb-3 flex items-center gap-2">
                                <Truck className="w-4 h-4 text-cyan-400" />
                                Código de Rastreio
                            </h2>
                            <div className="flex gap-2">
                                <input
                                    value={tracking}
                                    onChange={(e) => setTracking(e.target.value)}
                                    placeholder="Ex: BR123456789XX"
                                    className="flex-1 glass rounded-xl px-4 py-2.5 text-sm outline-none focus:border-blue-400/50 font-mono"
                                />
                                <button
                                    onClick={saveTracking}
                                    disabled={saving}
                                    className="glow-btn px-5 py-2.5 rounded-full text-sm font-semibold disabled:opacity-50"
                                >
                                    Salvar
                                </button>
                            </div>
                        </div>
                    </div>

                    <div className="space-y-6">
                        <div className="glass rounded-2xl p-5">
                            <h2 className="text-sm font-semibold text-white mb-3">Cliente</h2>
                            <p className="text-sm text-gray-300">{profile?.full_name || "Cliente não identificado"}</p>
                            <p className="text-xs text-gray-500">{profile?.email}</p>
                        </div>

                        <div className="glass rounded-2xl p-5">
                            <h2 className="text-sm font-semibold text-white mb-3">Pagamento</h2>
                            <p className="text-sm text-gray-300 capitalize">{order.payment_method ?? "Não informado"}</p>
                            <p className="text-xs text-gray-500 mt-1">
                                Origem: {order.source === "online" ? "E-commerce" : "Loja Física (PDV)"}
                            </p>
                            <p className="text-xs text-gray-500">{new Date(order.created_at).toLocaleString("pt-BR")}</p>
                        </div>

                        <div className="glass rounded-2xl p-5">
                            <h2 className="text-sm font-semibold text-white mb-3">Atualizar Status</h2>
                            <div className="space-y-2">
                                {statusOptions.map((opt) => (
                                    <button
                                        key={opt.value}
                                        onClick={() => updateStatus(opt.value)}
                                        disabled={saving}
                                        className={`w-full text-left px-4 py-2.5 rounded-xl text-sm transition ${order.status === opt.value
                                            ? "bg-blue-500/20 text-blue-300 border border-blue-400/40"
                                            : "glass text-gray-300 hover:border-cyan-400/30"
                                            }`}
                                    >
                                        {opt.label}
                                    </button>
                                ))}
                            </div>
                        </div>

                        <div className="glass rounded-2xl p-5 border border-red-400/20">
                            <h2 className="text-sm font-semibold text-red-400 mb-3 flex items-center gap-2">
                                <AlertTriangle className="w-4 h-4" />
                                Zona de Risco
                            </h2>
                            {!showRefund ? (
                                <div className="space-y-2">
                                    <button
                                        onClick={handleCancel}
                                        className="w-full glass px-4 py-2.5 rounded-xl text-sm text-red-400 border border-red-400/30"
                                    >
                                        Cancelar Pedido
                                    </button>
                                    <button
                                        onClick={() => setShowRefund(true)}
                                        className="w-full glass px-4 py-2.5 rounded-xl text-sm text-red-400 border border-red-400/30"
                                    >
                                        Registrar Reembolso
                                    </button>
                                </div>
                            ) : (
                                <div className="space-y-3">
                                    <textarea
                                        value={refundReason}
                                        onChange={(e) => setRefundReason(e.target.value)}
                                        placeholder="Motivo do estorno..."
                                        rows={3}
                                        className="w-full glass rounded-xl px-4 py-2.5 text-sm outline-none focus:border-red-400/50"
                                    />
                                    <div className="flex gap-2">
                                        <button
                                            onClick={handleRefund}
                                            disabled={saving}
                                            className="flex-1 bg-red-500/20 text-red-300 border border-red-400/40 px-4 py-2.5 rounded-xl text-sm font-semibold disabled:opacity-50"
                                        >
                                            Confirmar Estorno
                                        </button>
                                        <button
                                            onClick={() => setShowRefund(false)}
                                            className="glass px-4 py-2.5 rounded-xl text-sm"
                                        >
                                            Cancelar
                                        </button>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}