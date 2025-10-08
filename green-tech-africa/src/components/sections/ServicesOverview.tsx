import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { 
  Building2, 
  Home, 
  TreePine, 
  Scale,
  Wrench, 
  MapPin, 
  Shield,
  ArrowRight 
} from "lucide-react";
import { Link } from "react-router-dom";

const ServicesOverview = () => {
  const services = [
    {
      icon: Building2,
      title: "Construction Services",
      description: "Residential, commercial, and infrastructure development with cutting-edge sustainable practices.",
      features: ["Residential Buildings", "Commercial Complexes", "Infrastructure Development"],
      color: "text-primary"
    },
    {
      icon: Home,
      title: "Real Estate Services", 
      description: "Complete property solutions from buying and selling to comprehensive management services.",
      features: ["Property Sales", "Leasing Services", "Property Management"],
      color: "text-success"
    },
    {
      icon: TreePine,
      title: "Green Building Solutions",
      description: "Eco-friendly construction methods and renewable energy integration for sustainable development.",
      features: ["Solar Installation", "Green Certification", "Energy Efficiency"],
      color: "text-primary-light"
    },
    {
      icon: Scale,
      title: "Land & Legal Services",
      description: "Comprehensive land sales and legal support for all your property and land-related needs across Africa.",
      features: ["Land Sales", "Legal Consultation", "Title Registration"],
      color: "text-accent"
    }
  ];

  return (
    <section className="py-20 bg-muted/30">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold text-foreground mb-6">
            Our Services
          </h2>
          <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
            Comprehensive construction and real estate solutions designed to build 
            Africa's sustainable future with innovative green technology.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 mb-12">
          {services.map((service, index) => {
            const IconComponent = service.icon;
            return (
              <Card key={index} className="shadow-medium hover-lift smooth-transition h-full">
                <CardHeader className="text-center pb-4">
                  <div className={`w-16 h-16 mx-auto rounded-2xl bg-gradient-to-br from-accent to-accent/50 flex items-center justify-center mb-4`}>
                    <IconComponent className={`w-8 h-8 ${service.color}`} />
                  </div>
                  <CardTitle className="text-xl font-semibold mb-2">
                    {service.title}
                  </CardTitle>
                </CardHeader>
                <CardContent className="pt-0">
                  <p className="text-muted-foreground mb-6 text-center">
                    {service.description}
                  </p>
                  <ul className="space-y-2 mb-6">
                    {service.features.map((feature, featureIndex) => (
                      <li key={featureIndex} className="flex items-center text-sm">
                        <Shield className="w-4 h-4 text-success mr-2 flex-shrink-0" />
                        {feature}
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
            );
          })}
        </div>

        {/* Additional Services Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
          {[
            { icon: Wrench, title: "Maintenance", desc: "Ongoing property maintenance" },
            { icon: MapPin, title: "Site Planning", desc: "Strategic location analysis" },
            { icon: Shield, title: "Quality Assurance", desc: "Rigorous quality control" },
            { icon: TreePine, title: "Sustainability", desc: "Environmental compliance" },
          ].map((item, index) => {
            const IconComponent = item.icon;
            return (
              <div key={index} className="text-center p-6 rounded-lg bg-background shadow-soft hover-lift smooth-transition">
                <IconComponent className="w-10 h-10 text-primary mx-auto mb-4" />
                <h4 className="font-semibold mb-2">{item.title}</h4>
                <p className="text-sm text-muted-foreground">{item.desc}</p>
              </div>
            );
          })}
        </div>

        {/* CTA */}
        <div className="text-center">
          <Button variant="hero" size="lg" asChild className="group">
            <Link to="/services">
              View All Services
              <ArrowRight className="w-5 h-5 ml-2 group-hover:translate-x-1 transition-transform" />
            </Link>
          </Button>
        </div>
      </div>
    </section>
  );
};

export default ServicesOverview;