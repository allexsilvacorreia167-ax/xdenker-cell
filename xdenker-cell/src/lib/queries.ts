import { supabase, Product } from "./supabase";

export async function getProductsByCategories(categories: string[]): Promise<Product[]> {
    const { data, error } = await supabase
        .from("products")
        .select("*")
        .in("category", categories)
        .eq("active", true)
        .order("created_at", { ascending: false });

    if (error) {
        console.error("Erro ao buscar produtos:", error.message);
        return [];
    }
    return (data as Product[]) ?? [];
}

export async function getProductBySlug(slug: string): Promise<Product | null> {
    const { data, error } = await supabase
        .from("products")
        .select("*")
        .eq("slug", slug)
        .eq("active", true)
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle();

    if (error) {
        console.error("Erro ao buscar produto:", error.message);
        return null;
    }
    return data as Product | null;
}

export async function getFeaturedProducts(limit = 3): Promise<Product[]> {
    const { data, error } = await supabase
        .from("products")
        .select("*")
        .eq("featured", true)
        .eq("active", true)
        .limit(limit);

    if (error) {
        console.error("Erro ao buscar destaques:", error.message);
        return [];
    }
    return (data as Product[]) ?? [];
}

export async function getLatestProducts(limit = 3): Promise<Product[]> {
    const { data, error } = await supabase
        .from("products")
        .select("*")
        .eq("active", true)
        .order("created_at", { ascending: false })
        .limit(limit);

    if (error) {
        console.error("Erro ao buscar novidades:", error.message);
        return [];
    }
    return (data as Product[]) ?? [];
}

export async function searchProducts(query: string, limit = 8): Promise<Product[]> {
    if (!query.trim()) return [];
    const { data, error } = await supabase
        .from("products")
        .select("*")
        .eq("active", true)
        .ilike("name", `%${query}%`)
        .limit(limit);

    if (error) {
        console.error("Erro na busca:", error.message);
        return [];
    }
    return (data as Product[]) ?? [];
}

export async function getProductByBarcode(barcode: string): Promise<Product | null> {
    const { data, error } = await supabase
        .from("products")
        .select("*")
        .eq("barcode", barcode.trim())
        .eq("active", true)
        .maybeSingle();

    if (error || !data) return null;
    return data as Product;
}

export const CELULARES_CATEGORIES = ["iphone", "android"];
export const COMPUTADORES_CATEGORIES = ["macbook", "gaming", "custom"];
export const ACESSORIOS_CATEGORIES = ["audio", "capas"];

export type PromoLeftItem = {
    id: string;
    product_slug: string | null;
    name: string;
    image_url: string | null;
    original_price: number;
    discount_price: number;
    installment_count: number;
    installment_price: number | null;
    sort_order: number;
};

export type PromoKit = {
    id: string;
    title: string;
    original_price: number | null;
    image_url: string | null;
    items: string[];
    cta_text: string;
    cta_href: string;
};

export type PromoCampaign = {
    id: string;
    slug: string;
    brand_label: string;
    title_line1: string;
    title_line2: string;
    perk_1: string;
    perk_2: string;
    perk_3: string;
    expires_at: string | null;
    active: boolean;
};

export async function getActiveCampaigns(): Promise<PromoCampaign[]> {
    const { data, error } = await supabase
        .from("promo_campaigns")
        .select("*")
        .eq("active", true)
        .order("created_at", { ascending: false });

    if (error) return [];
    return (data as PromoCampaign[]) ?? [];
}

export async function getCampaignBySlug(slug: string) {
    const { data: campaign } = await supabase
        .from("promo_campaigns")
        .select("*")
        .eq("slug", slug)
        .eq("active", true)
        .maybeSingle();

    if (!campaign) return null;

    const [{ data: leftItems }, { data: kit }] = await Promise.all([
        supabase
            .from("promo_left_items")
            .select("*")
            .eq("campaign_id", campaign.id)
            .order("sort_order", { ascending: true }),
        supabase.from("promo_kits").select("*").eq("campaign_id", campaign.id).maybeSingle(),
    ]);

    return {
        campaign: campaign as PromoCampaign,
        leftItems: (leftItems as PromoLeftItem[]) ?? [],
        kit: kit as PromoKit | null,
    };
}

