import { supabase } from './supabase';
import { Notification, NotificationType } from '@/types/notifications';

const TABLE = 'notifications';

export async function fetchNotifications(options?: {
    limit?: number;
    unreadOnly?: boolean;
    type?: NotificationType | 'all';
    offset?: number;
}) {
    const { limit = 50, unreadOnly = false, type = 'all', offset = 0 } = options || {};

    let query = supabase
        .from(TABLE)
        .select('*', { count: 'exact' })
        .order('created_at', { ascending: false })
        .range(offset, offset + limit - 1);

    if (unreadOnly) {
        query = query.eq('is_read', false);
    }

    if (type !== 'all') {
        query = query.eq('type', type);
    }

    const { data, error, count } = await query;

    if (error) throw error;
    return { data: (data as Notification[]) || [], count: count || 0 };
}

export async function fetchUnreadCount() {
    const { count, error } = await supabase
        .from(TABLE)
        .select('*', { count: 'exact', head: true })
        .eq('is_read', false);

    if (error) throw error;
    return count || 0;
}

export async function markAsRead(id: string) {
    const { error } = await supabase
        .from(TABLE)
        .update({ is_read: true })
        .eq('id', id);

    if (error) throw error;
}

export async function markAllAsRead() {
    const { error } = await supabase
        .from(TABLE)
        .update({ is_read: true })
        .eq('is_read', false);

    if (error) throw error;
}

export async function deleteNotification(id: string) {
    const { error } = await supabase
        .from(TABLE)
        .delete()
        .eq('id', id);

    if (error) throw error;
}

export async function clearAllNotifications() {
    const { error } = await supabase
        .from(TABLE)
        .delete()
        .neq('id', '00000000-0000-0000-0000-000000000000');

    if (error) throw error;
}

export async function clearReadNotifications() {
    const { error } = await supabase
        .from(TABLE)
        .delete()
        .eq('is_read', true);

    if (error) throw error;
}

export async function createNotification(notification: Omit<Notification, 'id' | 'created_at' | 'is_read'>) {
    const { data, error } = await supabase
        .from(TABLE)
        .insert({
            ...notification,
            is_read: false,
        })
        .select()
        .single();

    if (error) throw error;
    return data as Notification;
}

export function subscribeToNotifications(callback: (payload: { event: string; notification: Notification }) => void) {
    const channel = supabase
        .channel('notifications_changes')
        .on(
            'postgres_changes',
            {
                event: '*',
                schema: 'public',
                table: TABLE,
            },
            (payload) => {
                callback({
                    event: payload.eventType,
                    notification: payload.new as Notification,
                });
            }
        )
        .subscribe();

    return channel;
}