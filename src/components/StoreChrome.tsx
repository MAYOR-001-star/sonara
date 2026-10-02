"use client";

import { usePathname } from "next/navigation";
import type { ReactNode } from "react";
import Header from "./Header";
import Footer from "./Footer";
import CartDrawer from "./CartDrawer";

// Routes that render full-screen without the store chrome.
const BARE_ROUTES = ["/login"];

export default function StoreChrome({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const isBare = BARE_ROUTES.some(
    (route) => pathname === route || pathname.startsWith(`${route}/`),
  );

  if (isBare) {
    return <main className="min-h-screen">{children}</main>;
  }

  return (
    <>
      <Header />
      <main className="flex-1">{children}</main>
      <Footer />
      <CartDrawer />
    </>
  );
}
