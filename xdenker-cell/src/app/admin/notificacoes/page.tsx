"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { Bell, CheckCircle2, Trash2, ArrowLeft } from "lucide-react";

type Notification = {
    id: string;
    title: string;
    message: string;
    read: boolean;
    created_at: string;
    type?: string;
};

export default function AdminNotificacoesPage() {
    const router = useRouter();
    const [notifications, setNotifications] = useState<Notification[]>([]);
    const [loading, setLoading] = useState(true);

    async function loadNotifications() {
        setLoading(true);
        const { data, error } = await supabase
            .from("notifications")
            .select("*")
            .order("created_at", { ascending: false });

        if (error) {
            console.error("Erro ao carregar notificações:", error.message);
        } else {
            setNotifications(data || []);
        }
        setLoading(false);
    }

    useEffect(() => {
        loadNotifications();
    }, []);

    async function markAsRead(id: string) {
        const { error } = await supabase
            .from("notifications")
            .update({ read: true })
            .eq("id", id);

        if (!error) {
            setNotifications((prev) =>
                prev.map((n) => (n.id === id ? { ...n, read: true } : n))
            );
        }
    }

    async function markAllAsRead() {
        const { error } = await supabase
            .from("notifications")
            .update({ read: true })
            .eq("read", false);

        if (!error) {
            setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
        }
    }

    async function deleteNotification(id: string) {
        const { error } = await supabase
            .from("notifications")
            .delete()
            .eq("id", id);

        if (!error) {
            setNotifications((prev) => prev.filter((n) => n.id !== id));
        }
    }

    return (
        <div className="p-6 lg:p-10 max-w-4xl mx-auto space-y-6">
            {/* Cabeçalho */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                    <button
                        onClick={() => router.back()}
                        className="p-2 rounded-xl bg-white/5 hover:bg-white/10 text-gray-300 transition cursor-pointer border border-white/5"
                        title="Voltar"
                    >
                        <ArrowLeft className="w-5 h-5" />
                    </button>
                    <h1 className="text-2xl font-bold flex items-center gap-2 text-white">
                        <Bell className="w-6 h-6 text-cyan-400" />
                        Todas as Notificações
                    </h1>
                </div>

                <div className="flex items-center gap-3">
                    <button
                        onClick={markAllAsRead}
                        className="text-xs font-semibold px-4 py-2 rounded-xl bg-cyan-500/20 text-cyan-300 hover:bg-cyan-500/30 transition border border-cyan-500/30 cursor-pointer flex items-center gap-1.5"
                    >
                        <CheckCircle2 className="w-4 h-4" />
                        Marcar todas como lidas
                    </button>
                </div>
            </div>

            {/* Lista de Notificações */}
            {loading ? (
                <p className="text-sm text-gray-400">Carregando notificações...</p>
            ) : notifications.length === 0 ? (
                <div className="glass rounded-2xl p-10 text-center text-gray-400 text-sm">
                    Nenhuma notificação encontrada no sistema.
                </div>
            ) : (
                <div className="space-y-3">
                    {notifications.map((item) => (
                        <div
                            key={item.id}
                            className={`glass rounded-2xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4 transition-all border ${!item.read
                                ? "border-cyan-500/30 bg-cyan-500/5"
                                : "border-white/5"
                                }`}
                        >
                            <div className="space-y-1">
                                <div className="flex items-center gap-2">
                                    {!item.read && (
                                        <span className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse" />
                                    )}
                                    <h2 className="text-sm font-semibold text-white">
                                        {item.title}
                                    </h2>
                                    <span className="text-[10px] text-gray-500 ml-2">
                                        {new Date(item.created_at).toLocaleString("pt-BR")}
                                    </span>
                                </div>
                                <p className="text-xs text-gray-300 leading-relaxed">
                                    {item.message}
                                </p>
                            </div>

                            <div className="flex items-center gap-2 self-end sm:self-center">
                                {!item.read && (
                                    <button
                                        onClick={() => markAsRead(item.id)}
                                        className="text-xs px-3 py-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-gray-300 transition flex items-center gap-1 cursor-pointer border border-white/5"
                                        title="Marcar como lida"
                                    >
                                        <CheckCircle2 className="w-3.5 h-3.5 text-cyan-400" />
                                        <span>Lida</span>
                                    </button>
                                )}
                                <button
                                    onClick={() => deleteNotification(item.id)}
                                    className="p-2 rounded-lg bg-red-500/10 hover:bg-red-500/20 text-red-400 transition cursor-pointer border border-red-500/20"
                                    title="Excluir notificação"
                                >
                                    <Trash2 className="w-4 h-4" />
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}