export async function getOnlineAnalytics(startDate: Date, endDate: Date) {
    const startISO = startDate.toISOString();
    const endISO = endDate.toISOString();

    const [{ data: paidOrders }, { data: visits }, { data: allOnlineOrders }] = await Promise.all([
        supabase
            .from("orders")
            .select("total, items, created_at, status")
            .eq("source", "online")
            .eq("status", "paid")
            .gte("created_at", startISO)
            .lte("created_at", endISO),
        supabase
            .from("site_visits")
            .select("session_id")
            .gte("created_at", startISO)
            .lte("created_at", endISO),
        supabase
            .from("orders")
            .select("status, created_at")
            .eq("source", "online")
            .gte("created_at", startISO)
            .lte("created_at", endISO),
    ]);

    const orders = paidOrders ?? [];
    const revenue = orders.reduce((sum, o) => sum + (o.total as number), 0);
    const orderCount = orders.length;
    const avgTicket = orderCount > 0 ? revenue / orderCount : 0;

    const uniqueVisitors = new Set((visits ?? []).map((v) => v.session_id)).size;
    const conversionRate = uniqueVisitors > 0 ? (orderCount / uniqueVisitors) * 100 : 0;

    const byDay: Record<string, number> = {};
    orders.forEach((o) => {
        const day = new Date(o.created_at as string).toISOString().slice(0, 10);
        byDay[day] = (byDay[day] ?? 0) + (o.total as number);
    });
    const revenueByDay = Object.entries(byDay)
        .map(([date, total]) => ({ date, total }))
        .sort((a, b) => a.date.localeCompare(b.date));

    const productCount: Record<string, number> = {};
    orders.forEach((o) => {
        const items = (o.items as { name: string; quantity: number }[]) ?? [];
        items.forEach((item) => {
            productCount[item.name] = (productCount[item.name] ?? 0) + item.quantity;
        });
    });
    const topProducts = Object.entries(productCount)
        .map(([name, qty]) => ({ name, qty }))
        .sort((a, b) => b.qty - a.qty)
        .slice(0, 5);

    const allOrders = allOnlineOrders ?? [];
    const deliveryStats = {
        delivered: allOrders.filter((o) => o.status === "delivered").length,
        shipped: allOrders.filter((o) => o.status === "shipped").length,
        cancelled: allOrders.filter((o) => o.status === "cancelled" || o.status === "refunded").length,
        total: allOrders.length,
    };

    return {
        revenue,
        orderCount,
        avgTicket,
        uniqueVisitors,
        conversionRate,
        revenueByDay,
        topProducts,
        deliveryStats,
    };
}

export type SaleReceipt = {
    id: string;
    order_id: string;
    receipt_number: string;
    items: { name: string; quantity: number; price: number }[];
    subtotal: number;
    tax_regime: string;
    tax_rate: number;
    tax_amount: number;
    gateway_fee_rate: number;
    gateway_fee_amount: number;
    total: number;
    payment_method: string | null;
    created_at: string;
    // Campos adicionados para a Nota Fiscal Oficial:
    official_invoice_path?: string | null;
    official_invoice_number?: string | null;
    official_invoice_uploaded_at?: string | null;
};

export async function getReceiptByOrderId(orderId: string): Promise<SaleReceipt | null> {
    const { data, error } = await supabase.from("sale_receipts").select("*").eq("order_id", orderId).maybeSingle();
    if (error || !data) return null;
    return data as SaleReceipt;
}

export async function getInvoiceSignedUrl(path: string): Promise<string | null> {
    const { data, error } = await supabase.storage.from("invoices").createSignedUrl(path, 3600);
    if (error || !data) return null;
    return data.signedUrl;
}