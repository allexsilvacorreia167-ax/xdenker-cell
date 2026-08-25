"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { supabase } from "@/lib/supabase";
import CampaignForm, { CampaignFormData } from "@/components/admin/CampaignForm";
import AdminHeader from "@/components/admin/AdminHeader";

export default function EditarCampanhaPage() {
    const params = useParams<{ id: string }>();
    const [initial, setInitial] = useState<Partial<CampaignFormData> | null>(null);

    useEffect(() => {
        async function load() {
            const [{ data: campaign }, { data: leftItems }, { data: kit }] = await Promise.all([
                supabase.from("promo_campaigns").select("*").eq("id", params.id).single(),
                supabase.from("promo_left_items").select("*").eq("campaign_id", params.id).order("sort_order"),
                supabase.from("promo_kits").select("*").eq("campaign_id", params.id).maybeSingle(),
            ]);

            if (!campaign) return;

            setInitial({
                id: campaign.id,
                slug: campaign.slug,
                brand_label: campaign.brand_label,
                title_line1: campaign.title_line1,
                title_line2: campaign.title_line2,
                perk_1: campaign.perk_1,
                perk_2: campaign.perk_2,
                perk_3: campaign.perk_3,
                expires_at: campaign.expires_at ? campaign.expires_at.slice(0, 16) : "",
                active: campaign.active,
                leftItems: (leftItems ?? []).map((item) => ({
                    id: item.id,
                    product_slug: item.product_slug ?? "",
                    name: item.name,
                    image_url: item.image_url ?? "",
                    original_price: String(item.original_price),
                    discount_price: String(item.discount_price),
                    installment_count: String(item.installment_count),
                    installment_price: item.installment_price ? String(item.installment_price) : "",
                })),
                kit: kit
                    ? {
                        title: kit.title,
                        original_price: kit.original_price ? String(kit.original_price) : "",
                        image_url: kit.image_url ?? "",
                        items: (kit.items as string[]).join("\n"),
                        cta_text: kit.cta_text,
                        cta_href: kit.cta_href,
                    }
                    : undefined,
            });
        }
        load();
    }, [params.id]);

    if (!initial) return <p className="text-gray-400 text-sm p-8">Carregando...</p>;

    return (
        <div>
            <AdminHeader title="Editar Campanha" range={30} onRangeChange={() => { }} />
            <div className="p-6 lg:p-8">
                <CampaignForm initial={initial} />
            </div>
        </div>
    );
}