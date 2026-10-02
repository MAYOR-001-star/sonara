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
          {/* Image only — the name, copy and CTA sit alongside it, so a full
              ProductCard here would duplicate them. */}
          <ProductArt
            category={hero.category}
            accent={hero.accent}
            image={productImages[hero.id]?.hero}
            alt={hero.name}
            priority
            sizes="(max-width: 768px) 100vw, 50vw"
            className="w-full rounded-3xl"
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
            {/* Flex row of cards; each card stacks image -> description -> title. */}
            <div className="mt-10 flex flex-col gap-12 sm:flex-row sm:items-start sm:gap-8">
              {sub.map((p) => (
                <div key={p.id} className="sm:flex-1">
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
