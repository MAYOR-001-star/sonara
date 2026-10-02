import Image from "next/image";

/**
 * Product imagery tile.
 *
 * When an `image` is supplied it renders the real artwork from `/public`,
 * scaled to fill the tile and `object-cover` so odd aspect ratios still fill
 * the square. Without one it falls back to the inline vector placeholder, so
 * the storefront never renders an empty box.
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
      className={`relative flex aspect-square items-center justify-center overflow-hidden ${bg} ${className}`}
    >
      {image ? (
        <Image
          src={image}
          alt={alt}
          fill
          priority={priority}
          sizes={sizes}
          className={
            (fit === "cover"
              ? "object-cover"
              : "object-contain p-4 sm:p-6") +
            ` ${imageClassName}` +
            // Product SVGs ship with an opaque white backdrop; multiply lets it
            // drop out so the tile reads as one continuous colour. Skipped on
            // dark tiles, where multiply would crush the product to black.
            (accent === "mist" && fit === "contain" ? " mix-blend-multiply" : "")
          }
        />
      ) : (
        <>
          {/* Decorative concentric arcs, matching the ZX9 banner in the design */}
          <svg viewBox="0 0 200 200" className="absolute inset-0 h-full w-full opacity-25" aria-hidden="true">
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

