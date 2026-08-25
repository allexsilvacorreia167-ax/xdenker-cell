"use client";

import { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
    Bell,
    ShoppingCart,
    Wrench,
    CheckCircle,
    XCircle,
    AlertTriangle,
    Check,
    Trash2,
    ArrowRight,
    X,
    Clock,
} from "lucide-react";
import { useNotifications } from "@/hooks/useNotifications";
import {
    Notification,
    notificationTypeLabels,
    notificationTypeIcons,
} from "@/types/notifications";

const iconMap: Record<string, React.ElementType> = {
    ShoppingCart,
    Wrench,
    CheckCircle,
    XCircle,
    AlertTriangle,
};

const typeStyles: Record<string, string> = {
    venda: "text-emerald-400 bg-emerald-500/10",
    os: "text-blue-400 bg-blue-500/10",
    orcamento_aprovado: "text-cyan-400 bg-cyan-500/10",
    orcamento_cancelado: "text-red-400 bg-red-500/10",
    alerta_fiscal_mei: "text-amber-400 bg-amber-500/10",
};

function NotificationItem({
    notification,
    onMarkAsRead,
    onDelete,
}: {
    notification: Notification;
    onMarkAsRead: (id: string) => void;
    onDelete: (id: string) => void;
}) {
    const router = useRouter();
    const Icon = iconMap[notificationTypeIcons[notification.type]] || Bell;
    const style = typeStyles[notification.type] ?? "text-gray-400 bg-gray-500/10";

    function handleClick() {
        if (!notification.is_read) onMarkAsRead(notification.id);
        if (notification.link) router.push(notification.link);
    }

    function timeAgo(date: string) {
        const seconds = Math.floor((Date.now() - new Date(date).getTime()) / 1000);
        if (seconds < 60) return "agora";
        const minutes = Math.floor(seconds / 60);
        if (minutes < 60) return `${minutes}min`;
        const hours = Math.floor(minutes / 60);
        if (hours < 24) return `${hours}h`;
        return `${Math.floor(hours / 24)}d`;
    }

    return (
        <div
            onClick={handleClick}
            className={`group relative flex items-start gap-3 p-3 cursor-pointer transition-colors hover:bg-white/5 border-b border-white/5 last:border-0 ${!notification.is_read ? "bg-white/[0.03]" : ""
                }`}
        >
            {!notification.is_read && (
                <span className="absolute left-1 top-4 w-1.5 h-1.5 rounded-full bg-cyan-400" />
            )}
            <div className={`p-2 rounded-lg ${style} mt-0.5 flex-shrink-0`}>
                <Icon className="w-4 h-4" />
            </div>
            <div className="flex-1 min-w-0">
                <p className={`text-sm ${!notification.is_read ? "font-medium text-white" : "text-gray-300"}`}>
                    {notification.title}
                </p>
                <p className="text-xs text-gray-500 mt-0.5 line-clamp-2">{notification.message}</p>
                <div className="flex items-center gap-2 mt-1.5">
                    <span className="text-[10px] text-gray-600 flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        {timeAgo(notification.created_at)}
                    </span>
                    <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-white/5 text-gray-500">
                        {notificationTypeLabels[notification.type]}
                    </span>
                </div>
            </div>
            <div className="flex flex-col gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                {!notification.is_read && (
                    <button
                        onClick={(e) => {
                            e.stopPropagation();
                            onMarkAsRead(notification.id);
                        }}
                        className="p-1 rounded hover:bg-white/10 text-gray-500 hover:text-emerald-400"
                    >
                        <Check className="w-3.5 h-3.5" />
                    </button>
                )}
                <button
                    onClick={(e) => {
                        e.stopPropagation();
                        onDelete(notification.id);
                    }}
                    className="p-1 rounded hover:bg-white/10 text-gray-500 hover:text-red-400"
                >
                    <Trash2 className="w-3.5 h-3.5" />
                </button>
            </div>
        </div>
    );
}

export function NotificationBell() {
    const [open, setOpen] = useState(false);
    const dropdownRef = useRef<HTMLDivElement>(null);
    const router = useRouter();
    const { notifications, unreadCount, loading, handleMarkAsRead, handleMarkAllAsRead, handleDelete } =
        useNotifications(8);

    useEffect(() => {
        function handleClickOutside(event: MouseEvent) {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                setOpen(false);
            }
        }
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    const recent = notifications.slice(0, 6);

    return (
        <div className="relative" ref={dropdownRef}>
            <button
                onClick={() => setOpen((v) => !v)}
                className="relative w-10 h-10 rounded-full glass flex items-center justify-center hover:border-cyan-400/40 transition"
            >
                <Bell className="w-4 h-4 text-cyan-300" />
                {unreadCount > 0 && (
                    <span className="absolute -top-1 -right-1 min-w-[18px] h-[18px] flex items-center justify-center bg-red-500 text-white text-[10px] font-bold rounded-full px-1">
                        {unreadCount > 99 ? "99+" : unreadCount}
                    </span>
                )}
            </button>

            {open && (
                <div className="absolute right-0 top-full mt-2 w-[360px] glass-strong rounded-2xl shadow-2xl shadow-black/50 overflow-hidden z-50">
                    <div className="flex items-center justify-between px-4 py-3 border-b border-white/10">
                        <div>
                            <h3 className="text-sm font-semibold text-white">Notificações</h3>
                            <p className="text-xs text-gray-500">
                                {unreadCount > 0 ? `${unreadCount} não lida(s)` : "Tudo em dia"}
                            </p>
                        </div>
                        <div className="flex items-center gap-1">
                            {unreadCount > 0 && (
                                <button
                                    onClick={handleMarkAllAsRead}
                                    className="p-1.5 rounded-lg hover:bg-white/10 text-gray-500 hover:text-emerald-400"
                                    title="Marcar todas como lidas"
                                >
                                    <Check className="w-4 h-4" />
                                </button>
                            )}
                            <button onClick={() => setOpen(false)} className="p-1.5 rounded-lg hover:bg-white/10 text-gray-500 hover:text-white">
                                <X className="w-4 h-4" />
                            </button>
                        </div>
                    </div>

                    <div className="max-h-[400px] overflow-y-auto">
                        {loading ? (
                            <div className="flex items-center justify-center py-8">
                                <div className="w-5 h-5 border-2 border-white/10 border-t-cyan-400 rounded-full animate-spin" />
                            </div>
                        ) : recent.length === 0 ? (
                            <div className="flex flex-col items-center justify-center py-8 text-gray-600">
                                <Bell className="w-8 h-8 mb-2 opacity-50" />
                                <p className="text-sm">Nenhuma notificação</p>
                            </div>
                        ) : (
                            recent.map((n) => (
                                <NotificationItem key={n.id} notification={n} onMarkAsRead={handleMarkAsRead} onDelete={handleDelete} />
                            ))
                        )}
                    </div>

                    <div className="border-t border-white/10 p-2">
                        <button
                            onClick={() => {
                                setOpen(false);
                                router.push("/admin/notificacoes");
                            }}
                            className="w-full flex items-center justify-center gap-2 py-2 px-4 rounded-lg text-sm text-gray-400 hover:text-white hover:bg-white/5 transition"
                        >
                            Ver todas as notificações
                            <ArrowRight className="w-3.5 h-3.5" />
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}