import Layout from "@/components/layout/Layout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { 
  MapPin, 
  Bed, 
  Bath, 
  Square, 
  Heart, 
  Search,
  Filter,
  ArrowRight,
  Phone,
  Mail
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { PROPERTIES } from "@/mocks/properties";
import { getFavorites, toggleFavorite } from "@/lib/favorites";
import { saveSearch } from "@/lib/savedSearches";
import { useToast } from "@/components/ui/use-toast";

const Properties = () => {
  const { toast } = useToast();
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedType, setSelectedType] = useState("all");
  const [selectedLocation, setSelectedLocation] = useState("all");
  const [view, setView] = useState<"grid" | "map">("grid");

  const properties = PROPERTIES.map((p) => ({
    id: p.id,
    title: p.title,
    type: p.type,
    location: `${p.location.city, p.location.city}, ${p.location.country}`,
    price: p.price,
    beds: p.beds,
    baths: p.baths,
    area: p.area,
    image: p.image,
    featured: p.featured,
    status: p.status,
    description: p.description,
  }));

  const filteredProperties = useMemo(() => properties.filter(property => {
    const matchesSearch = property.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         property.location.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesType = selectedType === "all" || property.type.toLowerCase() === selectedType.toLowerCase();
    const matchesLocation = selectedLocation === "all" || property.location.includes(selectedLocation);
    
    return matchesSearch && matchesType && matchesLocation;
  }), [properties, searchTerm, selectedType, selectedLocation]);

  const [favoriteIds, setFavoriteIds] = useState<number[]>([]);
  useEffect(() => setFavoriteIds(getFavorites()), []);

  const toggleFav = (id: number) => {
    const arr = toggleFavorite(id);
    setFavoriteIds(arr);
  };

  const PropertyCard = ({ property }: { property: typeof properties[0] }) => (
    <Card className="group hover:shadow-elegant smooth-transition overflow-hidden">
      <div className="relative overflow-hidden">
        <img 
          src={property.image} 
          alt={property.title}
          className="w-full h-48 object-cover group-hover:scale-105 smooth-transition"
        />
        <div className="absolute top-4 left-4 flex gap-2">
          <Badge variant={property.status === "For Sale" ? "default" : "secondary"}>
            {property.status}
          </Badge>
          {property.featured && (
            <Badge variant="secondary">Featured</Badge>
          )}
        </div>
        <div className="absolute top-4 right-4">
          <Button size="icon" variant="ghost" onClick={() => toggleFav(property.id)} className="bg-background/80 hover:bg-background">
            <Heart className={`w-4 h-4 ${favoriteIds.includes(property.id) ? 'text-red-500' : ''}`} />
          </Button>
        </div>
        <div className="absolute bottom-4 left-4">
          <div className="text-2xl font-bold text-white drop-shadow-lg">
            {property.price}
          </div>
        </div>
      </div>
      
      <CardHeader>
        <div className="flex items-start justify-between">
          <div>
            <CardTitle className="text-xl mb-2 group-hover:text-primary smooth-transition">
              {property.title}
            </CardTitle>
            <div className="flex items-center space-x-1 text-sm text-muted-foreground">
              <MapPin className="w-4 h-4" />
              <span>{property.location}</span>
            </div>
          </div>
          <Badge variant="outline">{property.type}</Badge>
        </div>
      </CardHeader>
      
      <CardContent>
        <p className="text-muted-foreground mb-4 text-sm">
          {property.description}
        </p>
        
        <div className="flex items-center justify-between text-sm text-muted-foreground mb-4">
          {property.beds > 0 && (
            <div className="flex items-center space-x-1">
              <Bed className="w-4 h-4" />
              <span>{property.beds} bed{property.beds > 1 ? 's' : ''}</span>
            </div>
          )}
          <div className="flex items-center space-x-1">
            <Bath className="w-4 h-4" />
            <span>{property.baths} bath{property.baths > 1 ? 's' : ''}</span>
          </div>
          <div className="flex items-center space-x-1">
            <Square className="w-4 h-4" />
            <span>{property.area}</span>
          </div>
        </div>
        
        <div className="flex gap-2">
          <Button variant="outline" size="sm" className="flex-1" asChild>
            <Link to={`/properties/${property.id}`}>
              View Details
            </Link>
          </Button>
          <Button variant="hero" size="sm" className="flex-1" asChild>
            <Link to="/account/messages">Contact Agent</Link>
          </Button>
        </div>
      </CardContent>
    </Card>
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
          <div className="flex flex-col md:flex-row gap-4 items-center">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
              <Input
                placeholder="Search properties by name or location..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            
            <div className="flex gap-2 items-center">
              <Select value={selectedType} onValueChange={setSelectedType}>
                <SelectTrigger className="w-40">
                  <SelectValue placeholder="Property Type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Types</SelectItem>
                  <SelectItem value="villa">Villa</SelectItem>
                  <SelectItem value="apartment">Apartment</SelectItem>
                  <SelectItem value="townhouse">Townhouse</SelectItem>
                  <SelectItem value="penthouse">Penthouse</SelectItem>
                  <SelectItem value="commercial">Commercial</SelectItem>
                  <SelectItem value="industrial">Industrial</SelectItem>
                </SelectContent>
              </Select>
              
              <Select value={selectedLocation} onValueChange={setSelectedLocation}>
                <SelectTrigger className="w-40">
                  <SelectValue placeholder="Location" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Locations</SelectItem>
                  <SelectItem value="Lagos">Lagos</SelectItem>
                  <SelectItem value="Nairobi">Nairobi</SelectItem>
                  <SelectItem value="Cape Town">Cape Town</SelectItem>
                  <SelectItem value="Accra">Accra</SelectItem>
                  <SelectItem value="Johannesburg">Johannesburg</SelectItem>
                  <SelectItem value="Dar es Salaam">Dar es Salaam</SelectItem>
                </SelectContent>
              </Select>
              
              <Button variant="outline" size="icon">
                <Filter className="w-4 h-4" />
              </Button>
              <Button variant="outline" onClick={() => { saveSearch(`Search ${new Date().toLocaleDateString()}`, { q: searchTerm, type: selectedType, location: selectedLocation }); toast({ title: "Search saved (demo)" }); }}>
                Save Search
              </Button>
              <Button variant={view === 'map' ? 'default' : 'outline'} onClick={() => setView(view === 'map' ? 'grid' : 'map')}>
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

          {view === 'grid' ? (
            filteredProperties.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                {filteredProperties.map((property) => (
                  <PropertyCard key={property.id} property={property} />
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
                    setSelectedLocation("all");
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
