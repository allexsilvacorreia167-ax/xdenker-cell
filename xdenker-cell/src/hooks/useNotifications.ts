"use client";

import { useEffect, useState, useCallback, useRef } from 'react';
import {
    fetchNotifications,
    fetchUnreadCount,
    markAsRead,
    markAllAsRead,
    deleteNotification,
    clearAllNotifications,
    clearReadNotifications,
    subscribeToNotifications,
} from '@/lib/notifications';
import { Notification, NotificationType } from '@/types/notifications';

export function useNotifications(limit = 50) {
    const [notifications, setNotifications] = useState<Notification[]>([]);
    const [unreadCount, setUnreadCount] = useState(0);
    const [loading, setLoading] = useState(true);
    const [totalCount, setTotalCount] = useState(0);
    const channelRef = useRef<ReturnType<typeof subscribeToNotifications> | null>(null);

    const refresh = useCallback(async (options?: {
        offset?: number;
        unreadOnly?: boolean;
        type?: NotificationType | 'all';
    }) => {
        try {
            setLoading(true);
            const [{ data, count }, unread] = await Promise.all([
                fetchNotifications({ limit, ...options }),
                fetchUnreadCount(),
            ]);
            setNotifications(data);
            setTotalCount(count);
            setUnreadCount(unread);
        } catch (err) {
            console.error('Erro ao carregar notificações:', err);
        } finally {
            setLoading(false);
        }
    }, [limit]);

    const refreshUnreadCount = useCallback(async () => {
        try {
            const count = await fetchUnreadCount();
            setUnreadCount(count);
        } catch (err) {
            console.error('Erro ao atualizar contador:', err);
        }
    }, []);

    const handleMarkAsRead = useCallback(async (id: string) => {
        await markAsRead(id);
        setNotifications((prev) =>
            prev.map((n) => (n.id === id ? { ...n, is_read: true } : n))
        );
        setUnreadCount((prev) => Math.max(0, prev - 1));
    }, []);

    const handleMarkAllAsRead = useCallback(async () => {
        await markAllAsRead();
        setNotifications((prev) => prev.map((n) => ({ ...n, is_read: true })));
        setUnreadCount(0);
    }, []);

    const handleDelete = useCallback(async (id: string) => {
        await deleteNotification(id);
        setNotifications((prev) => prev.filter((n) => n.id !== id));
        setTotalCount((prev) => Math.max(0, prev - 1));
        const deleted = notifications.find((n) => n.id === id);
        if (deleted && !deleted.is_read) {
            setUnreadCount((prev) => Math.max(0, prev - 1));
        }
    }, [notifications]);

    const handleClearAll = useCallback(async () => {
        await clearAllNotifications();
        setNotifications([]);
        setUnreadCount(0);
        setTotalCount(0);
    }, []);

    const handleClearRead = useCallback(async () => {
        await clearReadNotifications();
        const removedCount = notifications.filter((n) => n.is_read).length;
        setNotifications((prev) => prev.filter((n) => !n.is_read));
        setTotalCount((prev) => Math.max(0, prev - removedCount));
    }, [notifications]);

    useEffect(() => {
        channelRef.current = subscribeToNotifications((payload) => {
            if (payload.event === 'INSERT') {
                setNotifications((prev) => [payload.notification, ...prev]);
                setTotalCount((prev) => prev + 1);
                if (!payload.notification.is_read) {
                    setUnreadCount((prev) => prev + 1);
                }
            } else if (payload.event === 'UPDATE') {
                setNotifications((prev) =>
                    prev.map((n) => (n.id === payload.notification.id ? payload.notification : n))
                );
                refreshUnreadCount();
            } else if (payload.event === 'DELETE') {
                setNotifications((prev) => prev.filter((n) => n.id !== payload.notification.id));
                setTotalCount((prev) => Math.max(0, prev - 1));
                refreshUnreadCount();
            }
        });

        return () => {
            channelRef.current?.unsubscribe();
        };
    }, [refreshUnreadCount]);

    useEffect(() => {
        refresh();
    }, [refresh]);

    return {
        notifications,
        unreadCount,
        loading,
        totalCount,
        refresh,
        handleMarkAsRead,
        handleMarkAllAsRead,
        handleDelete,
        handleClearAll,
        handleClearRead,
    };
}