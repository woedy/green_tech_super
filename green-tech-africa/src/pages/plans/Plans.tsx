import Layout from "@/components/layout/Layout";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { usePlans, usePlanFilters } from "@/hooks/usePlans";
import { Search, Filter, CheckCircle2 } from "lucide-react";
import { Link, useSearchParams, useLocation } from "react-router-dom";
import { useEffect, useState } from "react";

const skeletonCards = Array.from({ length: 6 }).map((_, index) => (
  <Card key={index} className="overflow-hidden shadow-medium">
    <Skeleton className="h-44 w-full" />
    <CardContent className="p-6 space-y-3">
      <Skeleton className="h-6 w-2/3" />
      <Skeleton className="h-4 w-1/2" />
      <Skeleton className="h-8 w-full" />
      <div className="flex gap-2">
        <Skeleton className="h-10 w-full" />
        <Skeleton className="h-10 w-full" />
      </div>
    </CardContent>
  </Card>
));

const Plans = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const location = useLocation();
  const [showSuccess, setShowSuccess] = useState(false);
  
  const q = searchParams.get("q") ?? "";
  const style = searchParams.get("style") ?? "all";
  const beds = searchParams.get("beds") ?? "all";
  const maxBudget = searchParams.get("maxBudget") ?? "";

  // Show success message if redirected after request submission
  useEffect(() => {
    if (location.state?.requestSubmitted) {
      setShowSuccess(true);
      // Clear the state
      window.history.replaceState({}, document.title);
      // Hide after 10 seconds
      const timer = setTimeout(() => setShowSuccess(false), 10000);
      return () => clearTimeout(timer);
    }
  }, [location]);

  const { data: filters } = usePlanFilters();
  const { data, isLoading, isError, error } = usePlans({
    style: style !== "all" ? style : undefined,
    bedrooms: beds !== "all" ? beds : undefined,
    max_budget: maxBudget || undefined,
    q: q || undefined,
  } as any);

  const plans = data?.results ?? [];

  const updateParams = (next: Record<string, string | null>) => {
    const merged = new URLSearchParams(searchParams);
    Object.entries(next).forEach(([key, value]) => {
      if (!value) {
        merged.delete(key);
      } else {
        merged.set(key, value);
      }
    });
    setSearchParams(merged);
  };

  const styles = filters?.styles ?? [];

  return (
    <Layout>
      <section className="relative py-14 bg-gradient-to-br from-background via-accent/30 to-background border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-3xl">
            <div className="mb-2 inline-flex items-center rounded-full bg-primary/10 px-3 py-1 text-xs font-medium text-primary">Customer Plans Flow</div>
            <h1 className="text-4xl md:text-5xl font-bold mb-3">Building Plans</h1>
            <p className="text-muted-foreground text-lg">Explore modern, efficient designs and move directly to request-to-build.</p>
          </div>
        </div>
      </section>

      <section className="py-8 border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {showSuccess && (
            <Alert className="mb-6 border-green-500 bg-green-50 dark:bg-green-950">
              <CheckCircle2 className="h-4 w-4 text-green-600" />
              <AlertDescription className="text-green-800 dark:text-green-200">
                Your build request has been submitted successfully! Our team will review it and contact you shortly. 
                Check your email for confirmation details.
              </AlertDescription>
            </Alert>
          )}
          <div className="flex flex-col md:flex-row gap-3 items-center">
            <div className="relative w-full md:flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                value={q}
                onChange={(e) => updateParams({ q: e.target.value || null })}
                className="pl-10"
                placeholder="Search plans..."
              />
            </div>
            <div className="flex gap-2 w-full md:w-auto">
              <Select value={style} onValueChange={(value) => updateParams({ style: value === "all" ? null : value })}>
                <SelectTrigger className="w-40"><SelectValue placeholder="Style" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Styles</SelectItem>
                  {styles.map((item) => (
                    <SelectItem key={item.value} value={item.value}>{item.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select value={beds} onValueChange={(value) => updateParams({ beds: value === "all" ? null : value })}>
                <SelectTrigger className="w-32"><SelectValue placeholder="Bedrooms" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Any Beds</SelectItem>
                  {[2, 3, 4, 5].map((count) => (
                    <SelectItem key={count} value={String(count)}>{count}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Input
                value={maxBudget}
                onChange={(e) => updateParams({ maxBudget: e.target.value || null })}
                className="w-32"
                placeholder="Max budget"
                type="number"
              />
              <Button variant="outline" size="icon"><Filter className="w-4 h-4" /></Button>
            </div>
          </div>
        </div>
      </section>

      <section className="py-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {isLoading && <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">{skeletonCards}</div>}
          {isError && (
            <div className="py-16 text-center text-destructive">{(error as Error)?.message ?? "Failed to load plans"}</div>
          )}
          {!isLoading && !isError && (
            <>
              {plans.length === 0 ? (
                <div className="text-center py-16 space-y-4">
                  <div className="text-muted-foreground">No plans match your filters.</div>
                  <Button
                    variant="outline"
                    onClick={() => setSearchParams(new URLSearchParams())}
                  >
                    Reset filters
                  </Button>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                  {plans.map((plan) => (
                    <Card key={plan.id} className="group overflow-hidden border-border/70 shadow-soft smooth-transition hover:-translate-y-0.5 hover:shadow-medium">
                      <div className="relative overflow-hidden">
                        <img src={plan.hero_image} alt={plan.name} className="w-full h-44 object-cover group-hover:scale-105 smooth-transition" />
                        <div className="absolute top-4 left-4">
                          <Badge variant="secondary">{plan.style}</Badge>
                        </div>
                      </div>
                      <CardContent className="p-6 space-y-3">
                        <div>
                          <h3 className="text-lg font-semibold group-hover:text-primary smooth-transition">{plan.name}</h3>
                          <div className="text-sm text-muted-foreground">{plan.bedrooms} beds • {plan.bathrooms} baths • {plan.area_sq_m} sqm</div>
                        </div>
                        <div className="font-medium">
                          Starting at {plan.base_currency} {Number(plan.base_price).toLocaleString()}
                        </div>
                        <div className="flex gap-2">
                          <Button asChild variant="outline" className="flex-1">
                            <Link to={`/plans/${plan.slug}`}>View Details</Link>
                          </Button>
                          <Button asChild className="flex-1">
                            <Link to={`/plans/${plan.slug}/request`}>Request to Build</Link>
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </>
          )}
        </div>
      </section>
    </Layout>
  );
};

export default Plans;
