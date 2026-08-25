"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { supabase } from "@/lib/supabase";
import AdminHeader from "@/components/admin/AdminHeader";
import { Plus, Pencil, Trash2 } from "lucide-react";

type Campaign = { id: string; slug: string; title_line1: string; title_line2: string; active: boolean };

export default function AdminCampanhasPage() {
    const [campaigns, setCampaigns] = useState<Campaign[]>([]);
    const [loading, setLoading] = useState(true);

    async function load() {
        const { data } = await supabase
            .from("promo_campaigns")
            .select("id, slug, title_line1, title_line2, active")
            .order("created_at", { ascending: false });
        setCampaigns((data as Campaign[]) ?? []);
        setLoading(false);
    }

    useEffect(() => {
        load();
    }, []);

    async function handleDelete(id: string) {
        if (!confirm("Excluir esta campanha?")) return;
        await supabase.from("promo_campaigns").delete().eq("id", id);
        load();
    }

    return (
        <div>
            <AdminHeader title="Campanhas Promocionais" range={30} onRangeChange={() => { }} />
            <div className="p-6 lg:p-8">
                <div className="flex justify-between items-center mb-6">
                    <Link href="/admin/ofertas" className="text-sm text-cyan-400 hover:underline">
                        ← Voltar pra Ofertas
                    </Link>
                    <Link
                        href="/admin/ofertas/campanhas/nova"
                        className="glow-btn px-5 py-2.5 rounded-full text-sm font-semibold flex items-center gap-2"
                    >
                        <Plus className="w-4 h-4" />
                        Nova Campanha
                    </Link>
                </div>

                {loading ? (
                    <p className="text-gray-400 text-sm">Carregando...</p>
                ) : campaigns.length === 0 ? (
                    <div className="glass rounded-2xl p-10 text-center text-gray-400 text-sm">
                        Nenhuma campanha criada ainda. Clique em &quot;Nova Campanha&quot; acima pra começar.
                    </div>
                ) : (
                    <div className="space-y-3">
                        {campaigns.map((c) => (
                            <div key={c.id} className="glass rounded-2xl p-4 flex items-center justify-between">
                                <div>
                                    <div className="text-sm font-medium text-white">
                                        {c.title_line1} {c.title_line2}
                                    </div>
                                    <div className="text-xs text-gray-500">/ofertas/{c.slug}</div>
                                </div>
                                <div className="flex items-center gap-2">
                                    <span
                                        className={`text-xs px-2 py-1 rounded-full ${c.active ? "bg-emerald-500/20 text-emerald-400" : "bg-gray-500/20 text-gray-400"
                                            }`}
                                    >
                                        {c.active ? "Ativa" : "Inativa"}
                                    </span>
                                    <Link
                                        href={`/admin/ofertas/campanhas/${c.id}`}
                                        className="w-8 h-8 rounded-full glass flex items-center justify-center hover:border-blue-400/50"
                                    >
                                        <Pencil className="w-3.5 h-3.5" />
                                    </Link>
                                    <button
                                        onClick={() => handleDelete(c.id)}
                                        className="w-8 h-8 rounded-full glass flex items-center justify-center hover:border-red-400/50 text-red-400"
                                    >
                                        <Trash2 className="w-3.5 h-3.5" />
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}