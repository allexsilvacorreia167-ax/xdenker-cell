"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { Upload } from "lucide-react";

type LeftItemForm = {
    id?: string;
    product_slug: string;
    name: string;
    image_url: string;
    original_price: string;
    discount_price: string;
    installment_count: string;
    installment_price: string;
};

const emptyLeftItem = (): LeftItemForm => ({
    product_slug: "",
    name: "",
    image_url: "",
    original_price: "",
    discount_price: "",
    installment_count: "12",
    installment_price: "",
});

export type CampaignFormData = {
    id?: string;
    slug: string;
    brand_label: string;
    title_line1: string;
    title_line2: string;
    perk_1: string;
    perk_2: string;
    perk_3: string;
    expires_at: string;
    active: boolean;
    leftItems: LeftItemForm[];
    kit: {
        title: string;
        original_price: string;
        image_url: string;
        items: string;
        cta_text: string;
        cta_href: string;
    };
};

export default function CampaignForm({ initial }: { initial?: Partial<CampaignFormData> }) {
    const router = useRouter();
    const [form, setForm] = useState<CampaignFormData>({
        id: initial?.id,
        slug: initial?.slug ?? "",
        brand_label: initial?.brand_label ?? "",
        title_line1: initial?.title_line1 ?? "",
        title_line2: initial?.title_line2 ?? "",
        perk_1: initial?.perk_1 ?? "",
        perk_2: initial?.perk_2 ?? "",
        perk_3: initial?.perk_3 ?? "",
        expires_at: initial?.expires_at ?? "",
        active: initial?.active ?? true,
        leftItems: initial?.leftItems ?? [emptyLeftItem(), emptyLeftItem(), emptyLeftItem()],
        kit: initial?.kit ?? {
            title: "",
            original_price: "",
            image_url: "",
            items: "",
            cta_text: "Aproveitar Oferta",
            cta_href: "/ofertas",
        },
    });
    const [saving, setSaving] = useState(false);
    const [uploading, setUploading] = useState<string | null>(null);
    const [error, setError] = useState<string | null>(null);

    function updateField<K extends keyof CampaignFormData>(key: K, value: CampaignFormData[K]) {
        setForm((f) => ({ ...f, [key]: value }));
    }

    function updateLeftItem(index: number, field: keyof LeftItemForm, value: string) {
        setForm((f) => ({
            ...f,
            leftItems: f.leftItems.map((item, i) => (i === index ? { ...item, [field]: value } : item)),
        }));
    }

    function updateKit(field: keyof CampaignFormData["kit"], value: string) {
        setForm((f) => ({ ...f, kit: { ...f.kit, [field]: value } }));
    }

    async function handleUpload(e: React.ChangeEvent<HTMLInputElement>, target: "kit" | number) {
        const file = e.target.files?.[0];
        if (!file) return;
        setUploading(String(target));
        const path = `promo-${Date.now()}-${file.name.replace(/\s+/g, "-")}`;
        const { error: uploadError } = await supabase.storage.from("products").upload(path, file);
        if (uploadError) {
            setError("Falha ao enviar imagem: " + uploadError.message);
            setUploading(null);
            return;
        }
        const { data } = supabase.storage.from("products").getPublicUrl(path);
        if (target === "kit") {
            updateKit("image_url", data.publicUrl);
        } else {
            updateLeftItem(target, "image_url", data.publicUrl);
        }
        setUploading(null);
        e.target.value = "";
    }

    async function handleSubmit(e: React.FormEvent) {
        e.preventDefault();
        setSaving(true);
        setError(null);

        const campaignPayload = {
            slug: form.slug,
            brand_label: form.brand_label,
            title_line1: form.title_line1,
            title_line2: form.title_line2,
            perk_1: form.perk_1,
            perk_2: form.perk_2,
            perk_3: form.perk_3,
            expires_at: form.expires_at ? new Date(form.expires_at).toISOString() : null,
            active: form.active,
        };

        let campaignId = form.id;

        if (campaignId) {
            const { error: updateError } = await supabase.from("promo_campaigns").update(campaignPayload).eq("id", campaignId);
            if (updateError) {
                setError("Erro ao salvar campanha: " + updateError.message);
                setSaving(false);
                return;
            }
            await supabase.from("promo_left_items").delete().eq("campaign_id", campaignId);
        } else {
            const { data: created, error: insertError } = await supabase
                .from("promo_campaigns")
                .insert(campaignPayload)
                .select("id")
                .single();
            if (insertError || !created) {
                setError("Erro ao criar campanha: " + insertError?.message);
                setSaving(false);
                return;
            }
            campaignId = created.id;
        }

        const leftItemsPayload = form.leftItems
            .filter((item) => item.name.trim())
            .map((item, i) => ({
                campaign_id: campaignId,
                product_slug: item.product_slug || null,
                name: item.name,
                image_url: item.image_url || null,
                original_price: parseFloat(item.original_price) || 0,
                discount_price: parseFloat(item.discount_price) || 0,
                installment_count: parseInt(item.installment_count, 10) || 12,
                installment_price: item.installment_price ? parseFloat(item.installment_price) : null,
                sort_order: i,
            }));

        if (leftItemsPayload.length > 0) {
            await supabase.from("promo_left_items").insert(leftItemsPayload);
        }

        const kitPayload = {
            campaign_id: campaignId,
            title: form.kit.title,
            original_price: form.kit.original_price ? parseFloat(form.kit.original_price) : null,
            image_url: form.kit.image_url || null,
            items: form.kit.items.split("\n").map((s) => s.trim()).filter(Boolean),
            cta_text: form.kit.cta_text,
            cta_href: form.kit.cta_href,
        };

        if (form.kit.title.trim()) {
            await supabase.from("promo_kits").upsert(kitPayload, { onConflict: "campaign_id" });
        }

        setSaving(false);
        router.push("/admin/ofertas/campanhas");
        router.refresh();
    }

    return (
        <form onSubmit={handleSubmit} className="space-y-5 max-w-4xl">
            <div className="glass rounded-2xl p-5 grid sm:grid-cols-2 gap-4">
                <div>
                    <label className="text-xs text-gray-400 mb-1 block">Slug (URL) — ex: ofertas-mac</label>
                    <input
                        required
                        value={form.slug}
                        onChange={(e) => updateField("slug", e.target.value)}
                        className="w-full glass rounded-xl px-4 py-2.5 text-sm outline-none focus:border-blue-400/50"
                    />
                </div>
                <div>
                    <label className="text-xs text-gray-400 mb-1 block">Rótulo da marca (ex: MacBook Fortaleza)</label>
                    <input
                        value={form.brand_label}
                        onChange={(e) => updateField("brand_label", e.target.value)}
                        className="w-full glass rounded-xl px-4 py-2.5 text-sm outline-none focus:border-blue-400/50"
                    />
                </div>
                <div>
                    <label className="text-xs text-gray-400 mb-1 block">Título linha 1 (ex: Alerta de)</label>
                    <input
                        required
                        value={form.title_line1}
                        onChange={(e) => updateField("title_line1", e.target.value)}
                        className="w-full glass rounded-xl px-4 py-2.5 text-sm outline-none focus:border-blue-400/50"
                    />
                </div>
                <div>
                    <label className="text-xs text-gray-400 mb-1 block">Título linha 2 destacada (ex: Ofertas da MAC)</label>
                    <input
                        required
                        value={form.title_line2}
                        onChange={(e) => updateField("title_line2", e.target.value)}
                        className="w-full glass rounded-xl px-4 py-2.5 text-sm outline-none focus:border-blue-400/50"
                    />
                </div>
                <div>
                    <label className="text-xs text-gray-400 mb-1 block">Selo 1 (ex: Em até 18x sem juros)</label>
                    <input
                        value={form.perk_1}
                        onChange={(e) => updateField("perk_1", e.target.value)}
                        className="w-full glass rounded-xl px-4 py-2.5 text-sm outline-none focus:border-blue-400/50"
                    />
                </div>
                <div>
                    <label className="text-xs text-gray-400 mb-1 block">Selo 2 (ex: Frete Grátis p/ toda Fortaleza)</label>
                    <input
                        value={form.perk_2}
                        onChange={(e) => updateField("perk_2", e.target.value)}
                        className="w-full glass rounded-xl px-4 py-2.5 text-sm outline-none focus:border-blue-400/50"
                    />
                </div>
                <div>
                    <label className="text-xs text-gray-400 mb-1 block">Selo 3 (ex: Garantia de 1 ano)</label>
                    <input
                        value={form.perk_3}
                        onChange={(e) => updateField("perk_3", e.target.value)}
                        className="w-full glass rounded-xl px-4 py-2.5 text-sm outline-none focus:border-blue-400/50"
                    />
                </div>
                <div>
                    <label className="text-xs text-gray-400 mb-1 block">Data/hora de expiração</label>
                    <input
                        type="datetime-local"
                        value={form.expires_at}
                        onChange={(e) => updateField("expires_at", e.target.value)}
                        className="w-full glass rounded-xl px-4 py-2.5 text-sm outline-none focus:border-blue-400/50"
                    />
                </div>
                <label className="flex items-center gap-2 text-sm pt-6">
                    <input
                        type="checkbox"
                        checked={form.active}
                        onChange={(e) => updateField("active", e.target.checked)}
                        className="accent-blue-500"
                    />
                    Campanha ativa (visível na loja)
                </label>
            </div>

            <div className="glass rounded-2xl p-5">
                <h2 className="text-sm font-semibold mb-4">
                    Produtos do Lado Esquerdo (3, empilhados)
                </h2>
                <div className="space-y-4">
                    {form.leftItems.map((item, i) => (
                        <div key={i} className="border border-white/10 rounded-xl p-4 grid sm:grid-cols-2 gap-3">
                            <div className="sm:col-span-2 flex items-center gap-3">
                                <div className="w-14 h-14 rounded-lg bg-slate-800 overflow-hidden flex-shrink-0 border border-white/10">
                                    {item.image_url && (
                                        // eslint-disable-next-line @next/next/no-img-element
                                        <img src={item.image_url} alt="" className="w-full h-full object-cover" />
                                    )}
                                </div>
                                <label className="glass px-3 py-2 rounded-full text-xs cursor-pointer flex items-center gap-1.5">
                                    <Upload className="w-3.5 h-3.5" />
                                    {uploading === String(i) ? "Enviando..." : "Enviar foto"}
                                    <input type="file" accept="image/*" className="hidden" onChange={(e) => handleUpload(e, i)} />
                                </label>
                            </div>
                            <div>
                                <label className="text-xs text-gray-400 mb-1 block">Nome do produto</label>
                                <input
                                    value={item.name}
                                    onChange={(e) => updateLeftItem(i, "name", e.target.value)}
                                    className="w-full glass rounded-xl px-4 py-2.5 text-sm outline-none focus:border-blue-400/50"
                                />
                            </div>
                            <div>
                                <label className="text-xs text-gray-400 mb-1 block">Slug do produto (opcional, pra linkar)</label>
                                <input
                                    value={item.product_slug}
                                    onChange={(e) => updateLeftItem(i, "product_slug", e.target.value)}
                                    className="w-full glass rounded-xl px-4 py-2.5 text-sm outline-none focus:border-blue-400/50"
                                />
                            </div>
                            <div>
                                <label className="text-xs text-gray-400 mb-1 block">Preço original (R$)</label>
                                <input
                                    type="number"
                                    step="0.01"
                                    value={item.original_price}
                                    onChange={(e) => updateLeftItem(i, "original_price", e.target.value)}
                                    className="w-full glass rounded-xl px-4 py-2.5 text-sm outline-none focus:border-blue-400/50"
                                />
                            </div>
                            <div>
                                <label className="text-xs text-gray-400 mb-1 block">Preço com desconto (R$)</label>
                                <input
                                    type="number"
                                    step="0.01"
                                    value={item.discount_price}
                                    onChange={(e) => updateLeftItem(i, "discount_price", e.target.value)}
                                    className="w-full glass rounded-xl px-4 py-2.5 text-sm outline-none focus:border-blue-400/50"
                                />
                            </div>
                            <div>
                                <label className="text-xs text-gray-400 mb-1 block">Número de parcelas</label>
                                <input
                                    type="number"
                                    value={item.installment_count}
                                    onChange={(e) => updateLeftItem(i, "installment_count", e.target.value)}
                                    className="w-full glass rounded-xl px-4 py-2.5 text-sm outline-none focus:border-blue-400/50"
                                />
                            </div>
                            <div>
                                <label className="text-xs text-gray-400 mb-1 block">Valor da parcela (R$)</label>
                                <input
                                    type="number"
                                    step="0.01"
                                    value={item.installment_price}
                                    onChange={(e) => updateLeftItem(i, "installment_price", e.target.value)}
                                    className="w-full glass rounded-xl px-4 py-2.5 text-sm outline-none focus:border-blue-400/50"
                                />
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            <div className="glass rounded-2xl p-5">
                <h2 className="text-sm font-semibold mb-4">Kit em Destaque (Lado Direito)</h2>
                <div className="grid sm:grid-cols-2 gap-4">
                    <div className="sm:col-span-2 flex items-center gap-3">
                        <div className="w-20 h-20 rounded-xl bg-slate-800 overflow-hidden flex-shrink-0 border border-white/10">
                            {form.kit.image_url && (
                                // eslint-disable-next-line @next/next/no-img-element
                                <img src={form.kit.image_url} alt="" className="w-full h-full object-cover" />
                            )}
                        </div>
                        <label className="glass px-3 py-2 rounded-full text-xs cursor-pointer flex items-center gap-1.5">
                            <Upload className="w-3.5 h-3.5" />
                            {uploading === "kit" ? "Enviando..." : "Enviar foto do kit"}
                            <input type="file" accept="image/*" className="hidden" onChange={(e) => handleUpload(e, "kit")} />
                        </label>
                    </div>
                    <div className="sm:col-span-2">
                        <label className="text-xs text-gray-400 mb-1 block">Título do kit</label>
                        <input
                            value={form.kit.title}
                            onChange={(e) => updateKit("title", e.target.value)}
                            className="w-full glass rounded-xl px-4 py-2.5 text-sm outline-none focus:border-blue-400/50"
                        />
                    </div>
                    <div>
                        <label className="text-xs text-gray-400 mb-1 block">Preço &quot;de&quot; (riscado, opcional)</label>
                        <input
                            type="number"
                            step="0.01"
                            value={form.kit.original_price}
                            onChange={(e) => updateKit("original_price", e.target.value)}
                            className="w-full glass rounded-xl px-4 py-2.5 text-sm outline-none focus:border-blue-400/50"
                        />
                    </div>
                    <div>
                        <label className="text-xs text-gray-400 mb-1 block">Texto do botão (CTA)</label>
                        <input
                            value={form.kit.cta_text}
                            onChange={(e) => updateKit("cta_text", e.target.value)}
                            className="w-full glass rounded-xl px-4 py-2.5 text-sm outline-none focus:border-blue-400/50"
                        />
                    </div>
                    <div className="sm:col-span-2">
                        <label className="text-xs text-gray-400 mb-1 block">Link do botão</label>
                        <input
                            value={form.kit.cta_href}
                            onChange={(e) => updateKit("cta_href", e.target.value)}
                            className="w-full glass rounded-xl px-4 py-2.5 text-sm outline-none focus:border-blue-400/50"
                        />
                    </div>
                    <div className="sm:col-span-2">
                        <label className="text-xs text-gray-400 mb-1 block">Itens do kit (um por linha)</label>
                        <textarea
                            value={form.kit.items}
                            onChange={(e) => updateKit("items", e.target.value)}
                            rows={5}
                            placeholder={"1x Case de Couro Genuíno\n1x Hub 2in1\n1x Kit Limpeza\n1x Adaptador de Tomada"}
                            className="w-full glass rounded-xl px-4 py-2.5 text-sm outline-none focus:border-blue-400/50"
                        />
                    </div>
                </div>
            </div>

            {error && <p className="text-sm text-red-400">{error}</p>}

            <button
                type="submit"
                disabled={saving}
                className="glow-btn px-8 py-3 rounded-full text-sm font-semibold disabled:opacity-50"
            >
                {saving ? "Salvando..." : form.id ? "Salvar Campanha" : "Criar Campanha"}
            </button>
        </form>
    );
}