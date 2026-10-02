import Link from "next/link";
import Image from "next/image";
import { getProducts, getProductsByCategory } from "@/lib/catalog";
import { categories, productImages, storeArt, brandName } from "@/lib/products";
import ProductCard from "@/components/ProductCard";
import ProductArt from "@/components/ProductArt";
import Hero from "@/components/Hero";
import CategoryTile from "@/components/CategoryTile";
import AddToCartButton from "@/components/AddToCartButton";

export default async function HomePage() {
  const [all, headphones, speakers, earphones] = await Promise.all([
    getProducts(),
    getProductsByCategory("headphones"),
    getProductsByCategory("speakers"),
    getProductsByCategory("earphones"),
  ]);

  const byCategory = { headphones, speakers, earphones };
  const hero = all[0];
  const featured = all.slice(1, 4);
  const [zx9, zx7] = speakers;

  return (
    <>
      {hero && <Hero product={hero} />}

      {/* ---- Category tiles ---- */}
      <section className="container-page py-20">
        <div className="grid gap-8 md:grid-cols-3">
          {categories.map((c) => (
            <CategoryTile
              key={c}
              category={c}
              product={byCategory[c][0]}
              count={byCategory[c].length}
            />
          ))}
        </div>
      </section>

      {/* ---- Featured ---- */}
      <section className="bg-mist py-20">
        <div className="container-page">
          <div className="flex items-end justify-between gap-6">
            <h2 className="text-2xl md:text-3xl">Featured</h2>
            <Link href="/category/headphones" className="btn-link">
              Shop all &rsaquo;
            </Link>
          </div>
          <div className="mt-10 grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
            {featured.map((p) => (
              <ProductCard key={p.id} product={p} />
            ))}
          </div>
        </div>
      </section>

      {/* ---- Spotlight banners ---- */}
      <section className="container-page space-y-10 py-20">
        {zx9 && (
          <div className="grid items-center gap-10 overflow-hidden rounded-3xl bg-peach p-10 md:grid-cols-2 md:p-16">
            <ProductArt category="speakers" accent="mist" image={productImages[zx9.id]?.hero} alt={zx9.name} sizes="(max-width: 768px) 100vw, 50vw" className="order-last w-full rounded-2xl md:order-first" />
            <div>
              <h2 className="text-2xl md:text-3xl">{zx9.name}</h2>
              <p className="mt-4 max-w-md text-sm leading-relaxed text-ink/70">
                {zx9.description}
              </p>
              <div className="mt-8">
                <AddToCartButton product={zx9} />
              </div>
            </div>
          </div>
        )}

        {zx7 && (
          <div className="grid items-center gap-10 overflow-hidden rounded-3xl bg-mist p-10 md:grid-cols-2 md:p-16">
            <div>
              <h2 className="text-2xl md:text-3xl">{zx7.name}</h2>
              <p className="mt-4 max-w-md text-sm leading-relaxed text-ink/70">
                {zx7.description}
              </p>
              <div className="mt-8">
                <AddToCartButton product={zx7} className="btn-outline" />
              </div>
            </div>
            <ProductArt category="speakers" accent="peach" image={productImages[zx7.id]?.hero} alt={zx7.name} sizes="(max-width: 768px) 100vw, 50vw" className="w-full rounded-2xl" />
          </div>
        )}
      </section>

      {/* ---- About band ---- */}
      <section className="container-page py-20">
        <div className="grid items-center gap-12 md:grid-cols-2">
          <div>
            <h2 className="text-2xl leading-tight md:text-3xl">
              Bringing you the <span className="text-peach">best</span> audio gear
            </h2>
            <p className="mt-6 max-w-md text-sm leading-relaxed text-ink/60">
              Located at the heart of New York City, {brandName} is the premier store
              for high end headphones, earphones, speakers, and audio accessories. We
              have a large showroom and luxury demonstration rooms available for you
              to browse and experience a wide range of our products. Stop by our store
              to meet some of the fantastic people who make {brandName} the best place
              to buy your portable audio equipment.
            </p>
            <Link href="/category/speakers" className="btn-link mt-8">
              Visit the store &rsaquo;
            </Link>
          </div>
          <div className="relative aspect-square overflow-hidden rounded-3xl bg-mist">
            <Image
              src={storeArt.model}
              alt={`A model listening with ${brandName} headphones in the showroom`}
              fill
              sizes="(max-width: 768px) 100vw, 50vw"
              className="object-contain p-6"
            />
          </div>
        </div>
      </section>
    </>
  );
}
