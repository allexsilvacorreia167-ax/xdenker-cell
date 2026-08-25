"use client";

import { useEffect, useState } from "react";
import { supabase, Product } from "@/lib/supabase";
import AdminHeader from "@/components/admin/AdminHeader";
import { AlertTriangle } from "lucide-react";

export default function AdminEstoquePage() {
    const [products, setProducts] = useState<Product[]>([]);
    const [loading, setLoading] = useState(true);
    const [threshold, setThreshold] = useState(5);

    useEffect(() => {
        async function load() {
            const { data } = await supabase.from("products").select("*").order("stock", { ascending: true });
            setProducts((data as Product[]) ?? []);
            setLoading(false);
        }
        load();
    }, []);

    const lowStock = products.filter((p) => p.stock <= threshold);

    return (
        <div>
            <AdminHeader title="Estoque" range={30} onRangeChange={() => { }} />
            <div className="p-6 lg:p-8">
                {lowStock.length > 0 && (
                    <div className="glass rounded-2xl p-4 mb-6 flex items-center gap-3 border border-amber-400/30 bg-amber-500/5">
                        <AlertTriangle className="w-5 h-5 text-amber-400 flex-shrink-0" />
                        <p className="text-sm text-amber-300">
                            {lowStock.length} produto(s) com estoque igual ou abaixo de {threshold} unidades.
                        </p>
                    </div>
                )}

                {loading ? (
                    <p className="text-gray-400 text-sm">Carregando...</p>
                ) : (
                    <div className="glass rounded-2xl overflow-hidden">
                        <table className="w-full text-sm">
                            <thead>
                                <tr className="text-left text-gray-400 text-xs uppercase border-b border-white/5">
                                    <th className="px-4 py-3">Produto</th>
                                    <th className="px-4 py-3">Categoria</th>
                                    <th className="px-4 py-3">Estoque</th>
                                    <th className="px-4 py-3">Status</th>
                                </tr>
                            </thead>
                            <tbody>
                                {products.map((p) => (
                                    <tr key={p.id} className="border-b border-white/5 last:border-0">
                                        <td className="px-4 py-3">{p.name}</td>
                                        <td className="px-4 py-3 text-gray-400">{p.category}</td>
                                        <td className="px-4 py-3">{p.stock}</td>
                                        <td className="px-4 py-3">
                                            <span
                                                className={`text-xs px-2 py-1 rounded-full ${p.stock === 0
                                                    ? "bg-red-500/20 text-red-400"
                                                    : p.stock <= threshold
                                                        ? "bg-amber-500/20 text-amber-400"
                                                        : "bg-emerald-500/20 text-emerald-400"
                                                    }`}
                                            >
                                                {p.stock === 0 ? "Esgotado" : p.stock <= threshold ? "Baixo" : "Normal"}
                                            </span>
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