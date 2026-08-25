"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { Search, Plus, Minus, Trash2 } from "lucide-react";

type Profile = { id: string; email: string; full_name: string; phone: string };
type ProductLite = { id: string; name: string; stock: number };
type Part = { product_id: string; name: string; quantity: number };

const statusOptions = [
    { value: "em_analise", label: "Em Análise" },
    { value: "orcamento_disponivel", label: "Orçamento Disponível" },
    { value: "em_manutencao", label: "Em Manutenção" },
    { value: "pronto_para_retirada", label: "Pronto para Retirada" },
    { value: "finalizado", label: "Finalizado" },
    { value: "cancelado", label: "Cancelado" },
    { value: "recusado", label: "Recusado pelo Cliente" },
];

export type ServiceOrderInitial = {
    id?: string;
    customer_name: string;
    customer_email: string;
    customer_phone: string;
    equipment: string;
    device_password: string;
    reported_issue: string;
    technical_notes: string;
    budget_value: string;
    status: string;
    parts_used: Part[];
};

export default function ServiceOrderForm({ initial }: { initial?: ServiceOrderInitial }) {
    const router = useRouter();
    const isEditing = !!initial?.id;

    const [customerMode, setCustomerMode] = useState<"search" | "new">(isEditing ? "search" : "search");
    const [searchQuery, setSearchQuery] = useState("");
    const [searchResults, setSearchResults] = useState<Profile[]>([]);

    const [customerName, setCustomerName] = useState(initial?.customer_name ?? "");
    const [customerEmail, setCustomerEmail] = useState(initial?.customer_email ?? "");
    const [customerPhone, setCustomerPhone] = useState(initial?.customer_phone ?? "");

    const [equipment, setEquipment] = useState(initial?.equipment ?? "");
    const [devicePassword, setDevicePassword] = useState(initial?.device_password ?? "");
    const [reportedIssue, setReportedIssue] = useState(initial?.reported_issue ?? "");
    const [technicalNotes, setTechnicalNotes] = useState(initial?.technical_notes ?? "");
    const [budgetValue, setBudgetValue] = useState(initial?.budget_value ?? "");
    const [status, setStatus] = useState(initial?.status ?? "em_analise");

    const [parts, setParts] = useState<Part[]>(initial?.parts_used ?? []);
    const [partSearch, setPartSearch] = useState("");
    const [partResults, setPartResults] = useState<ProductLite[]>([]);

    const [saving, setSaving] = useState(false);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        if (!searchQuery.trim()) {
            setSearchResults([]);
            return;
        }
        const timer = setTimeout(async () => {
            const { data } = await supabase
                .from("profiles")
                .select("id, email, full_name, phone")
                .or(`full_name.ilike.%${searchQuery}%,email.ilike.%${searchQuery}%,phone.ilike.%${searchQuery}%`)
                .limit(8);
            setSearchResults((data as Profile[]) ?? []);
        }, 300);
        return () => clearTimeout(timer);
    }, [searchQuery]);

    useEffect(() => {
        if (!partSearch.trim()) {
            setPartResults([]);
            return;
        }
        const timer = setTimeout(async () => {
            const { data } = await supabase
                .from("products")
                .select("id, name, stock")
                .ilike("name", `%${partSearch}%`)
                .limit(8);
            setPartResults((data as ProductLite[]) ?? []);
        }, 300);
        return () => clearTimeout(timer);
    }, [partSearch]);

    function selectClient(p: Profile) {
        setCustomerName(p.full_name ?? "");
        setCustomerEmail(p.email);
        setCustomerPhone(p.phone ?? "");
        setSearchQuery("");
        setSearchResults([]);
    }

    function addPart(product: ProductLite) {
        if (parts.some((p) => p.product_id === product.id)) return;
        setParts((prev) => [...prev, { product_id: product.id, name: product.name, quantity: 1 }]);
        setPartSearch("");
        setPartResults([]);
    }

    function updatePartQty(productId: string, quantity: number) {
        if (quantity < 1) {
            setParts((prev) => prev.filter((p) => p.product_id !== productId));
            return;
        }
        setParts((prev) => prev.map((p) => (p.product_id === productId ? { ...p, quantity } : p)));
    }

    async function handleSubmit(e: React.FormEvent) {
        e.preventDefault();
        setSaving(true);
        setError(null);

        if (!customerEmail.trim() || !customerName.trim()) {
            setError("Nome e e-mail do cliente são obrigatórios.");
            setSaving(false);
            return;
        }

        // Se for cliente novo (não veio de busca), convida/cria a conta dele
        if (customerMode === "new") {
            try {
                await fetch("/api/admin/create-service-customer", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ email: customerEmail, name: customerName, phone: customerPhone }),
                });
            } catch {
                // não trava o cadastro da OS se o convite falhar; pode reenviar depois
            }
        }

        const payload = {
            customer_name: customerName,
            customer_email: customerEmail.toLowerCase(),
            customer_phone: customerPhone,
            equipment,
            device_password: devicePassword,
            reported_issue: reportedIssue,
            technical_notes: technicalNotes,
            budget_value: budgetValue ? parseFloat(budgetValue) : null,
            status,
            parts_used: parts,
            updated_at: new Date().toISOString(),
        };

        if (isEditing) {
            const { error: updateError } = await supabase.from("service_orders").update(payload).eq("id", initial!.id);
            if (updateError) {
                setError("Erro ao salvar: " + updateError.message);
                setSaving(false);
                return;
            }
        } else {
            const { error: insertError } = await supabase.from("service_orders").insert(payload);
            if (insertError) {
                setError("Erro ao criar: " + insertError.message);
                setSaving(false);
                return;
            }

            // Baixa de estoque das peças usadas (só na criação, pra não duplicar baixa em edições)
            for (const part of parts) {
                const { data: current } = await supabase.from("products").select("stock").eq("id", part.product_id).single();
                const newStock = Math.max(0, (current?.stock ?? 0) - part.quantity);
                await supabase.from("products").update({ stock: newStock }).eq("id", part.product_id);
            }
        }

        setSaving(false);
        router.push("/admin/os");
        router.refresh();
    }

    return (
        <form onSubmit={handleSubmit} className="space-y-5 max-w-3xl">
            <div className="glass rounded-2xl p-5">
                <h2 className="text-sm font-semibold mb-4">Cliente</h2>

                {!isEditing && (
                    <div className="flex gap-2 mb-4">
                        <button
                            type="button"
                            onClick={() => setCustomerMode("search")}
                            className={`px-4 py-2 rounded-full text-xs font-medium ${customerMode === "search" ? "bg-blue-500/20 text-blue-300 border border-blue-400/40" : "glass text-gray-300"
                                }`}
                        >
                            Cliente já cadastrado
                        </button>
                        <button
                            type="button"
                            onClick={() => setCustomerMode("new")}
                            className={`px-4 py-2 rounded-full text-xs font-medium ${customerMode === "new" ? "bg-blue-500/20 text-blue-300 border border-blue-400/40" : "glass text-gray-300"
                                }`}
                        >
                            Cadastro rápido (cliente novo)
                        </button>
                    </div>
                )}

                {!isEditing && customerMode === "search" && (
                    <div className="mb-4 relative">
                        <Search className="w-4 h-4 text-gray-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
                        <input
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            placeholder="Buscar por nome, e-mail ou telefone..."
                            className="w-full glass rounded-xl pl-10 pr-4 py-2.5 text-sm outline-none focus:border-blue-400/50"
                        />
                        {searchResults.length > 0 && (
                            <div className="mt-2 space-y-1.5">
                                {searchResults.map((p) => (
                                    <button
                                        key={p.id}
                                        type="button"
                                        onClick={() => selectClient(p)}
                                        className="w-full text-left px-3 py-2.5 rounded-xl glass hover:border-cyan-400/40 transition"
                                    >
                                        <div className="text-sm text-white">{p.full_name || p.email}</div>
                                        <div className="text-xs text-gray-500">
                                            {p.email} {p.phone && `• ${p.phone}`}
                                        </div>
                                    </button>
                                ))}
                            </div>
                        )}
                    </div>
                )}

                <div className="grid sm:grid-cols-3 gap-3">
                    <div>
                        <label className="text-xs text-gray-400 mb-1 block">Nome</label>
                        <input
                            required
                            value={customerName}
                            onChange={(e) => setCustomerName(e.target.value)}
                            className="w-full glass rounded-xl px-4 py-2.5 text-sm outline-none focus:border-blue-400/50"
                        />
                    </div>
                    <div>
                        <label className="text-xs text-gray-400 mb-1 block">E-mail</label>
                        <input
                            type="email"
                            required
                            value={customerEmail}
                            onChange={(e) => setCustomerEmail(e.target.value)}
                            disabled={isEditing}
                            className="w-full glass rounded-xl px-4 py-2.5 text-sm outline-none focus:border-blue-400/50 disabled:opacity-60"
                        />
                    </div>
                    <div>
                        <label className="text-xs text-gray-400 mb-1 block">Telefone</label>
                        <input
                            value={customerPhone}
                            onChange={(e) => setCustomerPhone(e.target.value)}
                            className="w-full glass rounded-xl px-4 py-2.5 text-sm outline-none focus:border-blue-400/50"
                        />
                    </div>
                </div>

                {!isEditing && customerMode === "new" && (
                    <p className="text-[11px] text-amber-300 mt-3">
                        Um convite por e-mail será enviado automaticamente pra esse cliente criar a senha e acompanhar a OS pelo site.
                    </p>
                )}
            </div>

            <div className="glass rounded-2xl p-5 grid sm:grid-cols-2 gap-4">
                <div>
                    <label className="text-xs text-gray-400 mb-1 block">Equipamento</label>
                    <input
                        required
                        value={equipment}
                        onChange={(e) => setEquipment(e.target.value)}
                        placeholder="Ex: iPhone 13, Cor Azul"
                        className="w-full glass rounded-xl px-4 py-2.5 text-sm outline-none focus:border-blue-400/50"
                    />
                </div>
                <div>
                    <label className="text-xs text-gray-400 mb-1 block">Senha do Aparelho (opcional)</label>
                    <input
                        value={devicePassword}
                        onChange={(e) => setDevicePassword(e.target.value)}
                        className="w-full glass rounded-xl px-4 py-2.5 text-sm outline-none focus:border-blue-400/50 font-mono"
                    />
                </div>
                <div className="sm:col-span-2">
                    <label className="text-xs text-gray-400 mb-1 block">Defeito Relatado pelo Cliente</label>
                    <textarea
                        required
                        value={reportedIssue}
                        onChange={(e) => setReportedIssue(e.target.value)}
                        rows={2}
                        className="w-full glass rounded-xl px-4 py-2.5 text-sm outline-none focus:border-blue-400/50"
                    />
                </div>
                <div className="sm:col-span-2">
                    <label className="text-xs text-gray-400 mb-1 block">Observações Técnicas (laudo interno)</label>
                    <textarea
                        value={technicalNotes}
                        onChange={(e) => setTechnicalNotes(e.target.value)}
                        rows={3}
                        className="w-full glass rounded-xl px-4 py-2.5 text-sm outline-none focus:border-blue-400/50"
                    />
                </div>
                <div>
                    <label className="text-xs text-gray-400 mb-1 block">Valor do Orçamento (R$)</label>
                    <input
                        type="number"
                        step="0.01"
                        value={budgetValue}
                        onChange={(e) => setBudgetValue(e.target.value)}
                        className="w-full glass rounded-xl px-4 py-2.5 text-sm outline-none focus:border-blue-400/50"
                    />
                </div>
                <div>
                    <label className="text-xs text-gray-400 mb-1 block">Status</label>
                    <select
                        value={status}
                        onChange={(e) => setStatus(e.target.value)}
                        className="w-full glass rounded-xl px-4 py-2.5 text-sm outline-none focus:border-blue-400/50 bg-transparent"
                    >
                        {statusOptions.map((s) => (
                            <option key={s.value} value={s.value} className="bg-slate-900">
                                {s.label}
                            </option>
                        ))}
                    </select>
                </div>
            </div>

            <div className="glass rounded-2xl p-5">
                <h2 className="text-sm font-semibold mb-3">Peças Utilizadas (dá baixa automática no estoque)</h2>
                <div className="relative mb-3">
                    <Search className="w-4 h-4 text-gray-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
                    <input
                        value={partSearch}
                        onChange={(e) => setPartSearch(e.target.value)}
                        placeholder="Buscar peça no estoque..."
                        className="w-full glass rounded-xl pl-10 pr-4 py-2.5 text-sm outline-none focus:border-blue-400/50"
                    />
                    {partResults.length > 0 && (
                        <div className="mt-2 space-y-1.5 absolute w-full z-10 glass-strong rounded-xl p-2">
                            {partResults.map((p) => (
                                <button
                                    key={p.id}
                                    type="button"
                                    onClick={() => addPart(p)}
                                    className="w-full text-left px-3 py-2 rounded-lg hover:bg-white/5 transition flex justify-between text-sm"
                                >
                                    <span>{p.name}</span>
                                    <span className="text-xs text-gray-500">Estoque: {p.stock}</span>
                                </button>
                            ))}
                        </div>
                    )}
                </div>

                {parts.length > 0 && (
                    <div className="space-y-2 mt-16">
                        {parts.map((part) => (
                            <div key={part.product_id} className="flex items-center justify-between glass rounded-xl px-4 py-2.5">
                                <span className="text-sm">{part.name}</span>
                                <div className="flex items-center gap-2">
                                    <button
                                        type="button"
                                        onClick={() => updatePartQty(part.product_id, part.quantity - 1)}
                                        className="w-6 h-6 rounded-full glass flex items-center justify-center"
                                    >
                                        <Minus className="w-3 h-3" />
                                    </button>
                                    <span className="text-sm w-5 text-center">{part.quantity}</span>
                                    <button
                                        type="button"
                                        onClick={() => updatePartQty(part.product_id, part.quantity + 1)}
                                        className="w-6 h-6 rounded-full glass flex items-center justify-center"
                                    >
                                        <Plus className="w-3 h-3" />
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => updatePartQty(part.product_id, 0)}
                                        className="text-red-400 ml-1"
                                    >
                                        <Trash2 className="w-3.5 h-3.5" />
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {error && <p className="text-sm text-red-400">{error}</p>}

            <button
                type="submit"
                disabled={saving}
                className="glow-btn px-8 py-3 rounded-full text-sm font-semibold disabled:opacity-50"
            >
                {saving ? "Salvando..." : isEditing ? "Salvar Alterações" : "Criar Ordem de Serviço"}
            </button>
        </form>
    );
}