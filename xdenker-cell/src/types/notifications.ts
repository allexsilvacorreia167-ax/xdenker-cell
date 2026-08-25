export type NotificationType = 'venda' | 'os' | 'orcamento_aprovado' | 'orcamento_cancelado' | 'alerta_fiscal_mei';

export interface Notification {
    id: string;
    title: string;
    message: string;
    type: NotificationType;
    link: string | null;
    is_read: boolean;
    created_at: string;
}

export interface NotificationFilters {
    type: NotificationType | 'all';
    status: 'all' | 'unread' | 'read';
    search: string;
    dateFrom: string;
    dateTo: string;
}

export const notificationTypeLabels: Record<NotificationType, string> = {
    venda: 'Venda Online',
    os: 'Ordem de Serviço',
    orcamento_aprovado: 'Orçamento Aprovado',
    orcamento_cancelado: 'Orçamento Cancelado',
    alerta_fiscal_mei: 'Alerta Fiscal MEI',
};

export const notificationTypeColors: Record<NotificationType, string> = {
    venda: 'bg-emerald-500',
    os: 'bg-blue-500',
    orcamento_aprovado: 'bg-amber-500',
    orcamento_cancelado: 'bg-red-500',
    alerta_fiscal_mei: 'bg-purple-500',
};

export const notificationTypeIcons: Record<NotificationType, string> = {
    venda: 'ShoppingCart',
    os: 'Wrench',
    orcamento_aprovado: 'CheckCircle',
    orcamento_cancelado: 'XCircle',
    alerta_fiscal_mei: 'AlertTriangle',
};