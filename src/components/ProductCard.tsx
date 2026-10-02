import Link from "next/link";
import ProductArt from "./ProductArt";
import { formatPrice, productImages, type Product } from "@/lib/products";

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
    <Link
      href={`/product/${product.slug}`}
      className="group flex flex-col transition-transform duration-300 hover:-translate-y-1"
    >
      <ProductArt
        category={product.category}
        accent={product.accent}
        image={productImages[product.id]?.hero}
        alt={product.name}
        className="w-full rounded-2xl"
        sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
      />
      {description && (
        <p className="mt-6 text-center text-sm leading-relaxed text-ink/60">
          {description}
        </p>
      )}
      <div className="pt-5 text-center">
        <h3 className="text-sm font-bold">{product.name}</h3>
        <p className="mt-1 text-xs text-ink/50">
          {formatPrice(product.price)}
        </p>
        <span className="btn-link mt-3 justify-center">Shop &rsaquo;</span>
      </div>
    </Link>
  );
}
