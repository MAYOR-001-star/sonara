import type { Metadata } from "next";
import { Archivo, Manrope } from "next/font/google";
import "./globals.css";
import StoreChrome from "@/components/StoreChrome";
import { brandName, brandTagline } from "@/lib/products";

const manrope = Manrope({
  variable: "--font-manrope",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800"],
});

/** Display face for the wordmark and headings; Manrope stays on body copy. */
const archivo = Archivo({
  variable: "--font-archivo",
  subsets: ["latin"],
  weight: ["600", "700", "800"],
});

export const metadata: Metadata = {
  title: {
    default: `${brandName.toLowerCase()} - ${brandTagline}`,
    template: `%s | ${brandName}`,
  },
  description:
    `${brandName} is an all-in-one stop to fulfil your audio needs - headphones, speakers and earphones from a small team of music lovers and sound specialists.`,
  icons: {
    icon: [{ url: "/favicon.svg", type: "image/svg+xml" }],
    apple: [{ url: "/favicon.svg" }],
  },
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en" className={`${manrope.variable} ${archivo.variable} h-full`}>
      <body className="flex min-h-full flex-col">
        <StoreChrome>{children}</StoreChrome>
      </body>
    </html>
  );
}

