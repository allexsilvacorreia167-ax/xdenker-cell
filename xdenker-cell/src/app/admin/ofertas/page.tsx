"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import AdminHeader from "@/components/admin/AdminHeader";
import Link from "next/link";
import { Plus, Trash2, Pencil, Sparkles } from "lucide-react";

type Coupon = {
    id: string;
    code: string;
    title: string;
    discount_type: "percentage" | "fixed";
    discount_value: number;
    usage_limit: number | null;
    usage_count: number;
    expires_at: string | null;
    active: boolean;
};

const emptyForm = {
    code: "",
    title: "",
    discount_type: "percentage" as "percentage" | "fixed",
    discount_value: "",
    usage_limit: "",
    expires_at: "",
};

export default function AdminOfertasPage() {
    const [coupons, setCoupons] = useState<Coupon[]>([]);
    const [loading, setLoading] = useState(true);
    const [editing, setEditing] = useState<string | null>(null);
    const [form, setForm] = useState(emptyForm);
    const [showForm, setShowForm] = useState(false);

    async function load() {
        const { data } = await supabase.from("coupons").select("*").order("created_at", { ascending: false });
        setCoupons((data as Coupon[]) ?? []);
        setLoading(false);
    }

    useEffect(() => {
        load();
    }, []);

    function startNew() {
        setForm(emptyForm);
        setEditing(null);
        setShowForm(true);
    }

    function startEdit(c: Coupon) {
        setForm({
            code: c.code,
            title: c.title,
            discount_type: c.discount_type,
            discount_value: String(c.discount_value),
            usage_limit: c.usage_limit ? String(c.usage_limit) : "",
            expires_at: c.expires_at ? c.expires_at.slice(0, 10) : "",
        });
        setEditing(c.id);
        setShowForm(true);
    }

    async function handleSave(e: React.FormEvent) {
        e.preventDefault();
        const payload = {
            code: form.code.toUpperCase(),
            title: form.title,
            discount_type: form.discount_type,
            discount_value: parseFloat(form.discount_value),
            usage_limit: form.usage_limit ? parseInt(form.usage_limit, 10) : null,
            expires_at: form.expires_at ? new Date(form.expires_at).toISOString() : null,
        };

        if (editing) {
            await supabase.from("coupons").update(payload).eq("id", editing);
        } else {
            await supabase.from("coupons").insert(payload);
        }

        setShowForm(false);
        load();
    }

    async function toggleActive(id: string, active: boolean) {
        await supabase.from("coupons").update({ active: !active }).eq("id", id);
        load();
    }

    async function handleDelete(id: string) {
        if (!confirm("Excluir este cupom?")) return;
        await supabase.from("coupons").delete().eq("id", id);
        load();
    }

    return (
        <div>
            <AdminHeader title="Ofertas e Cupons" range={30} onRangeChange={() => { }} />

            <div className="p-6 lg:p-8">
                <div className="flex flex-wrap justify-between items-center gap-3 mb-6">
                    <Link
                        href="/admin/ofertas/campanhas"
                        className="glass px-5 py-2.5 rounded-full text-sm font-semibold border border-cyan-400/30 flex items-center gap-2"
                    >
                        <Sparkles className="w-4 h-4 text-cyan-400" />
                        Campanhas Promocionais
                    </Link>

                    <button
                        onClick={startNew}
                        className="glow-btn px-5 py-2.5 rounded-full text-sm font-semibold flex items-center gap-2"
                    >
                        <Plus className="w-4 h-4" />
                        Novo Cupom
                    </button>
                </div>

                {showForm && (
                    <form onSubmit={handleSave} className="glass rounded-2xl p-5 mb-6 grid sm:grid-cols-2 gap-4">
                        <div>
                            <label className="text-xs text-gray-400 mb-1 block">Código</label>
                            <input
                                required
                                value={form.code}
                                onChange={(e) => setForm({ ...form, code: e.target.value })}
                                className="w-full glass rounded-xl px-4 py-2.5 text-sm outline-none focus:border-blue-400/50"
                                placeholder="XDENKER10"
                            />
                        </div>
                        <div>
                            <label className="text-xs text-gray-400 mb-1 block">Título</label>
                            <input
                                required
                                value={form.title}
                                onChange={(e) => setForm({ ...form, title: e.target.value })}
                                className="w-full glass rounded-xl px-4 py-2.5 text-sm outline-none focus:border-blue-400/50"
                                placeholder="10% de desconto"
                            />
                        </div>
                        <div>
                            <label className="text-xs text-gray-400 mb-1 block">Tipo</label>
                            <select
                                value={form.discount_type}
                                onChange={(e) => setForm({ ...form, discount_type: e.target.value as "percentage" | "fixed" })}
                                className="w-full glass rounded-xl px-4 py-2.5 text-sm outline-none focus:border-blue-400/50 bg-transparent"
                            >
                                <option value="percentage" className="bg-slate-900">Porcentagem (%)</option>
                                <option value="fixed" className="bg-slate-900">Valor Fixo (R$)</option>
                            </select>
                        </div>
                        <div>
                            <label className="text-xs text-gray-400 mb-1 block">Valor do desconto</label>
                            <input
                                type="number"
                                step="0.01"
                                required
                                value={form.discount_value}
                                onChange={(e) => setForm({ ...form, discount_value: e.target.value })}
                                className="w-full glass rounded-xl px-4 py-2.5 text-sm outline-none focus:border-blue-400/50"
                            />
                        </div>
                        <div>
                            <label className="text-xs text-gray-400 mb-1 block">Limite de usos (opcional)</label>
                            <input
                                type="number"
                                value={form.usage_limit}
                                onChange={(e) => setForm({ ...form, usage_limit: e.target.value })}
                                className="w-full glass rounded-xl px-4 py-2.5 text-sm outline-none focus:border-blue-400/50"
                            />
                        </div>
                        <div>
                            <label className="text-xs text-gray-400 mb-1 block">Expira em (opcional)</label>
                            <input
                                type="date"
                                value={form.expires_at}
                                onChange={(e) => setForm({ ...form, expires_at: e.target.value })}
                                className="w-full glass rounded-xl px-4 py-2.5 text-sm outline-none focus:border-blue-400/50"
                            />
                        </div>
                        <div className="sm:col-span-2 flex gap-2">
                            <button type="submit" className="glow-btn px-6 py-2.5 rounded-full text-sm font-semibold">
                                Salvar
                            </button>
                            <button
                                type="button"
                                onClick={() => setShowForm(false)}
                                className="glass px-6 py-2.5 rounded-full text-sm font-semibold"
                            >
                                Cancelar
                            </button>
                        </div>
                    </form>
                )}

                {loading ? (
                    <p className="text-gray-400 text-sm">Carregando...</p>
                ) : coupons.length === 0 ? (
                    <div className="glass rounded-2xl p-10 text-center text-gray-400 text-sm">
                        Nenhum cupom cadastrado ainda.
                    </div>
                ) : (
                    <div className="glass rounded-2xl overflow-hidden">
                        <table className="w-full text-sm">
                            <thead>
                                <tr className="text-left text-gray-400 text-xs uppercase border-b border-white/5">
                                    <th className="px-4 py-3">Código</th>
                                    <th className="px-4 py-3">Título</th>
                                    <th className="px-4 py-3">Desconto</th>
                                    <th className="px-4 py-3">Usos</th>
                                    <th className="px-4 py-3">Expira</th>
                                    <th className="px-4 py-3">Status</th>
                                    <th className="px-4 py-3"></th>
                                </tr>
                            </thead>
                            <tbody>
                                {coupons.map((c) => (
                                    <tr key={c.id} className="border-b border-white/5 last:border-0">
                                        <td className="px-4 py-3 font-mono text-cyan-400">{c.code}</td>
                                        <td className="px-4 py-3">{c.title}</td>
                                        <td className="px-4 py-3">
                                            {c.discount_type === "percentage" ? `${c.discount_value}%` : `R$ ${c.discount_value}`}
                                        </td>
                                        <td className="px-4 py-3 text-gray-400">
                                            {c.usage_count}/{c.usage_limit ?? "∞"}
                                        </td>
                                        <td className="px-4 py-3 text-gray-400">
                                            {c.expires_at ? new Date(c.expires_at).toLocaleDateString("pt-BR") : "-"}
                                        </td>
                                        <td className="px-4 py-3">
                                            <button
                                                onClick={() => toggleActive(c.id, c.active)}
                                                className={`text-xs px-2 py-1 rounded-full ${c.active ? "bg-emerald-500/20 text-emerald-400" : "bg-gray-500/20 text-gray-400"
                                                    }`}
                                            >
                                                {c.active ? "Ativo" : "Inativo"}
                                            </button>
                                        </td>
                                        <td className="px-4 py-3">
                                            <div className="flex items-center gap-2 justify-end">
                                                <button
                                                    onClick={() => startEdit(c)}
                                                    className="w-8 h-8 rounded-full glass flex items-center justify-center hover:border-blue-400/50"
                                                >
                                                    <Pencil className="w-3.5 h-3.5" />
                                                </button>
                                                <button
                                                    onClick={() => handleDelete(c.id)}
                                                    className="w-8 h-8 rounded-full glass flex items-center justify-center hover:border-red-400/50 text-red-400"
                                                >
                                                    <Trash2 className="w-3.5 h-3.5" />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>
        </div>
    );
}