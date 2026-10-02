import Image from "next/image";

/**
 * Product imagery tile.
 *
 * When an `image` is supplied it renders the real artwork from `/public` as a
 * transparent cut-out scaled to fit the tile, with no tile background and no
 * inner padding — the product sits directly on the page surface, matching the
 * design. Without an image it falls back to the inline vector placeholder on an
 * accent background, so the storefront never renders an empty box.
 */
export default function ProductArt({
  category,
  accent = "mist",
  image,
  alt = "",
  className = "",
  imageClassName = "",
  priority = false,
  sizes = "(max-width: 768px) 100vw, 33vw",
  fit = "contain",
  square = true,
}: {
  category: "headphones" | "speakers" | "earphones";
  accent?: "peach" | "mist" | "ink" | "none";
  image?: string;
  alt?: string;
  className?: string;
  /** Extra classes for the <img>, used to fade artwork into a dark section. */
  imageClassName?: string;
  priority?: boolean;
  sizes?: string;
  /**
   * `contain` (default) letterboxes the artwork so the whole product is
   * visible — these are transparent cut-outs, so cropping would cut heads off.
   * `cover` fills the tile edge-to-edge, used for photographic banners.
   */
  fit?: "contain" | "cover";
  /**
   * Locks the tile to a 1:1 box. Turn it off for full-bleed artwork that should
   * fill an arbitrary container (the home hero) instead of letterboxing.
   */
  square?: boolean;
}) {
  const bg =
    {
      peach: "bg-peach",
      mist: "bg-mist",
      ink: "bg-ink",
      none: "bg-transparent",
    }[accent] ?? "";

  const fg = accent === "ink" ? "text-peach" : "text-ink";
  const soft = accent === "ink" ? "text-white/70" : "text-ink/60";

  return (
    <div
      className={`relative flex items-center justify-center overflow-hidden ${square ? "aspect-square" : ""} ${bg} ${className}`}
    >
      {image ? (
        <Image
          src={image}
          alt={alt}
          fill
          priority={priority}
          sizes={sizes}
          className={
            (fit === "cover" ? "object-cover" : "object-contain") +
            ` ${imageClassName} ` +
            // Product SVGs ship with an opaque white backdrop. Multiply lets it
            // dissolve into the tile colour, so the cut-out reads as one
            // continuous surface instead of sitting inside a second, visible
            // panel. This is why the image carries no padding - padding was
            // what exposed the backdrop as its own inset rectangle.
            // Skipped on dark tiles, where multiply would crush the product.
            (accent === "ink" && fit === "contain" ? "" : " mix-blend-multiply")
          }
        />
      ) : (
        <>
          {/* Decorative concentric arcs, matching the ZX9 banner in the design */}
          <svg viewBox="0 0 200 200" className="relative h-full w-full opacity-25" aria-hidden="true">
            <g fill="none" stroke="currentColor" strokeWidth="0.75">
              <circle cx="100" cy="100" r="40" />
              <circle cx="100" cy="100" r="60" />
              <circle cx="100" cy="100" r="80" />
            </g>
          </svg>

          {category === "headphones" && (
            <svg viewBox="0 0 120 120" className={`relative h-1/2 w-1/2 ${fg}`} fill="none" stroke="currentColor" strokeWidth="4" strokeLinecap="round" aria-hidden="true">
              <path d="M24 84V66a36 36 0 0 1 72 0v18" />
              <rect x="14" y="80" width="20" height="30" rx="9" />
              <rect x="86" y="80" width="20" height="30" rx="9" />
            </svg>
          )}

          {category === "speakers" && (
            <svg viewBox="0 0 120 120" className={`relative h-1/2 w-1/2 ${fg}`} fill="none" stroke="currentColor" strokeWidth="4" aria-hidden="true">
              <rect x="34" y="10" width="52" height="100" rx="6" />
              <circle cx="60" cy="40" r="13" />
              <circle cx="60" cy="84" r="17" />
            </svg>
          )}

          {category === "earphones" && (
            <svg viewBox="0 0 120 120" className={`relative h-1/2 w-1/2 ${fg}`} fill="none" stroke="currentColor" strokeWidth="4" aria-hidden="true">
              <circle cx="60" cy="60" r="42" />
              <circle cx="60" cy="60" r="6" fill="currentColor" stroke="none" />
              <path d="M18 60a42 42 0 0 1 42-42" className={soft} />
            </svg>
          )}
        </>
      )}
    </div>
  );
}

