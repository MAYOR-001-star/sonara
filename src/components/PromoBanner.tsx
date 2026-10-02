import Link from "next/link";
import Image from "next/image";
import { brandName, storeArt } from "@/lib/products";

/** "Bringing you the best audio gear" band, reused at the end of listings. */
export default function PromoBanner() {
  return (
    <section className="container-page py-20">
      <div className="grid items-center gap-12 md:grid-cols-2">
        <div>
          <h2 className="text-2xl leading-tight md:text-3xl">
            Bringing you the <span className="text-peach">best</span> audio gear
          </h2>
          <p className="mt-6 max-w-md text-sm leading-relaxed text-ink/60">
            Located at the heart of New York City, {brandName} is the premier store for
            high end headphones, earphones, speakers, and audio accessories. We have a
            large showroom and luxury demonstration rooms available for you to browse
            and experience a wide range of our products.
          </p>
          <Link href="/category/headphones" className="btn-link mt-8">
            Browse the store &rsaquo;
          </Link>
        </div>
        <div className="relative aspect-square overflow-hidden rounded-3xl bg-mist">
          <Image
            src={storeArt.model}
            alt={`A model listening with ${brandName} headphones in the showroom`}
            fill
            sizes="(max-width: 768px) 100vw, 50vw"
            className="object-contain p-6"
          />
        </div>
      </div>
    </section>
  );
}
