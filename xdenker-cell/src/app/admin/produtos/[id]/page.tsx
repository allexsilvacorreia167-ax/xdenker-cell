"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { supabase, Product } from "@/lib/supabase";
import ProductForm, { ProductFormData } from "@/components/admin/ProductForm";

export default function EditarProdutoPage() {
    const params = useParams<{ id: string }>();
    const [initial, setInitial] = useState<Partial<ProductFormData> | null>(null);

    useEffect(() => {
        async function load() {
            const { data } = await supabase.from("products").select("*").eq("id", params.id).single();
            if (!data) return;
            const product = data as Product & { specs?: Record<string, string> };
            setInitial({
                id: product.id,
                name: product.name,
                slug: product.slug,
                description: product.description ?? "",
                price: String(product.price),
                compare_at_price: product.compare_at_price ? String(product.compare_at_price) : "",
                category: product.category,
                images: product.images ?? [],
                stock: String(product.stock),
                storageOptions: (product.variations?.storage ?? []).join(", "),
                colorOptions: (product.variations?.colors ?? []).join(", "),
                specCamera: product.specs?.camera ?? "",
                specBattery: product.specs?.battery ?? "",
                specProcessor: product.specs?.processor ?? "",
                specConnectivity: product.specs?.connectivity ?? "",
                featured: product.featured,
                active: product.active,
            });
        }
        load();
    }, [params.id]);

    if (!initial) return <p className="text-gray-400 text-sm">Carregando...</p>;

    return (
        <div>
            <h1 className="text-2xl font-bold mb-6 text-white">Editar Produto</h1>
            <ProductForm initial={initial} />
        </div>
    );
}