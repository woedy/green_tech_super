import Layout from "@/components/layout/Layout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { 
  MapPin, 
  Bed, 
  Bath, 
  Square, 
  Heart, 
  Share2,
  ArrowLeft,
  Phone,
  Mail,
  MessageCircle,
  Calendar,
  CheckCircle,
  Car,
  Shield,
  Wifi,
  Dumbbell
} from "lucide-react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { useToast } from "@/components/ui/use-toast";

const PropertyDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  
  // Mock property data - in real app, this would come from API
  const property = {
    id: 1,
    title: "Luxury Waterfront Villa",
    type: "Villa",
    location: "Victoria Island, Lagos, Nigeria",
    price: "$850,000",
    beds: 4,
    baths: 3,
    area: "350 sqm",
    images: [
      "/src/assets/property-luxury.jpg",
      "/src/assets/hero-construction.jpg",
      "/src/assets/project-commercial.jpg",
      "/src/assets/team-construction.jpg"
    ],
    featured: true,
    status: "For Sale",
    description: "This stunning waterfront villa offers an unparalleled luxury living experience with panoramic ocean views, premium finishes, and exceptional attention to detail. Located in the prestigious Victoria Island, this property represents the pinnacle of modern coastal living.",
    features: [
      "Ocean Views",
      "Private Pool", 
      "Modern Kitchen",
      "Master Suite",
      "Guest Rooms",
      "Landscaped Garden",
      "Security System",
      "Parking Garage"
    ],
    amenities: [
      { icon: Car, name: "2 Car Garage" },
      { icon: Shield, name: "24/7 Security" },
      { icon: Wifi, name: "High-Speed Internet" },
      { icon: Dumbbell, name: "Home Gym" }
    ],
    agent: {
      name: "Sarah Johnson",
      title: "Senior Property Consultant",
      phone: "+234 801 234 5678",
      email: "sarah@greentechafrica.com",
      image: "/src/assets/team-construction.jpg"
    }
  };

  return (
    <Layout>
      {/* Breadcrumb */}
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

      {/* Property Header */}
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
                <Badge variant={property.status === "For Sale" ? "default" : "secondary"}>
                  {property.status}
                </Badge>
                {property.featured && (
                  <Badge variant="secondary">Featured</Badge>
                )}
              </div>
              
              <h1 className="text-3xl md:text-4xl font-bold mb-2">{property.title}</h1>
              <div className="flex items-center space-x-1 text-muted-foreground mb-4">
                <MapPin className="w-4 h-4" />
                <span>{property.location}</span>
              </div>
              
              <div className="text-3xl md:text-4xl font-bold text-primary mb-6">
                {property.price}
              </div>
            </div>
            
            <div className="flex gap-2">
              <Button variant="outline" size="icon">
                <Heart className="w-4 h-4" />
              </Button>
              <Button variant="outline" size="icon">
                <Share2 className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Property Images */}
      <section className="py-8 bg-background">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
            <div className="lg:col-span-3">
              <img 
                src={property.images[0]} 
                alt={property.title}
                className="w-full h-96 lg:h-[500px] object-cover rounded-lg"
              />
            </div>
            <div className="grid grid-cols-2 lg:grid-cols-1 gap-4">
              {property.images.slice(1, 4).map((image, index) => (
                <img 
                  key={index}
                  src={image} 
                  alt={`${property.title} ${index + 2}`}
                  className="w-full h-24 lg:h-[160px] object-cover rounded-lg cursor-pointer hover:opacity-80 smooth-transition"
                />
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Property Details */}
      <section className="py-8 bg-background">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Main Content */}
            <div className="lg:col-span-2 space-y-8">
              {/* Key Details */}
              <Card>
                <CardHeader>
                  <CardTitle>Property Details</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                    {property.beds > 0 && (
                      <div className="text-center">
                        <Bed className="w-8 h-8 mx-auto mb-2 text-primary" />
                        <div className="font-semibold">{property.beds}</div>
                        <div className="text-sm text-muted-foreground">Bedrooms</div>
                      </div>
                    )}
                    <div className="text-center">
                      <Bath className="w-8 h-8 mx-auto mb-2 text-primary" />
                      <div className="font-semibold">{property.baths}</div>
                      <div className="text-sm text-muted-foreground">Bathrooms</div>
                    </div>
                    <div className="text-center">
                      <Square className="w-8 h-8 mx-auto mb-2 text-primary" />
                      <div className="font-semibold">{property.area}</div>
                      <div className="text-sm text-muted-foreground">Total Area</div>
                    </div>
                    <div className="text-center">
                      <Badge variant="outline" className="w-8 h-8 mx-auto mb-2 flex items-center justify-center">
                        <span className="text-xs">{property.type[0]}</span>
                      </Badge>
                      <div className="font-semibold">{property.type}</div>
                      <div className="text-sm text-muted-foreground">Property Type</div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Description */}
              <Card>
                <CardHeader>
                  <CardTitle>About This Property</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground leading-relaxed">
                    {property.description}
                  </p>
                </CardContent>
              </Card>

              {/* Features */}
              <Card>
                <CardHeader>
                  <CardTitle>Property Features</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                    {property.features.map((feature, index) => (
                      <div key={index} className="flex items-center space-x-2">
                        <CheckCircle className="w-4 h-4 text-success" />
                        <span className="text-sm">{feature}</span>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              {/* Amenities */}
              <Card>
                <CardHeader>
                  <CardTitle>Amenities</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                    {property.amenities.map((amenity, index) => {
                      const IconComponent = amenity.icon;
                      return (
                        <div key={index} className="text-center">
                          <div className="flex items-center justify-center w-12 h-12 bg-accent rounded-lg mb-2 mx-auto">
                            <IconComponent className="w-6 h-6 text-primary" />
                          </div>
                          <div className="text-sm font-medium">{amenity.name}</div>
                        </div>
                      );
                    })}
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Sidebar */}
            <div className="space-y-6">
              {/* Agent Card */}
              <Card>
                <CardHeader>
                  <CardTitle>Contact Agent</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center space-x-3">
                    <img 
                      src={property.agent.image} 
                      alt={property.agent.name}
                      className="w-12 h-12 rounded-full object-cover"
                    />
                    <div>
                      <div className="font-semibold">{property.agent.name}</div>
                      <div className="text-sm text-muted-foreground">{property.agent.title}</div>
                    </div>
                  </div>
                  
                <div className="space-y-2">
                  <Button variant="hero" className="w-full">
                    <Phone className="w-4 h-4 mr-2" />
                    Call Agent
                  </Button>
                  <Button variant="outline" className="w-full">
                    <Mail className="w-4 h-4 mr-2" />
                    Email Agent
                  </Button>
                  <Button variant="success" className="w-full">
                    <MessageCircle className="w-4 h-4 mr-2" />
                    WhatsApp
                  </Button>
                  <Button variant="outline" className="w-full" asChild>
                    <Link to={`/properties/${property.id}/inquire`}>
                      Send Inquiry
                    </Link>
                  </Button>
                </div>
                </CardContent>
              </Card>

              {/* Schedule Viewing */}
              <Card>
                <CardHeader>
                  <CardTitle>Schedule a Viewing</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <Label htmlFor="date">Preferred Date</Label>
                      <Input type="date" id="date" />
                    </div>
                    <div>
                      <Label htmlFor="time">Time</Label>
                      <Input type="time" id="time" />
                    </div>
                  </div>
                  
                  <div>
                    <Label htmlFor="name">Full Name</Label>
                    <Input id="name" placeholder="Your name" />
                  </div>
                  
                  <div>
                    <Label htmlFor="phone">Phone Number</Label>
                    <Input id="phone" placeholder="Your phone number" />
                  </div>
                  
                  <div>
                    <Label htmlFor="message">Message (Optional)</Label>
                    <Textarea id="message" placeholder="Any specific requirements..." rows={3} />
                  </div>
                  
                  <Button className="w-full" onClick={() => { toast({ title: "Viewing requested (demo)" }); navigate("/account/appointments"); }}>
                    <Calendar className="w-4 h-4 mr-2" />
                    Request Viewing
                  </Button>
                </CardContent>
              </Card>

              {/* Mortgage Calculator */}
              <Card>
                <CardHeader>
                  <CardTitle>Mortgage Calculator</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <Label htmlFor="price">Property Price</Label>
                    <Input id="price" value="$850,000" readOnly />
                  </div>
                  
                  <div>
                    <Label htmlFor="downpayment">Down Payment (%)</Label>
                    <Input id="downpayment" placeholder="20" />
                  </div>
                  
                  <div>
                    <Label htmlFor="term">Loan Term (Years)</Label>
                    <Input id="term" placeholder="30" />
                  </div>
                  
                  <div>
                    <Label htmlFor="rate">Interest Rate (%)</Label>
                    <Input id="rate" placeholder="3.5" />
                  </div>
                  
                  <Button variant="outline" className="w-full">
                    Calculate Payment
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

export default PropertyDetail;
