import Header from "@/components/layout/Header";
import BottomNav from "@/components/layout/BottomNav";
import { getProductBySlug, getProductsByCategories } from "@/lib/queries";
import { notFound } from "next/navigation";
import ProductDetailClient from "@/components/product/ProductDetailClient";
import ProductCard from "@/components/ui/ProductCard";

export default async function ProdutoPage({
    params,
    searchParams,
}: {
    params: Promise<{ slug: string }>;
    searchParams: Promise<{ promoPrice?: string; promoOriginal?: string; promoLabel?: string }>;
}) {
    const { slug } = await params;
    const { promoPrice, promoOriginal, promoLabel } = await searchParams;
    const product = await getProductBySlug(slug);

    if (!product) notFound();

    const related = (await getProductsByCategories([product.category]))
        .filter((p) => p.id !== product.id)
        .slice(0, 4);

    const promo = promoPrice
        ? {
            price: parseFloat(promoPrice),
            original: promoOriginal ? parseFloat(promoOriginal) : product.price,
            label: promoLabel ?? "Oferta Especial",
        }
        : null;

    return (
        <>
            <Header />
            <main className="px-4 lg:px-8 py-6 pb-28 lg:pb-12 max-w-7xl mx-auto">
                <ProductDetailClient product={product} promo={promo} />

                {related.length > 0 && (
                    <div className="mt-10">
                        <h2 className="text-lg font-semibold mb-4">Produtos Similares</h2>
                        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                            {related.map((p) => (
                                <ProductCard key={p.id} product={p} />
                            ))}
                        </div>
                    </div>
                )}
            </main>
            <BottomNav />
        </>
    );
}