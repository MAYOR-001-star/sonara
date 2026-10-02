import Link from "next/link";
import ProductArt from "./ProductArt";
import { brandName, storeArt, type Product } from "@/lib/products";

/** Dark hero banner for the featured product on the home page. */
export default function Hero({ product }: { product: Product }) {
  return (
    <section className="bg-ink text-white">
      <div className="container-page grid items-center gap-12 py-16 md:grid-cols-2 md:py-24">
        <div>
          <p className="text-[11px] font-bold tracking-[0.35em] text-white/50 uppercase">
            New product
          </p>
          <h1 className="mt-6 text-hero font-extrabold uppercase">
            {product.name}
          </h1>
          <p className="mt-6 max-w-sm text-sm leading-relaxed text-white/60">
            {product.description}
          </p>
          <div className="mt-9">
            <Link href={`/product/${product.slug}`} className="btn-inverse">
              See product
            </Link>
          </div>
        </div>

        <Link
          href={`/product/${product.slug}`}
          className="group relative block"
          aria-label={`View ${product.name}`}
        >
          <ProductArt
            category={product.category}
            accent="none"
            image={storeArt.hero}
            alt={`${product.name} in the ${brandName} showroom`}
            priority
            className="blend-into-ink w-full transition-transform duration-500 group-hover:scale-[1.02]"
            sizes="(max-width: 768px) 100vw, 50vw"
          />
        </Link>
      </div>
    </section>
  );
}
