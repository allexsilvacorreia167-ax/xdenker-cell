"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Header from "@/components/layout/Header";
import BottomNav from "@/components/layout/BottomNav";
import { supabase } from "@/lib/supabase";
import { Wrench, Check, X } from "lucide-react";

type ServiceOrder = {
    id: string;
    equipment: string;
    reported_issue: string;
    technical_notes: string | null;
    budget_value: number | null;
    status: string;
    created_at: string;
};

const statusSteps = ["em_analise", "orcamento_disponivel", "em_manutencao", "pronto_para_retirada", "finalizado"];

const statusLabel: Record<string, string> = {
    em_analise: "Em Análise",
    orcamento_disponivel: "Orçamento Disponível",
    em_manutencao: "Em Manutenção",
    pronto_para_retirada: "Pronto para Retirada",
    finalizado: "Finalizado",
    cancelado: "Cancelado",
    recusado: "Orçamento Recusado",
};

function formatPrice(value: number) {
    return value.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

export default function MeusAparelhosPage() {
    const router = useRouter();
    const [orders, setOrders] = useState<ServiceOrder[]>([]);
    const [loading, setLoading] = useState(true);
    const [responding, setResponding] = useState<string | null>(null);

    // Estados para controlar expansão e aceite dos termos por ID da OS
    const [expandedOsIds, setExpandedOsIds] = useState<Record<string, boolean>>({});
    const [acceptedTerms, setAcceptedTerms] = useState<Record<string, boolean>>({});

    async function load() {
        const {
            data: { user },
        } = await supabase.auth.getUser();

        if (!user) {
            router.replace("/login");
            return;
        }

        const { data } = await supabase
            .from("service_orders")
            .select("id, equipment, reported_issue, technical_notes, budget_value, status, created_at")
            .order("created_at", { ascending: false });

        setOrders((data as ServiceOrder[]) ?? []);
        setLoading(false);
    }

    useEffect(() => {
        load();
    }, []);

    async function handleRespond(orderId: string, approve: boolean) {
        setResponding(orderId);

        // Utiliza a RPC segura do banco de dados para evitar violação de restrições (constraints)
        const { error } = await supabase.rpc("respond_to_budget", {
            order_id: orderId,
            approve: approve,
        });

        setResponding(null);

        if (error) {
            console.error("Erro ao responder orçamento:", error.message);
            alert("Erro ao processar sua solicitação: " + error.message);
        } else {
            load();
        }
    }

    const toggleExpand = (id: string) => {
        setExpandedOsIds((prev) => ({ ...prev, [id]: !prev[id] }));
    };

    return (
        <>
            <Header />
            <main className="px-4 lg:px-8 py-6 pb-28 lg:pb-12 max-w-3xl mx-auto">
                <h1 className="text-2xl font-bold mb-6 flex items-center gap-2">
                    <Wrench className="w-6 h-6 text-cyan-400" />
                    Meus Aparelhos
                </h1>

                {loading ? (
                    <p className="text-sm text-gray-400">Carregando...</p>
                ) : orders.length === 0 ? (
                    <div className="glass rounded-2xl p-10 text-center text-gray-400 text-sm">
                        Você não tem nenhuma ordem de serviço no momento.
                    </div>
                ) : (
                    <div className="space-y-4">
                        {orders.map((order) => {
                            const stepIndex = statusSteps.indexOf(order.status);
                            const isTerminalOther = ["cancelado", "recusado"].includes(order.status);
                            const isBudgetReady = order.status === "orcamento_disponivel";
                            const isExpanded = expandedOsIds[order.id] || false;
                            const isTermsChecked = acceptedTerms[order.id] || false;

                            return (
                                <div key={order.id} className="glass rounded-2xl p-5 space-y-4 transition-all duration-300">
                                    <div className="flex items-center justify-between mb-1">
                                        <h2 className="text-base font-semibold text-white">{order.equipment}</h2>
                                        <span className="text-xs text-gray-500">
                                            {new Date(order.created_at).toLocaleDateString("pt-BR")}
                                        </span>
                                    </div>

                                    <p className="text-sm text-gray-400">{order.reported_issue}</p>

                                    {!isTerminalOther && (
                                        <div className="flex items-center py-2">
                                            {statusSteps.map((step, i) => (
                                                <div key={step} className="flex items-center flex-1 last:flex-none">
                                                    <div
                                                        className={`w-3 h-3 rounded-full flex-shrink-0 ${i <= stepIndex ? "bg-cyan-400" : "bg-white/10"
                                                            }`}
                                                    />
                                                    {i < statusSteps.length - 1 && (
                                                        <div className={`h-0.5 flex-1 ${i < stepIndex ? "bg-cyan-400" : "bg-white/10"}`} />
                                                    )}
                                                </div>
                                            ))}
                                        </div>
                                    )}

                                    {/* Barra de Status / Botão Expansível para Orçamento */}
                                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-1">
                                        {isBudgetReady ? (
                                            <button
                                                onClick={() => toggleExpand(order.id)}
                                                className="text-xs font-semibold px-4 py-2 rounded-full bg-blue-500/20 text-blue-300 hover:bg-blue-500/30 transition flex items-center justify-between sm:justify-start gap-3 border border-blue-500/30 cursor-pointer w-full sm:w-auto"
                                            >
                                                <span>🔍 Orçamento Disponível</span>
                                                <span className="font-bold text-emerald-400">
                                                    {order.budget_value ? formatPrice(order.budget_value) : ""}
                                                </span>
                                                <span className="ml-auto sm:ml-2">{isExpanded ? "▲" : "▼"}</span>
                                            </button>
                                        ) : (
                                            <span
                                                className={`text-xs font-semibold px-3 py-1.5 rounded-full self-start ${isTerminalOther
                                                    ? "bg-red-500/10 text-red-400"
                                                    : order.status === "finalizado"
                                                        ? "bg-emerald-500/10 text-emerald-400"
                                                        : "bg-blue-500/10 text-blue-400"
                                                    }`}
                                            >
                                                {statusLabel[order.status]}
                                            </span>
                                        )}

                                        {!isBudgetReady && order.budget_value && (
                                            <span className="text-sm font-bold text-cyan-400 self-end sm:self-auto">
                                                {formatPrice(order.budget_value)}
                                            </span>
                                        )}
                                    </div>

                                    {/* ÁREA EXPANSÍVEL: Laudo, Termos e Botões de Autorização */}
                                    {isExpanded && isBudgetReady && (
                                        <div className="mt-4 pt-4 border-t border-white/10 space-y-4 animate-fadeIn">
                                            {/* Laudo e Observações Técnicas */}
                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs bg-black/20 p-4 rounded-xl border border-white/5">
                                                <div>
                                                    <span className="text-gray-400 block font-medium mb-1">Laudo / O que será feito:</span>
                                                    <p className="text-gray-200">
                                                        {order.technical_notes || "Nenhum laudo técnico detalhado informado pelo técnico."}
                                                    </p>
                                                </div>
                                                <div>
                                                    <span className="text-gray-400 block font-medium mb-1">Valor do Orçamento:</span>
                                                    <span className="text-emerald-400 font-bold text-base">
                                                        {order.budget_value ? formatPrice(order.budget_value) : "R$ 0,00"}
                                                    </span>
                                                </div>
                                            </div>

                                            {/* Termos de Garantia e Responsabilidade */}
                                            <div className="bg-white/5 p-4 rounded-xl border border-white/10 space-y-3">
                                                <h4 className="text-xs font-bold text-gray-300 uppercase tracking-wider">
                                                    Termos e Condições de Serviço
                                                </h4>
                                                <div className="text-[11px] text-gray-400 max-h-28 overflow-y-auto pr-2 space-y-1.5 leading-relaxed">
                                                    <p>1. A garantia cobre exclusivamente o componente substituído ou o serviço de conserto realizado nesta Ordem de Serviço, pelo prazo legal de 90 dias.</p>
                                                    <p>2. Aparelhos que apresentam danos por líquidos (oxidação) ou histórico de quedas severas podem manifestar falhas ocultas posteriores, não cobertas por esta garantia, salvo se descrito no laudo.</p>
                                                    <p>3. A assistência técnica não se responsabiliza por dados armazenados no aparelho; recomenda-se backup prévio quando possível.</p>
                                                    <p>4. Equipamentos não retirados no prazo de 90 dias após a notificação de pronto ficarão sujeitos a taxas de guarda ou descarte conforme as normas da empresa.</p>
                                                </div>

                                                {/* Checkbox de Aceite */}
                                                <label className="flex items-start gap-2.5 pt-2 cursor-pointer select-none">
                                                    <input
                                                        type="checkbox"
                                                        checked={isTermsChecked}
                                                        onChange={(e) =>
                                                            setAcceptedTerms((prev) => ({
                                                                ...prev,
                                                                [order.id]: e.target.checked,
                                                            }))
                                                        }
                                                        className="mt-0.5 rounded border-gray-600 text-cyan-400 focus:ring-cyan-400 bg-black/40 w-4 h-4 cursor-pointer"
                                                    />
                                                    <span className="text-xs text-gray-300 font-medium">
                                                        Li e concordo com os termos de garantia, laudo técnico e políticas da assistência técnica.
                                                    </span>
                                                </label>
                                            </div>

                                            {/* Botões de Ação */}
                                            <div className="flex flex-col sm:flex-row items-center gap-3 pt-2">
                                                <button
                                                    onClick={() => handleRespond(order.id, false)}
                                                    disabled={responding === order.id}
                                                    className="w-full sm:flex-1 py-2.5 rounded-full text-sm font-semibold border border-red-400/30 text-red-400 bg-red-400/5 hover:bg-red-400/10 flex items-center justify-center gap-1.5 disabled:opacity-50 cursor-pointer transition"
                                                >
                                                    <X className="w-4 h-4" />
                                                    Recusar Orçamento
                                                </button>

                                                <button
                                                    onClick={() => handleRespond(order.id, true)}
                                                    disabled={responding === order.id || !isTermsChecked}
                                                    className={`w-full sm:flex-1 py-2.5 rounded-full text-sm font-semibold flex items-center justify-center gap-1.5 transition ${isTermsChecked
                                                        ? "glow-btn cursor-pointer"
                                                        : "bg-white/10 text-gray-500 cursor-not-allowed border border-white/5"
                                                        }`}
                                                >
                                                    <Check className="w-4 h-4" />
                                                    Autorizar Reparo
                                                </button>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            );
                        })}
                    </div>
                )}
            </main>
            <BottomNav />
        </>
    );
}