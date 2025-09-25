import { useQuery, UseQueryOptions } from "@tanstack/react-query";
import { api } from "@/lib/api";

export type PlanListItem = {
  id: number;
  slug: string;
  name: string;
  summary: string;
  style: string;
  bedrooms: number;
  bathrooms: number;
  floors: number;
  area_sq_m: string;
  base_price: string;
  base_currency: string;
  hero_image: string;
  sustainability_score: number;
  regional_estimates: { region_slug: string; region_name: string; currency: string; estimated_cost: string }[];
};

export type PlanDetail = PlanListItem & {
  description: string;
  has_garage: boolean;
  energy_rating: number;
  water_rating: number;
  specs: Record<string, unknown>;
  tags: string[];
  images: { id: number; image_url: string; caption: string; is_primary: boolean }[];
  features: { id: number; name: string; description: string; category: string; is_sustainable: boolean }[];
  options: { id: number; name: string; description: string; price_delta: string }[];
};

export type PlanFiltersResponse = {
  styles: { value: string; label: string }[];
  regions: { slug: string; name: string }[];
  max_price: string | null;
};

function toQueryString(params: Record<string, unknown>) {
  const qs = new URLSearchParams();
  Object.entries(params).forEach(([key, value]) => {
    if (value === undefined || value === null || value === "") return;
    qs.set(key, String(value));
  });
  const str = qs.toString();
  return str ? `?${str}` : "";
}

export function usePlans(params: Partial<{ q: string; style: string; bedrooms: number | string; bathrooms: number | string; floors: number | string; max_budget: number | string; min_area: number | string; max_area: number | string }>) {
  return useQuery({
    queryKey: ["plans", params],
    queryFn: async () => {
      const { q, ...rest } = params;
      const qs = toQueryString({ ...rest, search: q });
      const data = await api.get<{ count: number; results: PlanListItem[] }>(`/api/plans/${qs}`);
      return data;
    },
    keepPreviousData: true,
  });
}

export function usePlan(slug: string, options?: UseQueryOptions<PlanDetail>) {
  return useQuery<PlanDetail>({
    queryKey: ["plan", slug],
    queryFn: () => api.get<PlanDetail>(`/api/plans/${slug}/`),
    ...options,
  });
}

export function usePlanFilters() {
  return useQuery({
    queryKey: ["plan-filters"],
    queryFn: () => api.get<PlanFiltersResponse>("/api/plans/filters/"),
    staleTime: 5 * 60 * 1000,
  });
}
