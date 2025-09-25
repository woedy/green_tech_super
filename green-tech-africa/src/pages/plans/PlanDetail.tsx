import Layout from "@/components/layout/Layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { useParams, Link } from "react-router-dom";
import { usePlan } from "@/hooks/usePlans";

const PlanDetail = () => {
  const { slug = "" } = useParams();
  const { data: plan, isLoading, isError } = usePlan(slug, { enabled: Boolean(slug) });

  const heroImage = plan?.images.find((img) => img.is_primary)?.image_url ?? plan?.hero_image ?? "";

  if (isLoading) {
    return (
      <Layout>
        <section className="py-10">
          <div className="max-w-5xl mx-auto px-4 space-y-6">
            <Skeleton className="h-10 w-2/3" />
            <Skeleton className="h-80 w-full" />
            <Skeleton className="h-40 w-full" />
          </div>
        </section>
      </Layout>
    );
  }

  if (isError || !plan) {
    return (
      <Layout>
        <section className="py-16 text-center text-destructive">
          Failed to load plan.
        </section>
      </Layout>
    );
  }

  const regionalEstimates = plan.regional_estimates.map((estimate) => ({
    label: `${estimate.region_name}`,
    value: `${estimate.currency} ${Number(estimate.estimated_cost).toLocaleString()}`,
  }));

  return (
    <Layout>
      <section className="py-10 bg-gradient-to-br from-background via-accent/30 to-background">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl md:text-4xl font-bold">{plan.name}</h1>
              <div className="text-muted-foreground flex flex-wrap gap-2">
                <Badge variant="outline">{plan.style}</Badge>
                <span>{plan.bedrooms} beds</span>
                <span>{plan.bathrooms} baths</span>
                <span>{plan.area_sq_m} sqm</span>
              </div>
            </div>
            <div className="text-right">
              <div className="text-sm text-muted-foreground">Starting at</div>
              <div className="text-2xl font-semibold">{plan.base_currency} {Number(plan.base_price).toLocaleString()}</div>
              <Button asChild className="mt-2"><Link to={`/plans/${plan.slug}/request`}>Request to Build</Link></Button>
            </div>
          </div>
        </div>
      </section>

      <section className="py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="space-y-6 lg:col-span-2">
            <Card>
              <CardContent className="p-0">
                <img src={heroImage} alt={plan.name} className="w-full h-80 object-cover rounded-t-lg" />
              </CardContent>
            </Card>
            <Card>
              <CardHeader><CardTitle>About this plan</CardTitle></CardHeader>
              <CardContent>
                <p className="text-muted-foreground whitespace-pre-line">{plan.description}</p>
              </CardContent>
            </Card>
            {plan.options.length > 0 && (
              <Card>
                <CardHeader><CardTitle>Options</CardTitle></CardHeader>
                <CardContent className="space-y-2">
                  {plan.options.map((option) => (
                    <div key={option.id} className="flex items-center justify-between p-3 rounded-md bg-muted/30 text-sm">
                      <div>{option.name}</div>
                      <div>+ {plan.base_currency} {Number(option.price_delta).toLocaleString()}</div>
                    </div>
                  ))}
                </CardContent>
              </Card>
            )}
          </div>
          <div className="space-y-6">
            <Card>
              <CardHeader><CardTitle>Specs</CardTitle></CardHeader>
              <CardContent className="grid grid-cols-2 gap-3 text-sm">
                <div><span className="text-muted-foreground">Style</span><div>{plan.style}</div></div>
                <div><span className="text-muted-foreground">Bedrooms</span><div>{plan.bedrooms}</div></div>
                <div><span className="text-muted-foreground">Bathrooms</span><div>{plan.bathrooms}</div></div>
                <div><span className="text-muted-foreground">Floors</span><div>{plan.floors}</div></div>
                <div><span className="text-muted-foreground">Area</span><div>{plan.area_sq_m} sqm</div></div>
                <div><span className="text-muted-foreground">Garage</span><div>{plan.has_garage ? "Yes" : "No"}</div></div>
                <div><span className="text-muted-foreground">Energy rating</span><div>{plan.energy_rating}/5</div></div>
                <div><span className="text-muted-foreground">Water rating</span><div>{plan.water_rating}/5</div></div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader><CardTitle>Regions & estimated cost</CardTitle></CardHeader>
              <CardContent className="space-y-2">
                {regionalEstimates.map((estimate) => (
                  <div key={estimate.label} className="flex items-center justify-between text-sm">
                    <span>{estimate.label}</span>
                    <span className="font-medium">{estimate.value}</span>
                  </div>
                ))}
              </CardContent>
            </Card>
            {plan.features.length > 0 && (
              <Card>
                <CardHeader><CardTitle>Sustainability features</CardTitle></CardHeader>
                <CardContent className="space-y-2 text-sm">
                  {plan.features.map((feature) => (
                    <div key={feature.id}>
                      <div className="font-medium">{feature.name}</div>
                      <div className="text-muted-foreground">{feature.description}</div>
                    </div>
                  ))}
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </section>
    </Layout>
  );
};

export default PlanDetail;
