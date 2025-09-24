import Layout from "@/components/layout/Layout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { 
  MapPin, 
  Phone, 
  Mail, 
  Clock, 
  MessageCircle,
  Send,
  Building2,
  Home,
  Factory,
  ArrowRight
} from "lucide-react";

const Contact = () => {
  const contactInfo = [
    {
      icon: MapPin,
      title: "Visit Our Office",
      details: [
        "123 Green Tech Plaza",
        "Victoria Island, Lagos",
        "Nigeria"
      ],
      action: "Get Directions"
    },
    {
      icon: Phone,
      title: "Call Us",
      details: [
        "Nigeria: +234 801 234 5678",
        "Kenya: +254 700 123 456",
        "24/7 Emergency: +234 805 987 6543"
      ],
      action: "Call Now"
    },
    {
      icon: Mail,
      title: "Email Us",
      details: [
        "General: info@greentechafrica.com",
        "Sales: sales@greentechafrica.com",
        "Support: support@greentechafrica.com"
      ],
      action: "Send Email"
    },
    {
      icon: Clock,
      title: "Business Hours",
      details: [
        "Monday - Friday: 8:00 AM - 6:00 PM",
        "Saturday: 9:00 AM - 4:00 PM",
        "Sunday: Closed"
      ],
      action: "Schedule Meeting"
    }
  ];

  const offices = [
    {
      city: "Lagos, Nigeria",
      address: "123 Green Tech Plaza, Victoria Island",
      phone: "+234 801 234 5678",
      email: "lagos@greentechafrica.com"
    },
    {
      city: "Nairobi, Kenya", 
      address: "456 Innovation Hub, Westlands",
      phone: "+254 700 123 456",
      email: "nairobi@greentechafrica.com"
    },
    {
      city: "Cape Town, South Africa",
      address: "789 Business District, CBD",
      phone: "+27 21 123 4567",
      email: "capetown@greentechafrica.com"
    },
    {
      city: "Accra, Ghana",
      address: "321 Development Center, East Legon",
      phone: "+233 50 123 4567",
      email: "accra@greentechafrica.com"
    }
  ];

  return (
    <Layout>
      {/* Hero Section */}
      <section className="relative py-20 bg-gradient-to-br from-background via-accent/30 to-background">
        <div className="absolute inset-0 bg-grid-pattern opacity-5"></div>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative">
          <div className="text-center max-w-4xl mx-auto">
            <Badge variant="outline" className="mb-4">
              Get In Touch
            </Badge>
            <h1 className="text-4xl md:text-6xl font-bold mb-6 bg-gradient-to-r from-foreground to-muted-foreground bg-clip-text text-transparent">
              Let's Build Something Amazing Together
            </h1>
            <p className="text-xl text-muted-foreground mb-8 leading-relaxed">
              Ready to start your next project? Our team of experts is here to help 
              you turn your vision into reality with innovative, sustainable solutions.
            </p>
          </div>
        </div>
      </section>

      {/* Contact Information */}
      <section className="py-20 bg-background">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 mb-16">
            {contactInfo.map((info, index) => {
              const IconComponent = info.icon;
              return (
                <Card key={index} className="text-center group hover:shadow-elegant smooth-transition">
                  <CardHeader>
                    <div className="flex items-center justify-center w-16 h-16 hero-gradient rounded-lg mx-auto mb-4 group-hover:scale-110 smooth-transition">
                      <IconComponent className="w-8 h-8 text-primary-foreground" />
                    </div>
                    <CardTitle className="text-lg">{info.title}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-1 mb-4">
                      {info.details.map((detail, detailIndex) => (
                        <div key={detailIndex} className="text-sm text-muted-foreground">
                          {detail}
                        </div>
                      ))}
                    </div>
                    <Button variant="outline" size="sm" className="w-full">
                      {info.action}
                    </Button>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>
      </section>

      {/* Contact Form & Map */}
      <section className="py-20 bg-accent/20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
            {/* Contact Form */}
            <div>
              <div className="mb-8">
                <h2 className="text-3xl font-bold mb-4">Send Us a Message</h2>
                <p className="text-muted-foreground">
                  Fill out the form below and we'll get back to you within 24 hours.
                </p>
              </div>

              <Card>
                <CardContent className="p-6">
                  <form className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="firstName">First Name</Label>
                        <Input id="firstName" placeholder="John" />
                      </div>
                      <div>
                        <Label htmlFor="lastName">Last Name</Label>
                        <Input id="lastName" placeholder="Doe" />
                      </div>
                    </div>

                    <div>
                      <Label htmlFor="email">Email Address</Label>
                      <Input id="email" type="email" placeholder="john@example.com" />
                    </div>

                    <div>
                      <Label htmlFor="phone">Phone Number</Label>
                      <Input id="phone" placeholder="+234 800 000 0000" />
                    </div>

                    <div>
                      <Label htmlFor="service">Service Interested In</Label>
                      <Select>
                        <SelectTrigger>
                          <SelectValue placeholder="Select a service" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="residential">Residential Construction</SelectItem>
                          <SelectItem value="commercial">Commercial Development</SelectItem>
                          <SelectItem value="industrial">Industrial Construction</SelectItem>
                          <SelectItem value="property-sales">Property Sales</SelectItem>
                          <SelectItem value="property-management">Property Management</SelectItem>
                          <SelectItem value="consultation">General Consultation</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div>
                      <Label htmlFor="budget">Project Budget (Optional)</Label>
                      <Select>
                        <SelectTrigger>
                          <SelectValue placeholder="Select budget range" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="under-100k">Under $100,000</SelectItem>
                          <SelectItem value="100k-500k">$100,000 - $500,000</SelectItem>
                          <SelectItem value="500k-1m">$500,000 - $1,000,000</SelectItem>
                          <SelectItem value="1m-5m">$1,000,000 - $5,000,000</SelectItem>
                          <SelectItem value="over-5m">Over $5,000,000</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div>
                      <Label htmlFor="message">Message</Label>
                      <Textarea 
                        id="message" 
                        placeholder="Tell us about your project requirements, timeline, and any specific questions you have..."
                        rows={4}
                      />
                    </div>

                    <div className="flex gap-4">
                      <Button className="flex-1">
                        <Send className="w-4 h-4 mr-2" />
                        Send Message
                      </Button>
                      <Button variant="success" className="flex-1">
                        <MessageCircle className="w-4 h-4 mr-2" />
                        WhatsApp Us
                      </Button>
                    </div>
                  </form>
                </CardContent>
              </Card>
            </div>

            {/* Map & Office Locations */}
            <div>
              <div className="mb-8">
                <h2 className="text-3xl font-bold mb-4">Our Locations</h2>
                <p className="text-muted-foreground">
                  Visit our offices across Africa or schedule a consultation at your location.
                </p>
              </div>

              {/* Map Placeholder */}
              <div className="bg-accent rounded-lg h-64 mb-8 flex items-center justify-center">
                <div className="text-center">
                  <MapPin className="w-12 h-12 text-muted-foreground mx-auto mb-2" />
                  <div className="text-muted-foreground">Interactive Map</div>
                  <div className="text-sm text-muted-foreground">
                    Lagos • Nairobi • Cape Town • Accra
                  </div>
                </div>
              </div>

              {/* Office Locations */}
              <div className="space-y-4">
                {offices.map((office, index) => (
                  <Card key={index} className="hover:shadow-elegant smooth-transition">
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <h3 className="font-semibold mb-1">{office.city}</h3>
                          <div className="text-sm text-muted-foreground space-y-1">
                            <div className="flex items-center space-x-2">
                              <MapPin className="w-3 h-3" />
                              <span>{office.address}</span>
                            </div>
                            <div className="flex items-center space-x-2">
                              <Phone className="w-3 h-3" />
                              <span>{office.phone}</span>
                            </div>
                            <div className="flex items-center space-x-2">
                              <Mail className="w-3 h-3" />
                              <span>{office.email}</span>
                            </div>
                          </div>
                        </div>
                        <Button variant="outline" size="sm">
                          Visit
                          <ArrowRight className="w-3 h-3 ml-1" />
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Service Icons */}
      <section className="py-20 bg-background">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold mb-4">How Can We Help You?</h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              Whether you're planning a new construction project, looking for property investment 
              opportunities, or need expert consultation, we're here to help.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <Card className="text-center group hover:shadow-elegant smooth-transition">
              <CardContent className="p-8">
                <div className="flex items-center justify-center w-16 h-16 hero-gradient rounded-lg mx-auto mb-4 group-hover:scale-110 smooth-transition">
                  <Building2 className="w-8 h-8 text-primary-foreground" />
                </div>
                <h3 className="text-xl font-semibold mb-2">Construction Projects</h3>
                <p className="text-muted-foreground mb-4">
                  From residential homes to commercial complexes, we deliver 
                  sustainable construction solutions.
                </p>
                <Button variant="outline">
                  Learn More
                </Button>
              </CardContent>
            </Card>

            <Card className="text-center group hover:shadow-elegant smooth-transition">
              <CardContent className="p-8">
                <div className="flex items-center justify-center w-16 h-16 success-gradient rounded-lg mx-auto mb-4 group-hover:scale-110 smooth-transition">
                  <Home className="w-8 h-8 text-primary-foreground" />
                </div>
                <h3 className="text-xl font-semibold mb-2">Real Estate Services</h3>
                <p className="text-muted-foreground mb-4">
                  Expert guidance in property sales, investment advisory, 
                  and property management services.
                </p>
                <Button variant="outline">
                  Explore Properties
                </Button>
              </CardContent>
            </Card>

            <Card className="text-center group hover:shadow-elegant smooth-transition">
              <CardContent className="p-8">
                <div className="flex items-center justify-center w-16 h-16 professional-gradient rounded-lg mx-auto mb-4 group-hover:scale-110 smooth-transition">
                  <Factory className="w-8 h-8 text-primary-foreground" />
                </div>
                <h3 className="text-xl font-semibold mb-2">Industrial Development</h3>
                <p className="text-muted-foreground mb-4">
                  Large-scale industrial projects with focus on efficiency 
                  and environmental responsibility.
                </p>
                <Button variant="outline">
                  View Projects
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Emergency Contact */}
      <section className="py-16 bg-professional text-professional-foreground">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl font-bold mb-4">Need Immediate Assistance?</h2>
          <p className="text-xl text-professional-foreground/80 mb-8">
            Our emergency response team is available 24/7 for urgent construction 
            or property management issues.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button variant="success" size="lg">
              <Phone className="mr-2 h-5 w-5" />
              Emergency Hotline
            </Button>
            <Button variant="outline" size="lg" className="text-professional-foreground border-professional-foreground/30 hover:bg-professional-foreground/10">
              <MessageCircle className="mr-2 h-5 w-5" />
              24/7 WhatsApp Support
            </Button>
          </div>
        </div>
      </section>
    </Layout>
  );
};

export default Contact;