import Header from "@/components/layout/Header";
import BottomNav from "@/components/layout/BottomNav";
import HeroCarousel from "@/components/home/HeroCarousel";
import Link from "next/link";
import { getFeaturedProducts, getLatestProducts } from "@/lib/queries";

const categoriesDesktop = [
  { name: "iPhones", href: "/celulares?cat=iphone", image: "/home/categories/iphones.jpg" },
  { name: "Androids", href: "/celulares?cat=android", image: "/home/categories/androids.jpg" },
  { name: "MacBooks", href: "/computadores?cat=macbook", image: "/home/categories/macbooks.jpg" },
  { name: "PC Gaming", href: "/computadores?cat=gaming", image: "/home/categories/pc-gaming.jpg" },
  { name: "PC Gaming", href: "/computadores?cat=gaming", image: "/home/categories/pc-gaming-2.jpg" },
  { name: "Acessórios Áudio", href: "/acessorios?cat=audio", image: "/home/categories/acessorios-audio.jpg" },
  { name: "Androids", href: "/celulares?cat=android", image: "/home/categories/androids-2.jpg" },
  { name: "Capa e Películas", href: "/acessorios?cat=capas", image: "/home/categories/capas-peliculas.jpg" },
];

const categoriesMobile = [
  { name: "Smartphones", href: "/celulares", image: "/home/categories/iphones.jpg" },
  { name: "Computadores", href: "/computadores", image: "/home/categories/macbooks.jpg" },
  { name: "Acessórios", href: "/acessorios", image: "/home/categories/acessorios-audio.jpg" },
];

function formatPrice(value: number) {
  return value.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

export default async function HomePage() {
  const [featured, novidades] = await Promise.all([getFeaturedProducts(3), getLatestProducts(3)]);

  return (
    <>
      <Header />

      {/* ========== HERO CAROUSEL (desktop + mobile) ========== */}
      <section className="px-4 lg:px-8 pt-6 pb-8 lg:pb-12">
        <div className="max-w-7xl mx-auto">
          <HeroCarousel />
        </div>
      </section>

      {/* ========== CATEGORIES DESKTOP ========== */}
      <section className="hidden lg:block px-8 pb-16">
        <div className="max-w-7xl mx-auto grid grid-cols-4 gap-5">
          {categoriesDesktop.map((cat, i) => (
            <Link key={i} href={cat.href} className="category-card rounded-2xl p-5 flex flex-col items-center text-center group">
              <div className="text-sm font-semibold mb-1">{cat.name}</div>
              <div className="text-xs text-cyan-400/80 mb-4">Ver Mais ›</div>
              <div className="w-20 h-20 rounded-xl overflow-hidden shadow-lg">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={cat.image} alt={cat.name} className="w-full h-full object-cover" />
              </div>
            </Link>
          ))}
        </div>
      </section>

      {/* ========== MOBILE CONTENT ========== */}
      <main className="lg:hidden px-4 pb-32">
        {featured.length > 0 && (
          <div className="flex gap-3 overflow-x-auto pb-4 -mx-1 px-1 scrollbar-hide">
            {featured.map((item) => (
              <div key={item.id} className="glass-strong rounded-2xl p-4 min-w-[140px] flex-shrink-0 text-center">
                <div className="w-20 h-28 mx-auto mb-3 rounded-xl bg-slate-800 overflow-hidden border border-white/10">
                  {item.images?.[0] && (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={item.images[0]} alt={item.name} className="w-full h-full object-cover" />
                  )}
                </div>
                <div className="text-xs font-semibold mb-1 truncate">{item.name}</div>
                <span className="featured-badge text-[10px] px-2 py-0.5 rounded-full">Featured</span>
                <Link
                  href={`/produto/${item.slug}`}
                  className="mt-2 text-[11px] text-cyan-400 border border-cyan-500/30 rounded-full px-3 py-1 w-full inline-block"
                >
                  Ver Mais
                </Link>
              </div>
            ))}
          </div>
        )}

        <h2 className="text-lg font-semibold mt-6 mb-4">Categorias</h2>
        <div className="space-y-3">
          {categoriesMobile.map((cat) => (
            <Link key={cat.href} href={cat.href} className="glass rounded-2xl p-3 flex items-center gap-4">
              <div className="w-14 h-14 rounded-xl overflow-hidden flex-shrink-0">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={cat.image} alt={cat.name} className="w-full h-full object-cover" />
              </div>
              <div className="flex-1 font-medium text-sm">{cat.name}</div>
            </Link>
          ))}
        </div>

        {novidades.length > 0 && (
          <>
            <h2 className="text-lg font-semibold mt-8 mb-4">Novidades</h2>
            <div className="space-y-3">
              {novidades.map((item) => (
                <div key={item.id} className="glass rounded-2xl p-3 flex items-center gap-3">
                  <div className="w-14 h-14 rounded-xl bg-slate-800 overflow-hidden border border-white/10 flex-shrink-0">
                    {item.images?.[0] && (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={item.images[0]} alt={item.name} className="w-full h-full object-cover" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-medium truncate">{item.name}</div>
                    <div className="text-cyan-400 font-semibold text-sm">{formatPrice(item.price)}</div>
                  </div>
                  <Link
                    href={`/produto/${item.slug}`}
                    className="glow-btn text-xs px-4 py-2 rounded-full font-medium flex-shrink-0"
                  >
                    Comprar
                  </Link>
                </div>
              ))}
            </div>
          </>
        )}
      </main>

      <BottomNav />
    </>
  );
}