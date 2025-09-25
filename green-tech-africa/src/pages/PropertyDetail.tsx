import Layout from "@/components/layout/Layout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { MapPin, Bed, Bath, Square, ArrowLeft, Leaf } from "lucide-react";
import { Link, useParams } from "react-router-dom";
import { useProperty } from "@/hooks/useProperties";

const PropertyDetail = () => {
  const { id = "" } = useParams();
  const { data: property, isLoading, isError } = useProperty(id);

  if (isLoading) {
    return (
      <Layout>
        <section className="py-10">
          <div className="max-w-6xl mx-auto px-4 space-y-6">
            <Skeleton className="h-10 w-2/3" />
            <Skeleton className="h-96 w-full" />
            <Skeleton className="h-48 w-full" />
          </div>
        </section>
      </Layout>
    );
  }

  if (isError || !property) {
    return (
      <Layout>
        <section className="py-16 text-center text-destructive">Failed to load property.</section>
      </Layout>
    );
  }

  const hero = property.images?.find((img: any) => img.is_primary)?.image_url ?? property.hero_image_url;
  const formattedPrice = `${property.currency} ${Number(property.price).toLocaleString()}`;

  return (
    <Layout>
      <section className="py-4 bg-accent/20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center space-x-2 text-sm">
            <Link to="/properties" className="text-muted-foreground hover:text-primary smooth-transition">
              Properties
            </Link>
            <span className="text-muted-foreground">/</span>
            <span className="text-foreground">{property.title}</span>
          </div>
        </div>
      </section>

      <section className="py-8 bg-background">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col lg:flex-row items-start justify-between gap-6">
            <div className="flex-1">
              <div className="flex items-center gap-3 mb-4">
                <Link to="/properties">
                  <Button variant="outline" size="sm">
                    <ArrowLeft className="w-4 h-4 mr-2" />
                    Back to Properties
                  </Button>
                </Link>
                <Badge variant="secondary">{property.status?.toUpperCase()}</Badge>
                {property.featured && (
                  <Badge variant="secondary">Featured</Badge>
                )}
              </div>

              <h1 className="text-3xl md:text-4xl font-bold mb-2">{property.title}</h1>
              <div className="flex items-center space-x-1 text-muted-foreground mb-4">
                <MapPin className="w-4 h-4" />
                <span>{property.city}, {property.region.name}</span>
              </div>

              <div className="text-3xl md:text-4xl font-bold text-primary mb-6">
                {formattedPrice}
              </div>
            </div>

            <div className="flex gap-2">
              <Button variant="outline" size="sm" asChild>
                <Link to={`/properties/${property.slug}/inquiry`}>Schedule Viewing</Link>
              </Button>
              <Button variant="default" size="sm" asChild>
                <Link to="/account/messages">Contact Agent</Link>
              </Button>
            </div>
          </div>
        </div>
      </section>

      <section className="py-8 bg-background">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
            <div className="lg:col-span-3">
              <img
                src={hero}
                alt={property.title}
                className="w-full h-96 lg:h-[500px] object-cover rounded-lg"
              />
            </div>
            <div className="grid grid-cols-2 lg:grid-cols-1 gap-4">
              {property.images?.filter((img: any) => !img.is_primary).slice(0, 3).map((image: any, index: number) => (
                <img
                  key={index}
                  src={image.image_url}
                  alt={`${property.title} ${index + 2}`}
                  className="w-full h-24 lg:h-[160px] object-cover rounded-lg"
                />
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className="py-8 bg-background">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2 space-y-8">
              <Card>
                <CardHeader>
                  <CardTitle>Property Details</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground whitespace-pre-line">{property.description}</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Sustainability Highlights</CardTitle>
                </CardHeader>
                <CardContent className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
                  {property.eco_features?.map((feature: string) => (
                    <div key={feature} className="flex items-start gap-2">
                      <Leaf className="w-4 h-4 text-success mt-0.5" />
                      <span>{feature}</span>
                    </div>
                  ))}
                </CardContent>
              </Card>

              {property.amenities?.length ? (
                <Card>
                  <CardHeader><CardTitle>Amenities</CardTitle></CardHeader>
                  <CardContent>
                    <ul className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-sm">
                      {property.amenities.map((amenity: string) => (
                        <li key={amenity}>• {amenity}</li>
                      ))}
                    </ul>
                  </CardContent>
                </Card>
              ) : null}
            </div>

            <div className="space-y-6">
              <Card>
                <CardHeader><CardTitle>Key Specs</CardTitle></CardHeader>
                <CardContent className="grid grid-cols-2 gap-3 text-sm">
                  <div><span className="text-muted-foreground">Type</span><div>{property.property_type}</div></div>
                  <div><span className="text-muted-foreground">Bedrooms</span><div>{property.bedrooms}</div></div>
                  <div><span className="text-muted-foreground">Bathrooms</span><div>{property.bathrooms}</div></div>
                  <div><span className="text-muted-foreground">Internal area</span><div>{property.area_sq_m} sqm</div></div>
                  {property.plot_sq_m && (
                    <div><span className="text-muted-foreground">Plot</span><div>{property.plot_sq_m} sqm</div></div>
                  )}
                  <div><span className="text-muted-foreground">Energy</span><div>{property.energy_rating}/5</div></div>
                  <div><span className="text-muted-foreground">Water</span><div>{property.water_rating}/5</div></div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader><CardTitle>Region</CardTitle></CardHeader>
                <CardContent className="space-y-2 text-sm">
                  <div><strong>{property.region.name}</strong></div>
                  <div className="text-muted-foreground">Cost multiplier: {property.region.cost_multiplier}</div>
                  <div className="text-muted-foreground">Country: {property.country}</div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </section>
    </Layout>
  );
};

export default PropertyDetail;
