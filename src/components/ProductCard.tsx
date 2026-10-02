import Link from "next/link";
import ProductArt from "./ProductArt";
import { productImages, type Product } from "@/lib/products";

/** Compact product tile used in category listings and "you may also like". */
export default function ProductCard({
  product,
  description,
}: {
  product: Product;
  /** Optional blurb rendered between the image and the title. */
  description?: string;
}) {
  return (
    <div className="group flex flex-col transition-transform duration-300 hover:-translate-y-1">
      {/* Always the light cut-out treatment: the design shows every featured
          product on the same plain surface, and a dark tile would expose the
          artwork's opaque backdrop now that the tile no longer paints one. */}
      <Link
        href={`/product/${product.slug}`}
        aria-label={product.name}
        tabIndex={-1}
      >
        <ProductArt
          category={product.category}
          accent="mist"
          image={productImages[product.id]?.hero}
          alt={product.name}
          className="w-full rounded-2xl"
          sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
        />
      </Link>

      {/* `flex-1` + `mt-auto` keeps the CTA pinned to the bottom of every card, so a
          title that wraps to two lines ("XX99 MARK I HEADPHONES") no longer
          pushes its button out of line with the single-titled cards beside it.
          Grid items stretch to equal height by default, so the cards match. */}
      <div className="flex flex-1 flex-col pt-6 text-center">
        <h3 className="text-sm font-bold uppercase tracking-[0.2em]">
          <Link href={`/product/${product.slug}`}>{product.name}</Link>
        </h3>
        {description && (
          <p className="mt-4 text-sm leading-relaxed text-ink/60">
            {description}
          </p>
        )}
        {/* `mt-auto` absorbs the slack so the button sits at the card's bottom edge;
            `pt-6` on the wrapper keeps the original gap above it. */}
        <div className="mt-auto pt-6">
          <Link
            href={`/product/${product.slug}`}
            className="btn-primary inline-block w-full"
          >
            See product
          </Link>
        </div>
      </div>
    </div>
  );
}
