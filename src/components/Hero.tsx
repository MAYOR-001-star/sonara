import Link from "next/link";
import ProductArt from "./ProductArt";
import { brandName, storeArt, type Product } from "@/lib/products";

/** Dark hero banner for the featured product on the home page. */
export default function Hero({ product }: { product: Product }) {
  return (
    // Full-bleed artwork with the copy overlaid, matching the design on both
    // mobile and tablet: the previous stacked layout put the image *below* the
    // headline, which pushed the CTA and product far down the viewport.
    <section className="relative isolate flex min-h-[520px] items-center justify-center overflow-hidden bg-ink text-white sm:min-h-[600px] lg:min-h-[700px]">
      <Link
        href={`/product/${product.slug}`}
        className="absolute inset-0 z-0 flex items-center justify-center lg:left-auto lg:right-0 lg:w-[62%]"
        aria-label={`View ${product.name}`}
      >
        {/* Phone/tablet: the artwork is scaled up so the headphone reads as a large
            silhouette filling the frame with the copy nested inside the headband,
            as in the design. Desktop splits instead - the art takes the right ~62%
            and the copy sits to its left, so there the art is shown at natural size
            and allowed to bleed off the right edge (clipped by `overflow-hidden`). */}
        <ProductArt
          category={product.category}
          accent="none"
          image={storeArt.hero}
          alt={`${product.name} in the ${brandName} showroom`}
          priority
          className="blend-into-ink-soft h-full w-full"
          imageClassName="object-contain scale-[1.45] sm:scale-[1.3] lg:scale-110"
          square={false}
          sizes="100vw"
        />
      </Link>

      {/* Scrim keeps the white type legible over the artwork at every width. On
          desktop the art is pushed to the right, so the scrim is a left-weighted
          gradient instead of a flat wash that would dull the product. */}
      <div
        className="pointer-events-none absolute inset-0 z-[1] bg-gradient-to-b from-ink/60 via-ink/25 to-ink/75 lg:bg-gradient-to-r lg:from-ink lg:via-ink/90 lg:to-transparent"
        aria-hidden="true"
      />

      <div className="container-page relative z-10 py-20 text-center lg:text-left">
        <div className="mx-auto max-w-2xl lg:mx-0 lg:max-w-sm lg:pr-8 xl:max-w-md">
          <p className="text-[11px] font-bold tracking-[0.35em] text-white/60 uppercase">
            New product
          </p>
          <h1 className="mt-5 text-hero font-extrabold uppercase">
            {product.name}
          </h1>
          <p className="mx-auto mt-5 max-w-md text-sm leading-relaxed text-white/70 lg:mx-0">
            {product.description}
          </p>
          <div className="mt-8 flex justify-center lg:justify-start">
            <Link
              href={`/product/${product.slug}`}
              className="btn-inverse max-w-full text-center"
            >
              See product
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}
