import Layout from "@/components/layout/Layout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Search, Filter, Heart, MapPin, Home, Bed, Bath, Square } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { getFavorites, toggleFavorite } from "@/lib/favorites";
import { useToast } from "@/components/ui/use-toast";
import PropertyCard from "@/components/properties/PropertyCard";
import PropertyFilters from "@/components/properties/PropertyFilters";
import { useProperties } from "@/hooks/useProperties";
import { useAuth } from "@/contexts/AuthContext";

const PropertiesCatalog = () => {
  const { toast } = useToast();
  const { isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedType, setSelectedType] = useState("all");
  const [selectedRegion, setSelectedRegion] = useState("All");
  const [ecoFeatures, setEcoFeatures] = useState<string[]>([]);

  const { data, isLoading, isError, error } = useProperties({
    q: searchTerm,
    type: selectedType,
    region: selectedRegion,
    eco: ecoFeatures,
  });
  const filteredProperties = data?.results ?? [];

  const [favoriteIds, setFavoriteIds] = useState<number[]>([]);
  useEffect(() => setFavoriteIds(getFavorites()), []);

  const toggleFav = (id: number | string) => {
    const num = typeof id === 'number' ? id : Number(id);
    if (Number.isNaN(num)) return;
    const arr = toggleFavorite(num);
    setFavoriteIds(arr);
    toast({
      title: arr.includes(num) ? "Added to favorites" : "Removed from favorites",
    });
  };

  const handleRequestProperty = (propertyId: number) => {
    // Navigate to create request with property pre-selected
    navigate(`/account/requests/new?property=${propertyId}`);
  };

  return (
    <Layout>
      <div className="min-h-screen bg-background">
        {/* Hero Section */}
        <section className="py-12 bg-gradient-to-br from-primary/5 via-background to-background">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-8">
              <Badge variant="outline" className="mb-4">
                <Home className="w-3 h-3 mr-1" />
                Property Catalog
              </Badge>
              <h1 className="text-4xl font-bold mb-4">Browse Available Properties</h1>
              <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
                Explore our curated selection of properties. Click "Request This Property" to submit your interest.
              </p>
            </div>

            {/* Search and Filters */}
            <div className="flex flex-col md:flex-row gap-4 mb-6">
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-5 h-5" />
                <Input
                  placeholder="Search properties by name or location..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
              <PropertyFilters
                selectedType={selectedType}
                onTypeChange={setSelectedType}
                selectedRegion={selectedRegion}
                onRegionChange={setSelectedRegion}
                selectedEcoFeatures={ecoFeatures}
                onEcoFeaturesChange={setEcoFeatures}
                orientation="row"
              />
            </div>
          </div>
        </section>

        {/* Properties Grid */}
        <section className="py-8">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-semibold">
                {filteredProperties.length} {filteredProperties.length === 1 ? 'Property' : 'Properties'} Available
              </h2>
              <Button variant="outline" size="sm" asChild>
                <Link to="/account/favorites">
                  <Heart className="w-4 h-4 mr-2" />
                  View Favorites
                </Link>
              </Button>
            </div>

            {isLoading && (
              <div className="text-center py-12">
                <p className="text-muted-foreground">Loading properties...</p>
              </div>
            )}

            {isError && (
              <div className="text-center py-12">
                <p className="text-destructive">Error loading properties. Please try again.</p>
              </div>
            )}

            {!isLoading && !isError && filteredProperties.length === 0 && (
              <div className="text-center py-12">
                <p className="text-muted-foreground">No properties found matching your criteria.</p>
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredProperties.map((property) => (
                <div key={property.id} className="relative">
                  <Card className="group hover:shadow-elegant smooth-transition overflow-hidden">
                    <div className="relative overflow-hidden">
                      {property.featured_image && (
                        <img
                          src={property.featured_image}
                          alt={property.title}
                          className="w-full h-48 object-cover group-hover:scale-105 smooth-transition"
                        />
                      )}
                      <div className="absolute top-4 right-4">
                        <Button
                          size="icon"
                          variant="ghost"
                          onClick={() => toggleFav(property.id)}
                          className="bg-background/80 hover:bg-background"
                        >
                          <Heart className={`w-4 h-4 ${favoriteIds.includes(property.id) ? 'fill-current text-red-500' : ''}`} />
                        </Button>
                      </div>
                      <div className="absolute bottom-4 left-4">
                        <div className="text-2xl font-bold text-white drop-shadow-lg">
                          {property.currency_code} {Number(property.price).toLocaleString()}
                        </div>
                      </div>
                    </div>

                    <CardHeader>
                      <div className="flex items-start justify-between">
                        <div>
                          <CardTitle className="text-xl mb-2">{property.title}</CardTitle>
                          <div className="flex items-center space-x-1 text-sm text-muted-foreground">
                            <MapPin className="w-4 h-4" />
                            <span>
                              {typeof property.location === 'string' 
                                ? property.location 
                                : property.location?.city && property.location?.country
                                ? `${property.location.city}, ${property.location.country}`
                                : 'Location not specified'}
                            </span>
                          </div>
                        </div>
                        {property.type && <Badge variant="outline">{property.type}</Badge>}
                      </div>
                    </CardHeader>

                    <CardContent>
                      <div className="flex items-center justify-between text-sm text-muted-foreground mb-4">
                        {property.bedrooms > 0 && (
                          <div className="flex items-center space-x-1">
                            <Bed className="w-4 h-4" />
                            <span>{property.bedrooms} bed{property.bedrooms > 1 ? 's' : ''}</span>
                          </div>
                        )}
                        {property.bathrooms > 0 && (
                          <div className="flex items-center space-x-1">
                            <Bath className="w-4 h-4" />
                            <span>{property.bathrooms} bath{property.bathrooms > 1 ? 's' : ''}</span>
                          </div>
                        )}
                        {property.area && (
                          <div className="flex items-center space-x-1">
                            <Square className="w-4 h-4" />
                            <span>{property.area} m²</span>
                          </div>
                        )}
                      </div>

                      <div className="flex gap-2">
                        <Button variant="outline" size="sm" className="flex-1" asChild>
                          <Link to={`/account/properties/${property.slug || property.id}`}>View Details</Link>
                        </Button>
                        <Button size="sm" className="flex-1" onClick={() => handleRequestProperty(property.id)}>
                          Request This
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              ))}
            </div>
          </div>
        </section>
      </div>
    </Layout>
  );
};

export default PropertiesCatalog;
