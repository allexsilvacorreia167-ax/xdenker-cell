"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { X, Upload } from "lucide-react";

export type ProductFormData = {
    id?: string;
    name: string;
    slug: string;
    barcode: string;
    description: string;
    price: string;
    compare_at_price: string;
    category: string;
    images: string[];
    stock: string;
    storageOptions: string;
    colorOptions: string;
    specCamera: string;
    specBattery: string;
    specProcessor: string;
    specConnectivity: string;
    featured: boolean;
    active: boolean;
};

const categories = [
    { value: "iphone", label: "iPhone" },
    { value: "android", label: "Android" },
    { value: "macbook", label: "MacBook" },
    { value: "gaming", label: "PC Gaming" },
    { value: "custom", label: "Custom" },
    { value: "audio", label: "Áudio" },
    { value: "capas", label: "Capas e Películas" },
];

export default function ProductForm({ initial }: { initial?: Partial<ProductFormData> }) {
    const router = useRouter();
    const [form, setForm] = useState<ProductFormData>({
        name: initial?.name ?? "",
        slug: initial?.slug ?? "",
        barcode: initial?.barcode ?? "",
        description: initial?.description ?? "",
        price: initial?.price ?? "",
        compare_at_price: initial?.compare_at_price ?? "",
        category: initial?.category ?? "iphone",
        images: initial?.images ?? [],
        stock: initial?.stock ?? "0",
        storageOptions: initial?.storageOptions ?? "",
        colorOptions: initial?.colorOptions ?? "",
        specCamera: initial?.specCamera ?? "",
        specBattery: initial?.specBattery ?? "",
        specProcessor: initial?.specProcessor ?? "",
        specConnectivity: initial?.specConnectivity ?? "",
        featured: initial?.featured ?? false,
        active: initial?.active ?? true,
        id: initial?.id,
    });
    const [uploading, setUploading] = useState(false);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState<string | null>(null);

    function update<K extends keyof ProductFormData>(key: K, value: ProductFormData[K]) {
        setForm((f) => ({ ...f, [key]: value }));
    }

    async function handleImageUpload(e: React.ChangeEvent<HTMLInputElement>) {
        const files = e.target.files;
        if (!files || files.length === 0) return;
        setUploading(true);
        setError(null);

        for (const file of Array.from(files)) {
            const path = `${Date.now()}-${file.name.replace(/\s+/g, "-")}`;
            const { error: uploadError } = await supabase.storage.from("products").upload(path, file);

            if (uploadError) {
                setError("Falha ao enviar imagem: " + uploadError.message);
                continue;
            }

            const { data } = supabase.storage.from("products").getPublicUrl(path);
            update("images", [...form.images, data.publicUrl]);
        }

        setUploading(false);
        e.target.value = "";
    }

    function removeImage(url: string) {
        update("images", form.images.filter((i) => i !== url));
    }

    async function handleSubmit(e: React.FormEvent) {
        e.preventDefault();
        setSaving(true);
        setError(null);

        const payload = {
            name: form.name,
            slug: form.slug,
            barcode: form.barcode.trim() || null,
            description: form.description,
            price: parseFloat(form.price),
            compare_at_price: form.compare_at_price ? parseFloat(form.compare_at_price) : null,
            category: form.category,
            images: form.images,
            stock: parseInt(form.stock, 10) || 0,
            variations: {
                storage: form.storageOptions.split(",").map((s) => s.trim()).filter(Boolean),
                colors: form.colorOptions.split(",").map((s) => s.trim()).filter(Boolean),
            },
            specs: {
                camera: form.specCamera,
                battery: form.specBattery,
                processor: form.specProcessor,
                connectivity: form.specConnectivity,
            },
            featured: form.featured,
            active: form.active,
        };

        const query = form.id
            ? supabase.from("products").update(payload).eq("id", form.id)
            : supabase.from("products").insert(payload);

        const { error: saveError } = await query;

        setSaving(false);

        if (saveError) {
            setError("Não foi possível salvar: " + saveError.message);
            return;
        }

        router.push("/admin/produtos");
        router.refresh();
    }

    return (
        <form onSubmit={handleSubmit} className="space-y-5 max-w-3xl">
            <div className="glass rounded-2xl p-5 grid sm:grid-cols-2 gap-4">
                <div className="sm:col-span-2">
                    <label className="text-xs text-gray-400 mb-1 block">Nome</label>
                    <input
                        required
                        value={form.name}
                        onChange={(e) => update("name", e.target.value)}
                        className="w-full glass rounded-xl px-4 py-2.5 text-sm outline-none focus:border-blue-400/50"
                    />
                </div>
                <div>
                    <label className="text-xs text-gray-400 mb-1 block">Slug (URL)</label>
                    <input
                        required
                        value={form.slug}
                        onChange={(e) => update("slug", e.target.value)}
                        className="w-full glass rounded-xl px-4 py-2.5 text-sm outline-none focus:border-blue-400/50"
                        placeholder="iphone-15-pro-max"
                    />
                </div>
                <div>
                    <label className="text-xs text-gray-400 mb-1 block">Código de Barras (EAN/SKU)</label>
                    <input
                        value={form.barcode}
                        onChange={(e) => update("barcode", e.target.value)}
                        className="w-full glass rounded-xl px-4 py-2.5 text-sm outline-none focus:border-blue-400/50 font-mono"
                        placeholder="7891234567890"
                    />
                </div>
                <div>
                    <label className="text-xs text-gray-400 mb-1 block">Categoria</label>
                    <select
                        value={form.category}
                        onChange={(e) => update("category", e.target.value)}
                        className="w-full glass rounded-xl px-4 py-2.5 text-sm outline-none focus:border-blue-400/50 bg-transparent"
                    >
                        {categories.map((c) => (
                            <option key={c.value} value={c.value} className="bg-slate-900">
                                {c.label}
                            </option>
                        ))}
                    </select>
                </div>
                <div className="sm:col-span-2">
                    <label className="text-xs text-gray-400 mb-1 block">Descrição</label>
                    <textarea
                        value={form.description}
                        onChange={(e) => update("description", e.target.value)}
                        rows={4}
                        className="w-full glass rounded-xl px-4 py-2.5 text-sm outline-none focus:border-blue-400/50"
                    />
                </div>
                <div>
                    <label className="text-xs text-gray-400 mb-1 block">Preço (R$)</label>
                    <input
                        type="number"
                        step="0.01"
                        required
                        value={form.price}
                        onChange={(e) => update("price", e.target.value)}
                        className="w-full glass rounded-xl px-4 py-2.5 text-sm outline-none focus:border-blue-400/50"
                    />
                </div>
                <div>
                    <label className="text-xs text-gray-400 mb-1 block">Preço &quot;de&quot; (riscado, opcional)</label>
                    <input
                        type="number"
                        step="0.01"
                        value={form.compare_at_price}
                        onChange={(e) => update("compare_at_price", e.target.value)}
                        className="w-full glass rounded-xl px-4 py-2.5 text-sm outline-none focus:border-blue-400/50"
                    />
                </div>
                <div>
                    <label className="text-xs text-gray-400 mb-1 block">Estoque</label>
                    <input
                        type="number"
                        required
                        value={form.stock}
                        onChange={(e) => update("stock", e.target.value)}
                        className="w-full glass rounded-xl px-4 py-2.5 text-sm outline-none focus:border-blue-400/50"
                    />
                </div>
                <div className="flex items-center gap-4 pt-6">
                    <label className="flex items-center gap-2 text-sm">
                        <input
                            type="checkbox"
                            checked={form.featured}
                            onChange={(e) => update("featured", e.target.checked)}
                            className="accent-blue-500"
                        />
                        Destaque na home
                    </label>
                    <label className="flex items-center gap-2 text-sm">
                        <input
                            type="checkbox"
                            checked={form.active}
                            onChange={(e) => update("active", e.target.checked)}
                            className="accent-blue-500"
                        />
                        Ativo (visível na loja)
                    </label>
                </div>
            </div>

            <div className="glass rounded-2xl p-5">
                <h2 className="text-sm font-semibold mb-3">Variações</h2>
                <div className="grid sm:grid-cols-2 gap-4">
                    <div>
                        <label className="text-xs text-gray-400 mb-1 block">Armazenamento (separado por vírgula)</label>
                        <input
                            value={form.storageOptions}
                            onChange={(e) => update("storageOptions", e.target.value)}
                            placeholder="256GB, 512GB, 1TB"
                            className="w-full glass rounded-xl px-4 py-2.5 text-sm outline-none focus:border-blue-400/50"
                        />
                    </div>
                    <div>
                        <label className="text-xs text-gray-400 mb-1 block">Cores (separado por vírgula)</label>
                        <input
                            value={form.colorOptions}
                            onChange={(e) => update("colorOptions", e.target.value)}
                            placeholder="Titânio Natural, Preto"
                            className="w-full glass rounded-xl px-4 py-2.5 text-sm outline-none focus:border-blue-400/50"
                        />
                    </div>
                </div>
            </div>

            <div className="glass rounded-2xl p-5">
                <h2 className="text-sm font-semibold mb-3">Especificações</h2>
                <div className="grid sm:grid-cols-2 gap-4">
                    {(
                        [
                            { key: "specCamera", label: "Câmera" },
                            { key: "specBattery", label: "Bateria" },
                            { key: "specProcessor", label: "Processador" },
                            { key: "specConnectivity", label: "Conectividade" },
                        ] as { key: keyof ProductFormData; label: string }[]
                    ).map((f) => (
                        <div key={f.key}>
                            <label className="text-xs text-gray-400 mb-1 block">{f.label}</label>
                            <textarea
                                value={form[f.key] as string}
                                onChange={(e) => update(f.key, e.target.value as never)}
                                rows={2}
                                className="w-full glass rounded-xl px-4 py-2.5 text-sm outline-none focus:border-blue-400/50"
                            />
                        </div>
                    ))}
                </div>
            </div>

            <div className="glass rounded-2xl p-5">
                <h2 className="text-sm font-semibold mb-3">Fotos do Produto</h2>
                <div className="flex flex-wrap gap-3 mb-3">
                    {form.images.map((url) => (
                        <div key={url} className="relative w-20 h-20 rounded-xl overflow-hidden border border-white/10">
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img src={url} alt="" className="w-full h-full object-cover" />
                            <button
                                type="button"
                                onClick={() => removeImage(url)}
                                className="absolute top-0.5 right-0.5 w-5 h-5 rounded-full bg-black/60 flex items-center justify-center"
                            >
                                <X className="w-3 h-3" />
                            </button>
                        </div>
                    ))}
                    <label className="w-20 h-20 rounded-xl border border-dashed border-white/20 flex items-center justify-center cursor-pointer hover:border-blue-400/50 transition">
                        <Upload className="w-5 h-5 text-gray-400" />
                        <input type="file" accept="image/*" multiple className="hidden" onChange={handleImageUpload} />
                    </label>
                </div>
                {uploading && <p className="text-xs text-gray-400">Enviando imagem...</p>}
            </div>

            {error && <p className="text-sm text-red-400">{error}</p>}

            <button
                type="submit"
                disabled={saving || uploading}
                className="glow-btn px-8 py-3 rounded-full text-sm font-semibold disabled:opacity-50"
            >
                {saving ? "Salvando..." : form.id ? "Salvar Alterações" : "Criar Produto"}
            </button>
        </form>
    );
}