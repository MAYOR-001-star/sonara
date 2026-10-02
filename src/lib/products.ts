export type Category = "headphones" | "speakers" | "earphones";

export type Product = {
  id: string;
  slug: string;
  name: string;
  category: Category;
  /** Price in whole currency units, e.g. 2999 => $2,999 */
  price: number;
  description: string;
  features: string[];
  inTheBox: string[];
  isNew: boolean;
  accent: "peach" | "mist" | "ink";
};

export const categoryLabel: Record<Category, string> = {
  headphones: "Headphones",
  speakers: "Speakers",
  earphones: "Earphones",
};

export const categories: Category[] = ["headphones", "speakers", "earphones"];

export function formatPrice(
  value: number,
  currency = process.env.NEXT_PUBLIC_CURRENCY || "USD",
) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency,
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value);
}

export const shippingFlatRate = Number(process.env.SHIPPING_FLAT_RATE || 50);

/**
 * Maps a product `id` to the artwork bundled in `/public`.
 *
 * The database only stores catalogue data (name, price, copy), so image paths
 * live here in code. That keeps `supabase/schema.sql` free of asset concerns and
 * means swapping an image is a one-line change plus a file in `/public`.
 *
 * `hero` is the square-ish shot used on cards and the product page.
 * `gallery` powers the image strip on the product page. Products without their
 * own artwork fall back to a sibling shot so nothing ever renders empty.
 */
export type ProductImages = {
  hero: string;
  gallery: string[];
};

export const productImages: Record<string, ProductImages> = {
  "p-xx99-mark-ii": {
    hero: "/category/headphones/xx99-mark-ii.svg",
    gallery: [
      "/extras/headphones/headphone-1/headphone-gallery-1.svg",
      "/extras/headphones/headphone-1/headphone-gallery-2.svg",
      "/extras/headphones/headphone-1/headphone-gallery-3.svg",
    ],
  },
  "p-xx99-mark-i": {
    hero: "/category/headphones/xx99-mark-i.svg",
    gallery: [
      "/extras/headphones/headphone-2/headphone-gallery-1.svg",
      "/extras/headphones/headphone-2/headphone-gallery-2.svg",
      "/extras/headphones/headphone-2/headphone-gallery-3.svg",
    ],
  },
  "p-xx59-headphones": {
    hero: "/category/headphones/xx59.svg",
    gallery: [
      "/extras/headphones/headphone-3/headphone-gallery-1.svg",
      "/extras/headphones/headphone-3/headphone-gallery-2.svg",
      "/extras/headphones/headphone-3/headphone-gallery-3.svg",
    ],
  },
  "p-zx9-speaker": {
    hero: "/category/speakers/zx9.svg",
    gallery: [
      "/extras/speakers/speaker-1/speaker-gallery-1.svg",
      "/extras/speakers/speaker-1/speaker-gallery-2.svg",
      "/extras/speakers/speaker-1/speaker-gallery-3.svg",
    ],
  },
  "p-zx7-speaker": {
    hero: "/category/speakers/zx7.svg",
    gallery: [
      "/extras/speakers/speaker-2/speaker-gallery-1.svg",
      "/extras/speakers/speaker-2/speaker-gallery-2.svg",
      "/extras/speakers/speaker-2/speaker-gallery-3.svg",
    ],
  },
  "p-yx1-earphones": {
    hero: "/category/earphones/yx1-wireless.svg",
    gallery: [
      "/extras/earphones/earphone-gallery-1.svg",
      "/extras/earphones/earphone-gallery-2.svg",
      "/extras/earphones/earphone-gallery-3.svg",
    ],
  },
  // YX2 / YX3 share the YX1 earbud artwork; the galleries differentiate them.
  "p-yx2-earphones": {
    hero: "/earphones/yx1-earphones.svg",
    gallery: [
      "/extras/earphones/earphone-gallery-2.svg",
      "/extras/earphones/earphone-gallery-3.svg",
      "/extras/earphones/earphone-gallery-1.svg",
    ],
  },
  "p-yx3-earphones": {
    hero: "/earphones/yx1-earphones.svg",
    gallery: [
      "/extras/earphones/earphone-gallery-3.svg",
      "/extras/earphones/earphone-gallery-1.svg",
      "/extras/earphones/earphone-gallery-2.svg",
    ],
  },
};

/** Small transparent cut-out per category, used on the home page tiles. */
export const categoryArt: Record<string, string> = {
  headphones: "/miniproducts/headphones.svg",
  speakers: "/miniproducts/speakers.svg",
  earphones: "/miniproducts/earphones.svg",
};

/** Wide shot used in the "about the store" band. */
export const storeArt = {
  hero: "/hero-img.svg",
  ringLights: "/ring-lights.svg",
  model: "/model.svg",
  shadow: "/shadow.svg",
};


/**
 * Single source of truth for the company name.
 *
 * Every user-facing string (metadata, wordmark, emails) should reference this
 * rather than hardcoding the brand, so a rename is a one-line change here.
 */
export const brandName = "Sonora";

/** Used in prose and legal lines, e.g. "Sonora is an all-in-one stop...". */
export const brandNameLower = brandName.toLowerCase();

/** Appended to page titles via the layout metadata template. */
export const brandTagline = "Premium Headphones, Speakers & Earphones";

export function cartTotals(
  lines: { price: number; quantity: number }[],
  shipping = shippingFlatRate,
) {
  const subtotal = lines.reduce((sum, l) => sum + l.price * l.quantity, 0);
  const vat = Math.round(subtotal * 0.2);
  return { subtotal, shipping, vat, grandTotal: subtotal + vat + shipping };
}
