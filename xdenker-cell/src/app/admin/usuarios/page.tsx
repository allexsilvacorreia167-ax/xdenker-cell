"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { Search, ChevronLeft, ChevronRight, Loader2, Users } from "lucide-react";

type Profile = {
    id: string;
    full_name: string | null;
    email: string | null;
    phone: string | null;
    cpf: string | null;
    role: string | null;
    created_at: string;
};

const roleConfig: Record<string, { label: string; color: string }> = {
    admin: { label: "Admin", color: "bg-purple-500/20 text-purple-300 border-purple-400/30" },
    atendente: { label: "Atendente", color: "bg-blue-500/20 text-blue-300 border-blue-400/30" },
    tecnico: { label: "Técnico", color: "bg-amber-500/20 text-amber-300 border-amber-400/30" },
    cliente: { label: "Cliente", color: "bg-emerald-500/20 text-emerald-300 border-emerald-400/30" },
};

const PAGE_SIZE = 10;

export default function AdminUsuariosPage() {
    const [profiles, setProfiles] = useState<Profile[]>([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState("");
    const [page, setPage] = useState(0);
    const [total, setTotal] = useState(0);

    async function loadProfiles() {
        setLoading(true);

        let query = supabase
            .from("profiles")
            .select("*", { count: "exact" })
            .order("created_at", { ascending: false })
            .range(page * PAGE_SIZE, (page + 1) * PAGE_SIZE - 1);

        if (search.trim()) {
            const term = `%${search.trim()}%`;
            query = query.or(
                `full_name.ilike.${term},email.ilike.${term},phone.ilike.${term}`
            );
        }

        const { data, error, count } = await query;

        if (!error) {
            setProfiles((data as Profile[]) || []);
            setTotal(count || 0);
        } else {
            console.error("Erro ao carregar usuários:", error);
            setProfiles([]);
            setTotal(0);
        }

        setLoading(false);
    }

    useEffect(() => {
        loadProfiles();
    }, [page]);

    // Debounce da busca
    useEffect(() => {
        const timer = setTimeout(() => {
            setPage(0);
            loadProfiles();
        }, 400);
        return () => clearTimeout(timer);
    }, [search]);

    const totalPages = Math.ceil(total / PAGE_SIZE);

    function formatDate(dateStr: string) {
        return new Date(dateStr).toLocaleDateString("pt-BR", {
            day: "2-digit",
            month: "2-digit",
            year: "numeric",
        });
    }

    return (
        <div className="p-6 max-w-7xl mx-auto">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
                <div>
                    <h1 className="text-2xl font-bold text-white">Usuários</h1>
                    <p className="text-sm text-gray-400 mt-1">
                        {total} {total === 1 ? "usuário cadastrado" : "usuários cadastrados"}
                    </p>
                </div>
            </div>

            {/* Search */}
            <div className="relative mb-6 max-w-md">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
                <input
                    type="text"
                    placeholder="Buscar por nome, e-mail ou telefone..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className="w-full glass rounded-xl pl-10 pr-4 py-2.5 text-sm outline-none focus:border-cyan-400/50 transition"
                />
            </div>

            {/* Table */}
            <div className="glass rounded-2xl overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                        <thead>
                            <tr className="text-left text-gray-400 text-xs uppercase border-b border-white/5">
                                <th className="px-4 py-3 font-medium">Nome</th>
                                <th className="px-4 py-3 font-medium">E-mail</th>
                                <th className="px-4 py-3 font-medium">Telefone</th>
                                <th className="px-4 py-3 font-medium">CPF</th>
                                <th className="px-4 py-3 font-medium">Perfil</th>
                                <th className="px-4 py-3 font-medium">Cadastrado em</th>
                            </tr>
                        </thead>
                        <tbody>
                            {loading ? (
                                <tr>
                                    <td colSpan={6} className="px-4 py-16 text-center">
                                        <div className="flex items-center justify-center gap-2 text-gray-400">
                                            <Loader2 className="w-5 h-5 animate-spin" />
                                            Carregando usuários...
                                        </div>
                                    </td>
                                </tr>
                            ) : profiles.length === 0 ? (
                                <tr>
                                    <td colSpan={6} className="px-4 py-16 text-center">
                                        <div className="flex flex-col items-center gap-2 text-gray-500">
                                            <Users className="w-8 h-8 opacity-40" />
                                            <p>Nenhum usuário encontrado</p>
                                        </div>
                                    </td>
                                </tr>
                            ) : (
                                profiles.map((user) => {
                                    const role = roleConfig[user.role || "cliente"] || roleConfig.cliente;
                                    return (
                                        <tr
                                            key={user.id}
                                            className="border-b border-white/5 hover:bg-white/[0.02] transition"
                                        >
                                            <td className="px-4 py-3.5">
                                                <div className="font-medium text-white">
                                                    {user.full_name || "—"}
                                                </div>
                                            </td>
                                            <td className="px-4 py-3.5 text-gray-300">
                                                {user.email || "—"}
                                            </td>
                                            <td className="px-4 py-3.5 text-gray-300">
                                                {user.phone || "—"}
                                            </td>
                                            <td className="px-4 py-3.5 text-gray-400 text-xs">
                                                {user.cpf || "—"}
                                            </td>
                                            <td className="px-4 py-3.5">
                                                <span
                                                    className={`inline-flex px-2.5 py-0.5 rounded-full text-[11px] font-medium border ${role.color}`}
                                                >
                                                    {role.label}
                                                </span>
                                            </td>
                                            <td className="px-4 py-3.5 text-gray-400 text-xs">
                                                {formatDate(user.created_at)}
                                            </td>
                                        </tr>
                                    );
                                })
                            )}
                        </tbody>
                    </table>
                </div>

                {/* Pagination */}
                {totalPages > 1 && (
                    <div className="flex items-center justify-between px-4 py-3 border-t border-white/5">
                        <p className="text-xs text-gray-500">
                            Página {page + 1} de {totalPages}
                        </p>
                        <div className="flex items-center gap-2">
                            <button
                                onClick={() => setPage((p) => Math.max(0, p - 1))}
                                disabled={page === 0}
                                className="glass w-8 h-8 rounded-lg flex items-center justify-center disabled:opacity-30 hover:border-cyan-400/40 transition"
                            >
                                <ChevronLeft className="w-4 h-4" />
                            </button>
                            <button
                                onClick={() => setPage((p) => Math.min(totalPages - 1, p + 1))}
                                disabled={page >= totalPages - 1}
                                className="glass w-8 h-8 rounded-lg flex items-center justify-center disabled:opacity-30 hover:border-cyan-400/40 transition"
                            >
                                <ChevronRight className="w-4 h-4" />
                            </button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}