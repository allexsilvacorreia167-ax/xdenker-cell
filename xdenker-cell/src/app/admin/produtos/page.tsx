"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { supabase, Product } from "@/lib/supabase";
import { Plus, Pencil, Trash2 } from "lucide-react";

function formatPrice(value: number) {
    return value.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

export default function AdminProdutosPage() {
    const [products, setProducts] = useState<Product[]>([]);
    const [loading, setLoading] = useState(true);

    async function load() {
        const { data } = await supabase.from("products").select("*").order("created_at", { ascending: false });
        setProducts((data as Product[]) ?? []);
        setLoading(false);
    }

    useEffect(() => {
        load();
    }, []);

    async function handleDelete(id: string) {
        if (!confirm("Excluir este produto?")) return;
        await supabase.from("products").delete().eq("id", id);
        load();
    }

    return (
        <div>
            <div className="flex items-center justify-between mb-6">
                <h1 className="text-2xl font-bold text-white">Produtos</h1>
                <Link
                    href="/admin/produtos/novo"
                    className="glow-btn px-5 py-2.5 rounded-full text-sm font-semibold flex items-center gap-2"
                >
                    <Plus className="w-4 h-4" />
                    Novo Produto
                </Link>
            </div>

            {loading ? (
                <p className="text-gray-400 text-sm">Carregando...</p>
            ) : (
                <div className="glass rounded-2xl overflow-hidden">
                    <table className="w-full text-sm">
                        <thead>
                            <tr className="text-left text-gray-400 text-xs uppercase border-b border-white/5">
                                <th className="px-4 py-3">Produto</th>
                                <th className="px-4 py-3">Categoria</th>
                                <th className="px-4 py-3">Preço</th>
                                <th className="px-4 py-3">Estoque</th>
                                <th className="px-4 py-3">Status</th>
                                <th className="px-4 py-3"></th>
                            </tr>
                        </thead>
                        <tbody>
                            {products.map((p) => (
                                <tr key={p.id} className="border-b border-white/5 last:border-0">
                                    <td className="px-4 py-3 flex items-center gap-3">
                                        <div className="w-9 h-9 rounded-lg bg-slate-800 overflow-hidden flex-shrink-0">
                                            {p.images?.[0] && (
                                                // eslint-disable-next-line @next/next/no-img-element
                                                <img src={p.images[0]} alt="" className="w-full h-full object-cover" />
                                            )}
                                        </div>
                                        <span className="truncate max-w-[220px]">{p.name}</span>
                                    </td>
                                    <td className="px-4 py-3 text-gray-400">{p.category}</td>
                                    <td className="px-4 py-3">{formatPrice(p.price)}</td>
                                    <td className="px-4 py-3">{p.stock}</td>
                                    <td className="px-4 py-3">
                                        <span
                                            className={`text-xs px-2 py-1 rounded-full ${p.active ? "bg-emerald-500/20 text-emerald-400" : "bg-gray-500/20 text-gray-400"
                                                }`}
                                        >
                                            {p.active ? "Ativo" : "Inativo"}
                                        </span>
                                    </td>
                                    <td className="px-4 py-3">
                                        <div className="flex items-center gap-2 justify-end">
                                            <Link
                                                href={`/admin/produtos/${p.id}`}
                                                className="w-8 h-8 rounded-full glass flex items-center justify-center hover:border-blue-400/50"
                                            >
                                                <Pencil className="w-3.5 h-3.5" />
                                            </Link>
                                            <button
                                                onClick={() => handleDelete(p.id)}
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
    );
}