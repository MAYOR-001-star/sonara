import { seedProducts } from "./seed-products";
import type { Category, Product } from "./products";
import { createClient } from "./supabase/server";

type ProductRow = {
  id: string;
  slug: string;
  name: string;
  category: Category;
  price: number;
  description: string | null;
  features: string[] | null;
  in_the_box: string[] | null;
  is_new: boolean | null;
  accent: Product["accent"] | null;
};

function fromRow(row: ProductRow): Product {
  return {
    id: row.id,
    slug: row.slug,
    name: row.name,
    category: row.category,
    price: Number(row.price),
    description: row.description ?? "",
    features: row.features ?? [],
    inTheBox: row.in_the_box ?? [],
    isNew: Boolean(row.is_new),
    accent: row.accent ?? "mist",
  };
}

/**
 * Reads the catalogue from Postgres via Supabase. Falls back to the bundled
 * seed data when Supabase is unconfigured or unreachable, so the site always
 * renders. Swap in a direct `pg`/Neon pool here if you prefer raw SQL.
 */
async function queryProducts(where?: { category?: Category; slug?: string }) {
  const supabase = await createClient();

  let q = supabase.from("products").select("*").order("created_at");
  if (where?.category) q = q.eq("category", where.category);
  if (where?.slug) q = q.eq("slug", where.slug).limit(1);

  const { data, error } = await q;
  if (error) throw error;
  return (data as ProductRow[]).map(fromRow);
}

export async function getProducts(): Promise<Product[]> {
  try {
    const rows = await queryProducts();
    return rows.length ? rows : seedProducts;
  } catch {
    return seedProducts;
  }
}

export async function getProductsByCategory(category: Category): Promise<Product[]> {
  try {
    const rows = await queryProducts({ category });
    return rows.length ? rows : seedProducts.filter((p) => p.category === category);
  } catch {
    return seedProducts.filter((p) => p.category === category);
  }
}

export async function getProduct(slug: string): Promise<Product | undefined> {
  try {
    const rows = await queryProducts({ slug });
    if (rows.length) return rows[0];
  } catch {
    // fall through to seed lookup
  }
  return seedProducts.find((p) => p.slug === slug);
}

export async function getProductById(id: string): Promise<Product | undefined> {
  const fromDb = await getProducts().then((all) => all.find((p) => p.id === id));
  return fromDb;
}
