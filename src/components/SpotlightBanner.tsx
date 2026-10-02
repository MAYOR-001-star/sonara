import Image from "next/image";
import Link from "next/link";
import { productImages, storeArt } from "@/lib/products";
import type { Product } from "@/lib/products";
import AddToCartButton from "./AddToCartButton";

/**
 * Full-bleed editorial banner for a single spotlight product.
 *
 * The artwork bleeds off the left and bottom edges and is masked so its
 * baked-in panel colour dissolves into the accent background, with the
 * concentric ring-lights sitting behind it as depth.
 */
export default function SpotlightBanner({
  product,
  accent = "bg-accent",
  cta = "See product",
}: {
  product: Product;
  /** Background class for the banner, matching the product's accent. */
  accent?: string;
  cta?: string;
}) {
  const image = productImages[product.id]?.hero;
  // On the dark ZX7 banner a `btn-dark` CTA is the same colour as the
  // background, so it reads as plain text. Dark banners get the outlined
  // variant so the button is always legible.
  const ctaClass =
    accent === "bg-ink"
      ? "btn-inverse"
      : "btn-dark bg-ink text-white hover:bg-white hover:text-ink";

  return (
    <div
      className={`relative isolate grid overflow-hidden rounded-3xl ${accent} lg:grid-cols-2`}
    >
      {/* Decorative rings, cropped by the banner edges */}
      <Image
        src={storeArt.ringLights}
        alt=""
        aria-hidden="true"
        width={795}
        height={560}
        className="pointer-events-none absolute -left-1/4 -top-1/4 -z-10 w-[140%] max-w-none opacity-70"
        priority={false}
      />

      {/* Artwork bleeds past the left and bottom edges. `min-h` on the stacked
          layout, plus the text block's own top padding, keeps a clear gap
          between the image and the headline. */}
      <div className="relative min-h-64 overflow-hidden lg:min-h-0">
        {image && (
          <Image
            src={image}
            alt={product.name}
            fill
            sizes="(max-width: 768px) 100vw, 50vw"
            className="object-contain object-bottom opacity-95
              [mask-image:radial-gradient(ellipse_75%_75%_at_50%_45%,#000_55%,transparent_100%)]
              [-webkit-mask-image:radial-gradient(ellipse_75%_75%_at_50%_45%,#000_55%,transparent_100%)]"
            priority
          />
        )}
      </div>

      <div className="flex flex-col justify-center px-6 pb-10 pt-10 text-white sm:px-8 lg:px-12 lg:py-16">
        {/* The design sets the name across two lines, e.g. "ZX9 / SPEAKER" */}
        <h2 className="text-4xl leading-[0.95] md:text-5xl lg:text-6xl">
          {product.name.split(" ").map((word) => (
            <span key={word} className="block">
              {word}
            </span>
          ))}
        </h2>
        <p className="mt-5 max-w-sm text-sm leading-relaxed text-white/85">
          {product.description}
        </p>
        {/* `flex-wrap` let the two CTAs stack at narrow widths. They stay on one
            line instead: each button is `flex-1` so the pair splits the row
            evenly, and the shared button padding is trimmed at `sm` (the
            default 2rem inline padding made the pair wider than a 390px
            viewport). Labels never wrap - they sit on their own lines. */}
        <div className="mt-8 flex items-stretch gap-3">
          <Link
            href={`/product/${product.slug}`}
            className={`${ctaClass} flex-1 basis-0 whitespace-nowrap px-3 sm:px-8`}
          >
            {cta}
          </Link>
          <AddToCartButton
            product={product}
            className="btn-outline flex-1 basis-0 whitespace-nowrap border-white px-3 text-white hover:bg-white hover:text-ink sm:px-8"
          />
        </div>
      </div>
    </div>
  );
}