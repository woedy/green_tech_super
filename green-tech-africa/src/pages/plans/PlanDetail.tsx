import Layout from "@/components/layout/Layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useParams, Link } from "react-router-dom";
import { PLANS } from "@/mocks/plans";

const PlanDetail = () => {
  const { slug } = useParams();
  const plan = PLANS.find((p) => p.slug === slug) ?? PLANS[0];

  return (
    <Layout>
      <section className="py-10 bg-gradient-to-br from-background via-accent/30 to-background">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl md:text-4xl font-bold">{plan.name}</h1>
              <div className="text-muted-foreground">{plan.style} • {plan.beds} beds • {plan.baths} baths • {plan.areaSqm} sqm</div>
            </div>
            <div className="text-right">
              <div className="text-sm text-muted-foreground">Starting at</div>
              <div className="text-2xl font-semibold">${plan.basePrice.toLocaleString()}</div>
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
                <img src={plan.images[0]} alt={plan.name} className="w-full h-80 object-cover rounded-t-lg" />
              </CardContent>
            </Card>
            <Card>
              <CardHeader><CardTitle>About this plan</CardTitle></CardHeader>
              <CardContent>
                <p className="text-muted-foreground">{plan.description}</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader><CardTitle>Options</CardTitle></CardHeader>
              <CardContent className="space-y-2">
                {plan.options.map((o, i) => (
                  <div key={i} className="flex items-center justify-between p-3 rounded-md bg-muted/30 text-sm">
                    <div>{o.name}</div>
                    <div>+ ${o.priceDelta.toLocaleString()}</div>
                  </div>
                ))}
              </CardContent>
            </Card>
          </div>
          <div className="space-y-6">
            <Card>
              <CardHeader><CardTitle>Specs</CardTitle></CardHeader>
              <CardContent className="grid grid-cols-2 gap-3 text-sm">
                <div><span className="text-muted-foreground">Style</span><div>{plan.style}</div></div>
                <div><span className="text-muted-foreground">Bedrooms</span><div>{plan.beds}</div></div>
                <div><span className="text-muted-foreground">Bathrooms</span><div>{plan.baths}</div></div>
                <div><span className="text-muted-foreground">Floors</span><div>{plan.floors}</div></div>
                <div><span className="text-muted-foreground">Area</span><div>{plan.areaSqm} sqm</div></div>
                <div><span className="text-muted-foreground">Garage</span><div>{plan.hasGarage ? "Yes" : "No"}</div></div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader><CardTitle>Regions</CardTitle></CardHeader>
              <CardContent className="flex flex-wrap gap-2">
                {plan.regionsAvailable.map((r) => (
                  <Badge key={r} variant="secondary">{r}</Badge>
                ))}
              </CardContent>
            </Card>
          </div>
        </div>
      </section>
    </Layout>
  );
};

export default PlanDetail;

