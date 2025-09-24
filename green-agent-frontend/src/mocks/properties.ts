import hero from "@/assets/hero-construction.jpg";
import commercial from "@/assets/project-commercial.jpg";
import luxury from "@/assets/property-luxury.jpg";
import team from "@/assets/team-construction.jpg";

export type Property = {
  id: number;
  slug: string;
  title: string;
  type: string;
  listingType: "sale" | "rent";
  location: { city: string; country: string };
  price: string;
  beds: number;
  baths: number;
  area: string;
  image: string;
  featured: boolean;
  status: string;
  description: string;
};

export const PROPERTIES: Property[] = [
  {
    id: 1,
    slug: "luxury-waterfront-villa",
    title: "Luxury Waterfront Villa",
    type: "Villa",
    listingType: "sale",
    location: { city: "Lagos", country: "Nigeria" },
    price: "$850,000",
    beds: 4,
    baths: 3,
    area: "350 sqm",
    image: luxury,
    featured: true,
    status: "For Sale",
    description: "Stunning waterfront villa with panoramic ocean views and premium finishes.",
  },
  {
    id: 2,
    slug: "modern-city-apartment",
    title: "Modern City Apartment",
    type: "Apartment",
    listingType: "sale",
    location: { city: "Nairobi", country: "Kenya" },
    price: "$320,000",
    beds: 2,
    baths: 2,
    area: "120 sqm",
    image: hero,
    featured: false,
    status: "For Sale",
    description: "Contemporary apartment in the heart of the city with modern amenities.",
  },
  {
    id: 3,
    slug: "commercial-office-space",
    title: "Commercial Office Space",
    type: "Commercial",
    listingType: "rent",
    location: { city: "Cape Town", country: "South Africa" },
    price: "$1,200,000",
    beds: 0,
    baths: 4,
    area: "500 sqm",
    image: commercial,
    featured: true,
    status: "For Lease",
    description: "Prime commercial space in prestigious business district.",
  },
  {
    id: 4,
    slug: "family-townhouse",
    title: "Family Townhouse",
    type: "Townhouse",
    listingType: "sale",
    location: { city: "Accra", country: "Ghana" },
    price: "$450,000",
    beds: 3,
    baths: 2,
    area: "200 sqm",
    image: team,
    featured: false,
    status: "For Sale",
    description: "Spacious family townhouse with garden and modern design.",
  },
];

