import type { Product } from "./products";

/**
 * Seed catalogue. These rows mirror `supabase/schema.sql`, so the database is
 * the source of truth at runtime while this array keeps the storefront
 * renderable before the SQL has been run.
 */
export const seedProducts: Product[] = [
  {
    id: "p-xx99-mark-ii",
    slug: "xx99-mark-ii-headphones",
    name: "XX99 Mark II Headphones",
    category: "headphones",
    price: 2999,
    description:
      "The new XX99 Mark II headphones is the pinnacle of pristine audio. It redefines your premium headphone experience by reproducing the balanced depth and precision of studio-quality sound.",
    features: [
      "Featuring a genuine leather head strap and premium earcups, these headphones deliver superior comfort for endless listening. It includes intuitive controls designed for any situation.",
      "The advanced Active Noise Cancellation with built-in equalizer lets you experience your audio world on your terms. Combined with Bluetooth 5.0, 17 hour battery life and a modern design aesthetic.",
    ],
    inTheBox: ["XX99 Mark II Headphones", "3.5mm audio cable", "USB-C charging cable", "Carry case", "User guide"],
    isNew: true,
    accent: "mist",
  },
  {
    id: "p-xx99-mark-i",
    slug: "xx99-mark-i-headphones",
    name: "XX99 Mark I Headphones",
    category: "headphones",
    price: 1750,
    description:
      "As the gold standard for headphones, the classic XX99 Mark I offers detailed and accurate audio reproduction for audiophiles, mixing engineers, and music aficionados alike in studios and on the go.",
    features: [
      "As the headphones all others are measured against, the XX99 Mark I demonstrates over five decades of audio expertise, redefining the critical listening experience.",
      "From handcrafted microfiber ear cushions to the robust metal headband with inner damping element, the components work together to deliver comfort and uncompromising sound.",
    ],
    inTheBox: ["XX99 Mark I Headphones", "3.5mm audio cable", "Protective case", "User guide"],
    isNew: false,
    accent: "mist",
  },
  {
    id: "p-xx59-headphones",
    slug: "xx59-headphones",
    name: "XX59 Headphones",
    category: "headphones",
    price: 899,
    description:
      "The XX59 delivers a warm, generous soundstage in a lighter, more compact shell — the perfect everyday pair that still sounds like a studio reference.",
    features: [
      "A 40mm bio-cellulose driver keeps the midrange natural and the treble unfatiguing for long sessions.",
      "Folding aluminium hinges and a 1.4m coiled cable make it a reliable travel companion.",
    ],
    inTheBox: ["XX59 Headphones", "1.4m coiled cable", "Airline adapter", "User guide"],
    isNew: false,
    accent: "mist",
  },
  {
    id: "p-zx9-speaker",
    slug: "zx9-speaker",
    name: "ZX9 Speaker",
    category: "speakers",
    price: 2499,
    description:
      "Upgrade to premium speakers that are phenomenally built to deliver truly remarkable sound. A two-way design with a silk-dome tweeter and a long-throw woofer.",
    features: [
      "Hand-matched drivers are paired and measured in our Brooklyn workshop before shipping.",
      "The sealed cabinet is internally braced with layered MDF to eliminate resonance at any volume.",
    ],
    inTheBox: ["ZX9 Speaker", "Power cable", "Speaker grille", "Cinch bag"],
    isNew: true,
    accent: "mist",
  },
  {
    id: "p-zx7-speaker",
    slug: "zx7-speaker",
    name: "ZX7 Speaker",
    category: "speakers",
    price: 1299,
    description:
      "A bookshelf monitor that punches well above its weight. The ZX7 is the gateway to a real hi-fi system for smaller rooms and desktop setups.",
    features: [
      "A 5.25in woven woofer with a rigid cast aluminium basket delivers tight, articulate bass.",
      "Sold as a single speaker so you can build a stereo pair at your own pace.",
    ],
    inTheBox: ["ZX7 Speaker", "Speaker grille", "Cinch bag"],
    isNew: false,
    accent: "mist",
  },
  {
    id: "p-yx1-earphones",
    slug: "yx1-wireless-earphones",
    name: "YX1 Wireless Earphones",
    category: "earphones",
    price: 599,
    description:
      "Truly wireless earphones with an 8mm dynamic driver, IPX5 water resistance and a pocketable charging case that adds 24 hours of playback.",
    features: [
      "Low-latency game mode keeps audio in sync with what you see on screen.",
      "Four silicone tip sizes and an in-line mic for calls that cut through street noise.",
    ],
    inTheBox: ["YX1 Earbuds", "Charging case", "4 ear tip sizes", "USB-C cable"],
    isNew: false,
    accent: "mist",
  },
  {
    id: "p-yx2-earphones",
    slug: "yx2-wireless-earphones",
    name: "YX2 Wireless Earphones",
    category: "earphones",
    price: 749,
    description:
      "Our flagship earphones add adaptive ANC and a wireless-charging case to the YX1 formula, for commutes where the world needs to go away.",
    features: [
      "Adaptive ANC measures the seal in your ear 200 times a second and adjusts depth automatically.",
      "Wireless charging case with 32 hours of total playback and an LED battery readout.",
    ],
    inTheBox: ["YX2 Earbuds", "Wireless charging case", "4 ear tip sizes", "USB-C cable"],
    isNew: true,
    accent: "mist",
  },
  {
    id: "p-yx3-earphones",
    slug: "yx3-earphones",
    name: "YX3 Studio Earbuds",
    category: "earphones",
    price: 1099,
    description:
      "Reference-grade earphones tuned with our mastering engineers — the same voicing we use on our full-size monitors.",
    features: [
      "Hybrid driver array with a dedicated high-frequency tweeter for detail retrieval.",
      "Studio-grade memory foam tips passively isolate up to 18dB before ANC engages.",
    ],
    inTheBox: ["YX3 Earbuds", "Studio case", "Memory foam tips", "USB-C cable"],
    isNew: true,
    accent: "mist",
  },
];

