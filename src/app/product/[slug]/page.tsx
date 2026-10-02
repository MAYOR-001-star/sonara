import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getProduct, getProducts } from "@/lib/catalog";
import { categoryLabel, formatPrice, productImages } from "@/lib/products";
import ProductArt from "@/components/ProductArt";
import ProductCard from "@/components/ProductCard";
import ProductPurchase from "@/components/ProductPurchase";
import PromoBanner from "@/components/PromoBanner";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const product = await getProduct(slug);
  if (!product) return {};
  return { title: product.name, description: product.description };
}

export default async function ProductPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const product = await getProduct(slug);
  if (!product) notFound();

  const all = await getProducts();
  const related = all.filter((p) => p.id !== product.id).slice(0, 6);
  const images = productImages[product.id] ?? { hero: "", gallery: [] };

  return (
    <>
      <div className="container-page pt-10">
        <Link
          href={`/category/${product.category}`}
          className="text-[11px] font-bold tracking-[0.2em] text-ink/40 uppercase transition-colors hover:text-peach"
        >
          Go back
        </Link>
      </div>

      <section className="container-page grid items-start gap-14 py-14 md:grid-cols-2">
        <ProductArt
          category={product.category}
          accent={product.accent}
          image={images.hero}
          alt={product.name}
          priority
          className="w-full rounded-3xl"
          sizes="(max-width: 768px) 100vw, 50vw"
        />

        <div className="pt-4">
          {product.isNew && (
            <p className="text-[11px] font-bold tracking-[0.3em] text-peach uppercase">
              New product
            </p>
          )}
          <h1 className="mt-4 text-2xl leading-tight md:text-3xl">
            {product.name}
          </h1>

          <p className="mt-6 max-w-lg text-sm leading-relaxed text-ink/70">
            {product.description}
          </p>

          <p className="mt-8 text-xl font-extrabold">
            {formatPrice(product.price)}
          </p>

          <div className="mt-9">
            <ProductPurchase product={product} />
          </div>
        </div>
      </section>

      {/* ---- Gallery strip ---- */}
      {images.gallery.length > 0 && (
        <section className="container-page py-10">
          <div className="grid gap-6 sm:grid-cols-3">
            {images.gallery.map((src, i) => (
              <div
                key={src + i}
                className="relative aspect-square overflow-hidden rounded-2xl bg-mist"
              >
                <Image
                  src={src}
                  alt={`${product.name} view ${i + 1}`}
                  fill
                  sizes="(max-width: 640px) 100vw, 33vw"
                  className="object-contain p-4"
                />
              </div>
            ))}
          </div>
        </section>
      )}

      {/* ---- Features / In the box ---- */}
      <section className="bg-mist py-16">
        <div className="container-page grid gap-12 md:grid-cols-2">
          <div>
            <h2 className="text-xl">Features</h2>
            <div className="mt-6 space-y-5">
              {product.features.map((f) => (
                <p key={f} className="text-sm leading-relaxed text-ink/70">
                  {f}
                </p>
              ))}
            </div>
          </div>

          <div>
            <h2 className="text-xl">In the box</h2>
            <ul className="mt-6 space-y-3">
              {product.inTheBox.map((item) => (
                <li
                  key={item}
                  className="flex items-start gap-3 text-sm text-ink/70"
                >
                  <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-peach" />
                  {item}
                </li>
              ))}
            </ul>
            <p className="mt-8 text-[11px] font-bold tracking-[0.2em] text-ink/40 uppercase">
              Category: {categoryLabel[product.category]}
            </p>
          </div>
        </div>
      </section>

      {/* ---- You may also like ---- */}
      {related.length > 0 && (
        <section className="container-page py-20">
          <h2 className="text-xl">You may also like</h2>
          <div className="mt-10 grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
            {related.map((p) => (
              <ProductCard key={p.id} product={p} />
            ))}
          </div>
        </section>
      )}

      <PromoBanner />
    </>
  );
}
