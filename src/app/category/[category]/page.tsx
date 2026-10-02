import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import { getProductsByCategory } from "@/lib/catalog";
import { categories, categoryLabel, productImages, brandName, type Category } from "@/lib/products";
import ProductArt from "@/components/ProductArt";
import ProductCard from "@/components/ProductCard";
import PromoBanner from "@/components/PromoBanner";

export function generateStaticParams() {
  return categories.map((c) => ({ category: c }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ category: string }>;
}): Promise<Metadata> {
  const { category } = await params;
  if (!categories.includes(category as Category)) return {};
  return {
    title: categoryLabel[category as Category],
    description: `Shop ${categoryLabel[category as Category].toLowerCase()} from ${brandName.toLowerCase()}.`,
  };
}

export default async function CategoryPage({
  params,
}: {
  params: Promise<{ category: string }>;
}) {
  const { category } = await params;
  if (!categories.includes(category as Category)) notFound();

  const products = await getProductsByCategory(category as Category);
  const [hero, ...rest] = products;
  const sub = rest.slice(0, 2);

  return (
    <>
      {/* ---- Category header band ---- */}
      <section className="bg-ink py-16 text-center text-white">
        <h1 className="container-page text-2xl md:text-3xl">
          {categoryLabel[category as Category]}
        </h1>
      </section>

      {/* ---- Featured product in category ---- */}
      {hero && (
        <section className="container-page grid items-center gap-12 py-20 md:grid-cols-2">
          {/* accent="none" so the featured product sits on the page surface with
              no mist panel behind the cut-out. */}
          <ProductArt
            category={hero.category}
            accent="none"
            image={productImages[hero.id]?.hero}
            alt={hero.name}
            priority
            sizes="(max-width: 768px) 100vw, 50vw"
          />
          <div>
            {hero.isNew && (
              <p className="text-[11px] font-bold tracking-[0.3em] text-peach uppercase">
                New product
              </p>
            )}
            <h2 className="mt-4 text-2xl md:text-3xl">{hero.name}</h2>
            <p className="mt-5 max-w-md text-sm leading-relaxed text-ink/60">
              {hero.description}
            </p>
            <Link href={`/product/${hero.slug}`} className="btn-primary mt-8">
              See product
            </Link>
          </div>
        </section>
      )}

      {/* ---- Rest of the range ---- */}
      {sub.length > 0 && (
        <section className="bg-mist py-20">
          <div className="container-page">
            <h2 className="text-xl">More {categoryLabel[category as Category]}</h2>
            {/* Grid, not a flex row of `flex-1` children: `flex-1` made a lone
                leftover card (a category with only one product after the hero)
                expand to the full container width, so its square artwork rendered
                huge and the CTA stretched edge to edge. A 2-column grid keeps that
                single card in the first column and still balances a pair. */}
            <div className="mt-10 grid gap-12 sm:grid-cols-2 sm:gap-8">
              {sub.map((p) => (
                <div key={p.id}>
                  <ProductCard product={p} description={p.description} />
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {products.length > 3 && (
        <section className="container-page py-20">
          <h2 className="text-xl">The full range</h2>
          <div className="mt-10 grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
            {products.slice(3).map((p) => (
              <ProductCard key={p.id} product={p} />
            ))}
          </div>
        </section>
      )}

      <PromoBanner />
    </>
  );
}
