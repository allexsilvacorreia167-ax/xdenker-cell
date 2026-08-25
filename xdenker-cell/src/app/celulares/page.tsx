import Header from "@/components/layout/Header";
import BottomNav from "@/components/layout/BottomNav";
import ProductCard from "@/components/ui/ProductCard";
import { getProductsByCategories, CELULARES_CATEGORIES } from "@/lib/queries";
import Link from "next/link";

const tabs: { label: string; value?: string }[] = [
  { label: "Todos" },
  { label: "iPhone", value: "iphone" },
  { label: "Android", value: "android" },
];

export default async function CelularesPage({
  searchParams,
}: {
  searchParams: Promise<{ cat?: string }>;
}) {
  const { cat } = await searchParams;
  const products = await getProductsByCategories(CELULARES_CATEGORIES);
  const filtered = cat ? products.filter((p) => p.category === cat) : products;

  return (
    <>
      <Header />
      <main className="px-4 lg:px-8 py-6 pb-28 lg:pb-12 max-w-7xl mx-auto">
        <h1 className="text-2xl font-bold mb-4">Celulares</h1>

        <div className="flex gap-2 mb-6 overflow-x-auto scrollbar-hide">
          {tabs.map((tab) => (
            <Link
              key={tab.label}
              href={tab.value ? `/celulares?cat=${tab.value}` : "/celulares"}
              className={`px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition ${cat === tab.value
                ? "bg-blue-500/20 text-blue-300 border border-blue-400/40"
                : "glass text-gray-300"
                }`}
            >
              {tab.label}
            </Link>
          ))}
        </div>

        {filtered.length === 0 ? (
          <div className="glass rounded-2xl p-10 text-center text-gray-400">
            Nenhum produto encontrado nessa categoria no momento.
          </div>
        ) : (
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {filtered.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        )}
      </main>
      <BottomNav />
    </>
  );
}