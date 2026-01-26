import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";

export type BackendProperty = {
  id: number | string;
  slug?: string;
  title: string;
  property_type: string;
  listing_type?: "sale" | "rent";
  location?: { city?: string; country?: string; region?: string };
  city?: string; // in case backend flattens
  country?: string;
  region?: string;
  price: string;
  currency?: string;
  bedrooms: number;
  bathrooms: number;
  area_sq_m: string;
  image: string;
  featured?: boolean;
  status?: string;
  summary?: string;
  sustainability_score?: number;
  eco_features?: string[];
};

export type Property = {
  id: number | string;
  slug?: string;
  title: string;
  type: string;
  listingType?: "sale" | "rent";
  location: { city: string; country: string };
  region?: string;
  price: string;
  currency?: string;
  beds: number;
  baths: number;
  area: string;
  image: string;
  featured?: boolean;
  status?: string;
  description?: string;
  greenScore?: number;
  ecoFeatures?: string[];
};

function mapBackendProperty(p: BackendProperty): Property {
  const city = p.location?.city ?? p.city ?? "";
  const country = p.location?.country ?? p.country ?? "";
  const region = p.location?.region ?? p.region;
  return {
    id: p.id,
    slug: p.slug,
    title: p.title,
    type: p.property_type,
    listingType: p.listing_type,
    location: { city, country },
    region,
    price: p.price,
    currency: p.currency,
    beds: p.bedrooms,
    baths: p.bathrooms,
    area: p.area_sq_m,
    image: p.image,
    featured: p.featured,
    status: p.status,
    description: p.summary,
    greenScore: p.sustainability_score,
    ecoFeatures: p.eco_features,
  };
}

function toQueryString(params: Record<string, any>) {
  const q = new URLSearchParams();
  Object.entries(params).forEach(([key, value]) => {
    if (value === undefined || value === null) return;
    if (Array.isArray(value)) {
      value.forEach((v) => q.append(key, String(v)));
    } else {
      q.set(key, String(value));
    }
  });
  const qs = q.toString();
  return qs ? `?${qs}` : "";
}

export function useProperties(params: {
  q?: string;
  type?: string; // lowercase type or 'all'
  region?: string; // Ghana region or 'All'
  eco?: string[]; // eco features
}) {
  const { q, type, region, eco } = params;
  const normalized = {
    q: q && q.trim().length ? q.trim() : undefined,
    type: type && type !== "all" ? type : undefined,
    region: region && region !== "All" ? region : undefined,
    eco: eco && eco.length ? eco : undefined,
  };

  return useQuery({
    queryKey: ["properties", normalized],
    queryFn: async () => {
      const qs = toQueryString(normalized);
      const data = await api.get<{ count: number; results: BackendProperty[] }>(`/api/properties/${qs}`);
      return {
        count: data.count,
        results: data.results.map(mapBackendProperty),
      };
    },
    staleTime: 5 * 60 * 1000,
  });
}

export function useProperty(slug: string) {
  return useQuery({
    queryKey: ["property", slug],
    queryFn: () => api.get(`/api/properties/${slug}/`),
    enabled: Boolean(slug),
  });
}
