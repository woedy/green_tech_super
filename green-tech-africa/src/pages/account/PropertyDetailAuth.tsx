import Layout from "@/components/layout/Layout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { MapPin, Bed, Bath, Square, ArrowLeft, Leaf, Heart, Share2 } from "lucide-react";
import { Link, useParams, useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { useProperty } from "@/hooks/useProperties";
import { useToast } from "@/components/ui/use-toast";
import { useState, useEffect } from "react";
import { getFavorites, toggleFavorite } from "@/lib/favorites";
import { api } from "@/lib/api";

const PropertyDetailAuth = () => {
  const { id = "" } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const { data: property, isLoading, isError } = useProperty(id);
  const [favoriteIds, setFavoriteIds] = useState<number[]>([]);

  // Check for existing transaction
  const { data: transactionCheck } = useQuery({
    queryKey: ["property-transaction-check", property?.id],
    queryFn: () => api.get(`/api/transactions/check-property/${property?.id}/`),
    enabled: !!property?.id,
  });

  const existingTransaction = transactionCheck?.has_active_transaction 
    ? transactionCheck.transaction 
    : null;

  useEffect(() => setFavoriteIds(getFavorites()), []);

  const isFavorite = property?.id ? favoriteIds.includes(Number(property.id)) : false;

  const handleToggleFavorite = () => {
    if (!property?.id) return;
    const arr = toggleFavorite(Number(property.id));
    setFavoriteIds(arr);
    toast({
      title: arr.includes(Number(property.id)) ? "Added to favorites" : "Removed from favorites",
    });
  };

  const handleRequestProperty = (transactionType: 'rent' | 'lease' | 'buy') => {
    if (!property?.id) {
      toast({
        title: "Error",
        description: "Property information not loaded. Please try again.",
        variant: "destructive",
      });
      return;
    }
    navigate(`/account/property-transactions/new?property=${property.id}&type=${transactionType}`);
  };

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
        <section className="py-16 text-center">
          <p className="text-destructive mb-4">Failed to load property details.</p>
          <Button asChild>
            <Link to="/account/properties">Back to Properties</Link>
          </Button>
        </section>
      </Layout>
    );
  }

  const hero = property.featured_image || property.image || property.hero_image_url;
  const formattedPrice = property.currency_code 
    ? `${property.currency_code} ${Number(property.price).toLocaleString()}`
    : property.currency
    ? `${property.currency} ${Number(property.price).toLocaleString()}`
    : `${Number(property.price).toLocaleString()}`;
  const locationText = property.city && property.region?.name 
    ? `${property.city}, ${property.region.name}`
    : property.location || 'Location not specified';

  return (
    <Layout>
      <section className="py-4 bg-accent/20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center space-x-2 text-sm">
            <Link to="/account/properties" className="text-muted-foreground hover:text-primary smooth-transition">
              Properties Catalog
            </Link>
            <span className="text-muted-foreground">/</span>
            <span className="text-foreground">{property.title}</span>
          </div>
        </div>
      </section>

      <section className="py-8 bg-background">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col lg:flex-row items-start justify-between gap-6 mb-6">
            <div className="flex-1">
              <div className="flex items-center gap-3 mb-4">
                <Link to="/account/properties">
                  <Button variant="outline" size="sm">
                    <ArrowLeft className="w-4 h-4 mr-2" />
                    Back to Catalog
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
                <span>{locationText}</span>
              </div>

              <div className="text-3xl md:text-4xl font-bold text-primary mb-6">
                {formattedPrice}
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex flex-col gap-3 w-full lg:w-auto">
              {existingTransaction ? (
                // Show existing transaction status
                <Card className="border-primary">
                  <CardContent className="pt-4">
                    <div className="space-y-3">
                      <div>
                        <p className="text-sm font-medium mb-1">Active Request</p>
                        <Badge variant="default">
                          {existingTransaction.transaction_type.toUpperCase()} - {existingTransaction.status.replace('_', ' ').toUpperCase()}
                        </Badge>
                      </div>
                      <p className="text-sm text-muted-foreground">
                        You already have an active {existingTransaction.transaction_type} request for this property.
                      </p>
                      <div className="flex flex-col gap-2">
                        <Button asChild size="sm" className="w-full">
                          <Link to={`/account/property-transactions/${existingTransaction.id}`}>
                            View Request Details
                          </Link>
                        </Button>
                        {existingTransaction.status === 'draft' || existingTransaction.status === 'submitted' ? (
                          <Button 
                            variant="outline" 
                            size="sm" 
                            className="w-full"
                            onClick={() => navigate(`/account/property-transactions/${existingTransaction.id}`)}
                          >
                            Withdraw Request
                          </Button>
                        ) : null}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ) : (
                // Show request buttons if no active transaction
                <>
                  {property.listing_type === 'rent' ? (
                    <>
                      <Button size="lg" className="w-full lg:w-auto" onClick={() => handleRequestProperty('rent')}>
                        Request to Rent
                      </Button>
                      <Button size="lg" variant="outline" className="w-full lg:w-auto" onClick={() => handleRequestProperty('lease')}>
                        Request to Lease
                      </Button>
                    </>
                  ) : (
                    <Button size="lg" className="w-full lg:w-auto" onClick={() => handleRequestProperty('buy')}>
                      Request to Buy
                    </Button>
                  )}
                </>
              )}
              <div className="flex gap-2">
                <Button 
                  variant="outline" 
                  size="lg" 
                  className="flex-1"
                  onClick={handleToggleFavorite}
                >
                  <Heart className={`w-4 h-4 mr-2 ${isFavorite ? 'fill-current' : ''}`} />
                  {isFavorite ? 'Saved' : 'Save'}
                </Button>
                <Button variant="outline" size="lg">
                  <Share2 className="w-4 h-4" />
                </Button>
              </div>
            </div>
          </div>

          {/* Hero Image */}
          {hero && (
            <div className="mb-8 rounded-lg overflow-hidden">
              <img
                src={hero}
                alt={property.title}
                className="w-full h-[400px] md:h-[500px] object-cover"
              />
            </div>
          )}

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Main Content */}
            <div className="lg:col-span-2 space-y-6">
              {/* Key Features */}
              <Card>
                <CardHeader>
                  <CardTitle>Property Features</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    {property.bedrooms && (
                      <div className="flex items-center gap-2">
                        <Bed className="w-5 h-5 text-muted-foreground" />
                        <div>
                          <div className="font-semibold">{property.bedrooms}</div>
                          <div className="text-xs text-muted-foreground">Bedrooms</div>
                        </div>
                      </div>
                    )}
                    {property.bathrooms && (
                      <div className="flex items-center gap-2">
                        <Bath className="w-5 h-5 text-muted-foreground" />
                        <div>
                          <div className="font-semibold">{property.bathrooms}</div>
                          <div className="text-xs text-muted-foreground">Bathrooms</div>
                        </div>
                      </div>
                    )}
                    {property.area && (
                      <div className="flex items-center gap-2">
                        <Square className="w-5 h-5 text-muted-foreground" />
                        <div>
                          <div className="font-semibold">{property.area} m²</div>
                          <div className="text-xs text-muted-foreground">Area</div>
                        </div>
                      </div>
                    )}
                    {property.type && (
                      <div className="flex items-center gap-2">
                        <div>
                          <div className="font-semibold">{property.type}</div>
                          <div className="text-xs text-muted-foreground">Type</div>
                        </div>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>

              {/* Description */}
              {property.description && (
                <Card>
                  <CardHeader>
                    <CardTitle>Description</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-muted-foreground whitespace-pre-line">
                      {property.description}
                    </p>
                  </CardContent>
                </Card>
              )}

              {/* Eco Features */}
              {property.eco_features && property.eco_features.length > 0 && (
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Leaf className="w-5 h-5 text-green-600" />
                      Sustainable Features
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="flex flex-wrap gap-2">
                      {property.eco_features.map((feature: string, idx: number) => (
                        <Badge key={idx} variant="secondary" className="bg-green-50 text-green-700">
                          {feature}
                        </Badge>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>

            {/* Sidebar */}
            <div className="space-y-6">
              <Card className="sticky top-20">
                <CardHeader>
                  <CardTitle>Ready to proceed?</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {existingTransaction ? (
                    // Show existing transaction info
                    <>
                      <div className="p-3 bg-primary/10 rounded-lg">
                        <p className="text-sm font-medium mb-2">Active Request</p>
                        <Badge variant="default" className="mb-2">
                          {existingTransaction.transaction_type.toUpperCase()}
                        </Badge>
                        <p className="text-xs text-muted-foreground">
                          Status: {existingTransaction.status.replace('_', ' ').toUpperCase()}
                        </p>
                      </div>
                      <p className="text-sm text-muted-foreground">
                        You have an active request for this property. View details or withdraw your request.
                      </p>
                      <Button className="w-full" size="lg" asChild>
                        <Link to={`/account/property-transactions/${existingTransaction.id}`}>
                          View Request Details
                        </Link>
                      </Button>
                    </>
                  ) : (
                    // Show request buttons
                    <>
                      <p className="text-sm text-muted-foreground">
                        Submit a request to express your interest in this property. Our team will contact you shortly.
                      </p>
                      {property.listing_type === 'rent' ? (
                        <>
                          <Button className="w-full" size="lg" onClick={() => handleRequestProperty('rent')}>
                            Request to Rent
                          </Button>
                          <Button variant="outline" className="w-full" size="lg" onClick={() => handleRequestProperty('lease')}>
                            Request to Lease
                          </Button>
                        </>
                      ) : (
                        <Button className="w-full" size="lg" onClick={() => handleRequestProperty('buy')}>
                          Request to Buy
                        </Button>
                      )}
                    </>
                  )}
                  <Button variant="outline" className="w-full" asChild>
                    <Link to="/account/property-transactions">View All My Requests</Link>
                  </Button>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </section>
    </Layout>
  );
};

export default PropertyDetailAuth;
