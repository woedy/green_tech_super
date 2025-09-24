export type Plan = {
  id: number;
  slug: string;
  name: string;
  heroImage: string;
  style: string;
  beds: number;
  baths: number;
  floors: number;
  areaSqm: number;
  hasGarage: boolean;
  basePrice: number;
  regionsAvailable: string[];
  description: string;
  images: string[];
  options: { name: string; priceDelta: number }[];
};

import hero from "@/assets/hero-construction.jpg";
import commercial from "@/assets/project-commercial.jpg";
import luxury from "@/assets/property-luxury.jpg";

export const PLANS: Plan[] = [
  {
    id: 1,
    slug: "green-valley-villa",
    name: "Green Valley Villa",
    heroImage: luxury,
    style: "Modern",
    beds: 4,
    baths: 3,
    floors: 2,
    areaSqm: 320,
    hasGarage: true,
    basePrice: 120000,
    regionsAvailable: ["GH", "GH", "GH", "ZA"],
    description: "A modern, energy‑efficient villa with open-plan living and integrated solar.",
    images: [luxury, hero, commercial],
    options: [
      { name: "Solar package", priceDelta: 6000 },
      { name: "Rainwater harvesting", priceDelta: 2500 },
      { name: "Smart home bundle", priceDelta: 1800 },
    ],
  },
  {
    id: 2,
    slug: "urban-duplex-a2",
    name: "Urban Duplex A2",
    heroImage: hero,
    style: "Contemporary",
    beds: 3,
    baths: 3,
    floors: 2,
    areaSqm: 240,
    hasGarage: false,
    basePrice: 89000,
    regionsAvailable: ["GH", "GH", "TZ"],
    description: "Compact duplex optimized for urban plots with sustainable materials.",
    images: [hero, commercial, luxury],
    options: [
      { name: "Grey water system", priceDelta: 2100 },
      { name: "High‑efficiency glazing", priceDelta: 1600 },
    ],
  },
  {
    id: 3,
    slug: "eco-bungalow-s1",
    name: "Eco Bungalow S1",
    heroImage: commercial,
    style: "Bungalow",
    beds: 2,
    baths: 2,
    floors: 1,
    areaSqm: 140,
    hasGarage: false,
    basePrice: 65000,
    regionsAvailable: ["GH", "GH"],
    description: "Single‑storey starter home with passive cooling and low footprint.",
    images: [commercial, hero, luxury],
    options: [
      { name: "Extended veranda", priceDelta: 1200 },
      { name: "Insulation upgrade", priceDelta: 900 },
    ],
  },
];



