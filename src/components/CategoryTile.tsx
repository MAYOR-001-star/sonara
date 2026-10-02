import Link from "next/link";
import Image from "next/image";
import { categoryLabel, categoryArt, type Category } from "@/lib/products";
import type { Product } from "@/lib/products";

/** Square category tile used on the home page. */
export default function CategoryTile({
  category,
  product,
  count,
}: {
  category: Category;
  product?: Product;
  count: number;
}) {
  return (
    <Link
      href={`/category/${category}`}
      className="group bg-mist p-8 text-center transition-transform duration-300 hover:-translate-y-1"
    >
      {product && (
        <div className="relative mx-auto h-40 w-40">
          <Image
            src={categoryArt[category]}
            alt={categoryLabel[category]}
            fill
            sizes="160px"
            className="object-contain transition-transform duration-500 group-hover:scale-105"
          />
        </div>
      )}
      <h3 className="mt-8 text-sm">{categoryLabel[category]}</h3>
      <span className="btn-link mt-3 justify-center">Shop &rsaquo;</span>
      <p className="mt-2 text-xs text-ink/40">
        {count} product{count === 1 ? "" : "s"}
      </p>
    </Link>
  );
}
