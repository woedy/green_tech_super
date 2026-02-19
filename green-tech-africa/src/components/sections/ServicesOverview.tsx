import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  ArrowRight,
  Building2,
  Home,
  MapPin,
  Scale,
  Shield,
  TreePine,
  Wrench,
} from "lucide-react";
import { Link } from "react-router-dom";

const ServicesOverview = () => {
  const services = [
    {
      icon: Building2,
      title: "Construction Services",
      description:
        "Residential, commercial, and infrastructure development with modern project delivery.",
      features: ["Residential Buildings", "Commercial Complexes", "Infrastructure Development"],
      color: "text-primary",
    },
    {
      icon: Home,
      title: "Real Estate Services",
      description:
        "Complete property solutions from discovery and sales to long-term management.",
      features: ["Property Sales", "Leasing Services", "Property Management"],
      color: "text-success",
    },
    {
      icon: TreePine,
      title: "Green Building Solutions",
      description:
        "Eco-friendly construction and renewable integration for efficient, future-ready assets.",
      features: ["Solar Installation", "Green Certification", "Energy Efficiency"],
      color: "text-primary-light",
    },
    {
      icon: Scale,
      title: "Land & Legal Services",
      description:
        "Comprehensive land sales and legal support for safer transactions across Africa.",
      features: ["Land Sales", "Legal Consultation", "Title Registration"],
      color: "text-accent",
    },
  ];

  return (
    <section className="py-20">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="mb-14 max-w-3xl">
          <p className="mb-3 text-sm font-medium uppercase tracking-wide text-primary">What we offer</p>
          <h2 className="text-3xl font-bold text-foreground md:text-5xl">Modern services for construction and real estate growth</h2>
          <p className="mt-4 text-lg text-muted-foreground">
            We blend technology, market insight, and on-ground expertise to simplify major decisions for customers.
          </p>
        </div>

        <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-4">
          {services.map((service) => {
            const Icon = service.icon;
            return (
              <Card key={service.title} className="h-full border-border/60 bg-background/90 shadow-soft smooth-transition hover:-translate-y-1 hover:shadow-medium">
                <CardHeader className="pb-3">
                  <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-accent/70">
                    <Icon className={`h-6 w-6 ${service.color}`} />
                  </div>
                  <CardTitle className="text-lg">{service.title}</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="mb-4 text-sm text-muted-foreground">{service.description}</p>
                  <ul className="space-y-2">
                    {service.features.map((feature) => (
                      <li key={feature} className="flex items-center gap-2 text-sm">
                        <Shield className="h-4 w-4 text-success" />
                        <span>{feature}</span>
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
            );
          })}
        </div>

        <div className="mt-10 grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
          {[
            { icon: Wrench, title: "Maintenance", desc: "Ongoing property maintenance" },
            { icon: MapPin, title: "Site Planning", desc: "Strategic location analysis" },
            { icon: Shield, title: "Quality Assurance", desc: "Rigorous quality control" },
            { icon: TreePine, title: "Sustainability", desc: "Environmental compliance" },
          ].map((item) => {
            const Icon = item.icon;
            return (
              <div key={item.title} className="rounded-xl border border-border/70 bg-card p-5 text-center shadow-soft">
                <Icon className="mx-auto mb-3 h-8 w-8 text-primary" />
                <h4 className="font-semibold">{item.title}</h4>
                <p className="mt-1 text-sm text-muted-foreground">{item.desc}</p>
              </div>
            );
          })}
        </div>

        <div className="mt-10 text-center">
          <Button variant="hero" size="lg" asChild className="group">
            <Link to="/services">
              View All Services
              <ArrowRight className="ml-2 h-5 w-5 transition-transform group-hover:translate-x-1" />
            </Link>
          </Button>
        </div>
      </div>
    </section>
  );
};

export default ServicesOverview;
