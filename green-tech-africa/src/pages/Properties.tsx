import Layout from "@/components/layout/Layout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Search, Filter, Phone, Mail } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { getFavorites, toggleFavorite } from "@/lib/favorites";
import { saveSearch } from "@/lib/savedSearches";
import { useToast } from "@/components/ui/use-toast";
import PropertyCard from "@/components/properties/PropertyCard";
import PropertyFilters from "@/components/properties/PropertyFilters";
import { useProperties } from "@/hooks/useProperties";

const Properties = () => {
  const { toast } = useToast();
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedType, setSelectedType] = useState("all");
  // Ghana region selection (All by default). If not Ghana properties, region filter is ignored
  const [selectedRegion, setSelectedRegion] = useState("All");
  // Eco feature checklist selection
  const [ecoFeatures, setEcoFeatures] = useState<string[]>([]);
  const [view, setView] = useState<"grid" | "map">("grid");

  const { data, isLoading, isError, error } = useProperties({
    q: searchTerm,
    type: selectedType,
    region: selectedRegion,
    eco: ecoFeatures,
  });
  const filteredProperties = data ?? [];

  const [favoriteIds, setFavoriteIds] = useState<number[]>([]);
  useEffect(() => setFavoriteIds(getFavorites()), []);

  const toggleFav = (id: number | string) => {
    const num = typeof id === 'number' ? id : Number(id);
    if (Number.isNaN(num)) return;
    const arr = toggleFavorite(num);
    setFavoriteIds(arr);
  };

  const CardWrapper = ({ property }: { property: typeof filteredProperties[0] }) => (
    <PropertyCard
      id={property.id}
      title={property.title}
      type={property.type}
      location={property.location}
      price={property.price}
      beds={property.beds}
      baths={property.baths}
      area={property.area}
      image={property.image}
      featured={property.featured}
      status={property.status}
      description={property.description}
      greenScore={property.greenScore}
      isFavorite={favoriteIds.includes(typeof property.id === 'number' ? property.id : Number(property.id))}
      onToggleFavorite={toggleFav}
    />
  );

  return (
    <Layout>
      {/* Hero Section */}
      <section className="relative py-20 bg-gradient-to-br from-background via-accent/30 to-background">
        <div className="absolute inset-0 bg-grid-pattern opacity-5"></div>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative">
          <div className="text-center max-w-4xl mx-auto">
            <Badge variant="outline" className="mb-4">
              Property Listings
            </Badge>
            <h1 className="text-4xl md:text-6xl font-bold mb-6 bg-gradient-to-r from-foreground to-muted-foreground bg-clip-text text-transparent">
              Find Your Perfect Property
            </h1>
            <p className="text-xl text-muted-foreground mb-8 leading-relaxed">
              Discover premium properties across Africa. From luxury residences to 
              commercial spaces, find your next investment opportunity.
            </p>
          </div>
        </div>
      </section>

      {/* Search & Filter Section */}
      <section className="py-8 bg-background border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col gap-4">
            {/* Row 1: Search + Core Filters (Type, Region) inline */}
            <div className="flex flex-col md:flex-row items-stretch md:items-center gap-3">
              <div className="relative flex-1 min-w-[260px]">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
                <Input
                  placeholder="Search properties by name or location..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
              <div className="flex-1">
                <PropertyFilters
                  orientation="row"
                  className="justify-end"
                  selectedType={selectedType}
                  onTypeChange={setSelectedType}
                  selectedRegion={selectedRegion}
                  onRegionChange={setSelectedRegion}
                  selectedEcoFeatures={ecoFeatures}
                  onEcoFeaturesChange={setEcoFeatures}
                />
              </div>
            </div>

            {/* Row 2: Actions + (Eco-features already wrap under filters if needed) */}
            <div className="flex items-center gap-2 flex-wrap">
              <Button variant="outline" size="icon">
                <Filter className="w-4 h-4" />
              </Button>
              <Button
                variant="outline"
                onClick={() => {
                  saveSearch(`Search ${new Date().toLocaleDateString()}`, {
                    q: searchTerm,
                    type: selectedType,
                    region: selectedRegion,
                    eco: ecoFeatures,
                  });
                  toast({ title: "Search saved (demo)" });
                }}
              >
                Save Search
              </Button>
              <Button
                variant={view === 'map' ? 'default' : 'outline'}
                onClick={() => setView(view === 'map' ? 'grid' : 'map')}
              >
                {view === 'map' ? 'Grid View' : 'Map View'}
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Properties Grid / Map */}
      <section className="py-20 bg-background">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between mb-8">
            <div>
              <h2 className="text-3xl font-bold mb-2">Available Properties</h2>
              <p className="text-muted-foreground">
                {filteredProperties.length} properties found
              </p>
            </div>
          </div>

          {isLoading ? (
            <div className="py-24 text-center text-muted-foreground">Loading properties...</div>
          ) : isError ? (
            <div className="py-24 text-center text-destructive">{(error as any)?.message || "Failed to load properties"}</div>
          ) : view === 'grid' ? (
            filteredProperties.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                {filteredProperties.map((property) => (
                  <CardWrapper key={property.id} property={property} />
                ))}
              </div>
            ) : (
              <div className="text-center py-16">
                <div className="text-muted-foreground mb-4">
                  No properties found matching your criteria.
                </div>
                <Button 
                  variant="outline" 
                  onClick={() => {
                    setSearchTerm("");
                    setSelectedType("all");
                    setSelectedRegion("All");
                    setEcoFeatures([]);
                  }}
                >
                  Clear Filters
                </Button>
              </div>
            )
          ) : (
            <div className="h-[480px] rounded-lg bg-muted flex items-center justify-center text-muted-foreground">
              Map view placeholder — {filteredProperties.length} marker(s)
            </div>
          )}
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-professional text-professional-foreground">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl md:text-4xl font-bold mb-6">
            Can't Find What You're Looking For?
          </h2>
          <p className="text-xl text-professional-foreground/80 mb-8">
            Our property experts are here to help you find the perfect match for your needs.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button variant="success" size="lg">
              <Phone className="mr-2 h-5 w-5" />
              Call Us Now
            </Button>
            <Button variant="outline" size="lg" className="text-professional-foreground border-professional-foreground/30 hover:bg-professional-foreground/10">
              <Mail className="mr-2 h-5 w-5" />
              Email Inquiry
            </Button>
          </div>
        </div>
      </section>
    </Layout>
  );
};

export default Properties;
