"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { X, Search as SearchIcon } from "lucide-react";
import { searchProducts } from "@/lib/queries";
import { Product } from "@/lib/supabase";

function formatPrice(value: number) {
    return value.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

export default function SearchOverlay({ open, onClose }: { open: boolean; onClose: () => void }) {
    const [query, setQuery] = useState("");
    const [results, setResults] = useState<Product[]>([]);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (!open) {
            setQuery("");
            setResults([]);
        }
    }, [open]);

    useEffect(() => {
        if (!query.trim()) {
            setResults([]);
            return;
        }
        setLoading(true);
        const timer = setTimeout(async () => {
            const data = await searchProducts(query);
            setResults(data);
            setLoading(false);
        }, 300);
        return () => clearTimeout(timer);
    }, [query]);

    if (!open) return null;

    return (
        <div className="fixed inset-0 z-[110] bg-black/70 flex flex-col items-center pt-16 px-4">
            <div className="w-full max-w-lg">
                <div className="glass-strong rounded-2xl p-3 flex items-center gap-2">
                    <SearchIcon className="w-5 h-5 text-gray-400 flex-shrink-0" />
                    <input
                        autoFocus
                        value={query}
                        onChange={(e) => setQuery(e.target.value)}
                        placeholder="Buscar produtos..."
                        className="flex-1 bg-transparent outline-none text-sm"
                    />
                    <button onClick={onClose} className="w-8 h-8 rounded-full glass flex items-center justify-center flex-shrink-0">
                        <X className="w-4 h-4" />
                    </button>
                </div>

                {query.trim() && (
                    <div className="glass-strong rounded-2xl mt-3 max-h-[60vh] overflow-y-auto">
                        {loading ? (
                            <p className="text-sm text-gray-400 p-4">Buscando...</p>
                        ) : results.length === 0 ? (
                            <p className="text-sm text-gray-400 p-4">Nenhum produto encontrado para &quot;{query}&quot;.</p>
                        ) : (
                            results.map((p) => (
                                <Link
                                    key={p.id}
                                    href={`/produto/${p.slug}`}
                                    onClick={onClose}
                                    className="flex items-center gap-3 px-4 py-3 hover:bg-white/5 transition border-b border-white/5 last:border-0"
                                >
                                    <div className="w-12 h-12 rounded-lg bg-slate-800 overflow-hidden flex-shrink-0">
                                        {p.images?.[0] && (
                                            // eslint-disable-next-line @next/next/no-img-element
                                            <img src={p.images[0]} alt="" className="w-full h-full object-cover" />
                                        )}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <div className="text-sm font-medium truncate">{p.name}</div>
                                        <div className="text-xs text-cyan-400">{formatPrice(p.price)}</div>
                                    </div>
                                </Link>
                            ))
                        )}
                    </div>
                )}
            </div>
        </div>
    );
}