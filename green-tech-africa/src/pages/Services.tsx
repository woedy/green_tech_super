import Layout from "@/components/layout/Layout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { 
  Building2, 
  Home, 
  Factory, 
  TreePine, 
  Key, 
  TrendingUp, 
  Shield, 
  Wrench,
  CheckCircle,
  ArrowRight
} from "lucide-react";

const Services = () => {
  const constructionServices = [
    {
      icon: Home,
      title: "Residential Construction",
      description: "Custom homes, apartments, and residential complexes built with sustainable materials and energy-efficient designs.",
      features: ["Custom Design", "Eco-Friendly Materials", "Energy Efficiency", "Smart Home Integration"]
    },
    {
      icon: Building2,
      title: "Commercial Development",
      description: "Office buildings, retail spaces, and mixed-use developments that meet modern business needs.",
      features: ["LEED Certification", "Modern Architecture", "Flexible Spaces", "Technology Infrastructure"]
    },
    {
      icon: Factory,
      title: "Industrial Construction",
      description: "Factories, warehouses, and industrial facilities designed for efficiency and sustainability.",
      features: ["Heavy-Duty Construction", "Safety Standards", "Efficient Layouts", "Environmental Compliance"]
    },
    {
      icon: TreePine,
      title: "Green Building Solutions",
      description: "Sustainable construction practices with renewable energy integration and eco-friendly materials.",
      features: ["Solar Integration", "Rainwater Harvesting", "Natural Ventilation", "Waste Reduction"]
    }
  ];

  const realEstateServices = [
    {
      icon: Key,
      title: "Property Sales",
      description: "Expert assistance in buying and selling residential and commercial properties across Africa.",
      features: ["Market Analysis", "Property Valuation", "Legal Support", "Negotiation Services"]
    },
    {
      icon: TrendingUp,
      title: "Investment Advisory",
      description: "Strategic real estate investment guidance to maximize returns and minimize risks.",
      features: ["ROI Analysis", "Market Trends", "Portfolio Diversification", "Risk Assessment"]
    },
    {
      icon: Shield,
      title: "Property Management",
      description: "Comprehensive property management services for residential and commercial properties.",
      features: ["Tenant Screening", "Maintenance Services", "Rent Collection", "Financial Reporting"]
    },
    {
      icon: Wrench,
      title: "Property Development",
      description: "End-to-end property development from land acquisition to project completion.",
      features: ["Site Analysis", "Planning Permits", "Construction Management", "Marketing & Sales"]
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
              Our Services
            </Badge>
            <h1 className="text-4xl md:text-6xl font-bold mb-6 bg-gradient-to-r from-foreground to-muted-foreground bg-clip-text text-transparent">
              Comprehensive Solutions for Your Vision
            </h1>
            <p className="text-xl text-muted-foreground mb-8 leading-relaxed">
              From sustainable construction to strategic real estate services, we deliver 
              excellence across every aspect of property development and management.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button variant="hero" size="lg">
                Request Consultation
                <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
              <Button variant="outline" size="lg">
                View Portfolio
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Construction Services */}
      <section className="py-20 bg-background">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <Badge variant="secondary" className="mb-4">
              Construction Excellence
            </Badge>
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              Building Tomorrow's Infrastructure
            </h2>
            <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
              Sustainable construction solutions that combine innovative technology 
              with environmentally responsible practices.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {constructionServices.map((service, index) => {
              const IconComponent = service.icon;
              return (
                <Card key={index} className="group hover:shadow-elegant smooth-transition">
                  <CardHeader>
                    <div className="flex items-center space-x-4">
                      <div className="flex items-center justify-center w-12 h-12 hero-gradient rounded-lg group-hover:scale-110 smooth-transition">
                        <IconComponent className="w-6 h-6 text-primary-foreground" />
                      </div>
                      <div>
                        <CardTitle className="text-xl">{service.title}</CardTitle>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <CardDescription className="text-base mb-4">
                      {service.description}
                    </CardDescription>
                    <div className="space-y-2">
                      {service.features.map((feature, featureIndex) => (
                        <div key={featureIndex} className="flex items-center space-x-2">
                          <CheckCircle className="w-4 h-4 text-success" />
                          <span className="text-sm text-muted-foreground">{feature}</span>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>
      </section>

      {/* Real Estate Services */}
      <section className="py-20 bg-accent/20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <Badge variant="secondary" className="mb-4">
              Real Estate Excellence
            </Badge>
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              Strategic Property Solutions
            </h2>
            <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
              Comprehensive real estate services designed to maximize value 
              and deliver exceptional investment opportunities.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {realEstateServices.map((service, index) => {
              const IconComponent = service.icon;
              return (
                <Card key={index} className="group hover:shadow-elegant smooth-transition">
                  <CardHeader>
                    <div className="flex items-center space-x-4">
                      <div className="flex items-center justify-center w-12 h-12 success-gradient rounded-lg group-hover:scale-110 smooth-transition">
                        <IconComponent className="w-6 h-6 text-primary-foreground" />
                      </div>
                      <div>
                        <CardTitle className="text-xl">{service.title}</CardTitle>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <CardDescription className="text-base mb-4">
                      {service.description}
                    </CardDescription>
                    <div className="space-y-2">
                      {service.features.map((feature, featureIndex) => (
                        <div key={featureIndex} className="flex items-center space-x-2">
                          <CheckCircle className="w-4 h-4 text-success" />
                          <span className="text-sm text-muted-foreground">{feature}</span>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-professional text-professional-foreground">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl md:text-4xl font-bold mb-6">
            Ready to Start Your Project?
          </h2>
          <p className="text-xl text-professional-foreground/80 mb-8">
            Let's discuss how our expertise can bring your vision to life with 
            sustainable, innovative solutions.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button variant="success" size="lg">
              Get Free Consultation
              <ArrowRight className="ml-2 h-5 w-5" />
            </Button>
            <Button variant="outline" size="lg" className="text-professional-foreground border-professional-foreground/30 hover:bg-professional-foreground/10">
              Download Brochure
            </Button>
          </div>
        </div>
      </section>
    </Layout>
  );
};

export default Services;