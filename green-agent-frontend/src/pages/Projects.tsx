import Layout from "@/components/layout/Layout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Building2, 
  Home, 
  Factory, 
  MapPin, 
  Calendar, 
  Users, 
  ArrowRight,
  ExternalLink
} from "lucide-react";

const Projects = () => {
  const projects = [
    {
      id: 1,
      title: "Green Valley Residential Complex",
      category: "residential",
      location: "Nairobi, Kenya",
      year: "2024",
      status: "Completed",
      image: "/src/assets/hero-construction.jpg",
      description: "A 200-unit eco-friendly residential complex featuring solar power, rainwater harvesting, and green spaces.",
      area: "15,000 sqm",
      units: "200 units",
      features: ["Solar Power", "Rainwater Harvesting", "Green Spaces", "Smart Home Systems"]
    },
    {
      id: 2,
      title: "TechHub Commercial Center",
      category: "commercial",
      location: "Lagos, Nigeria",
      year: "2023",
      status: "Completed",
      image: "/src/assets/project-commercial.jpg",
      description: "Modern commercial complex designed for tech companies with flexible spaces and advanced infrastructure.",
      area: "25,000 sqm",
      units: "50 offices",
      features: ["Flexible Layouts", "High-Speed Internet", "Conference Centers", "Cafeteria"]
    },
    {
      id: 3,
      title: "Sustainable Manufacturing Hub",
      category: "industrial",
      location: "Accra, Ghana",
      year: "2024",
      status: "Ongoing",
      image: "/src/assets/team-construction.jpg",
      description: "Industrial complex focused on sustainable manufacturing with renewable energy integration.",
      area: "40,000 sqm",
      units: "10 facilities",
      features: ["Renewable Energy", "Waste Management", "Efficient Logistics", "Worker Facilities"]
    },
    {
      id: 4,
      title: "Luxury Waterfront Villas",
      category: "residential",
      location: "Cape Town, South Africa",
      year: "2023",
      status: "Completed",
      image: "/src/assets/property-luxury.jpg",
      description: "Exclusive waterfront villas with panoramic ocean views and premium amenities.",
      area: "8,000 sqm",
      units: "12 villas",
      features: ["Ocean Views", "Private Pools", "Smart Systems", "Premium Finishes"]
    },
    {
      id: 5,
      title: "Innovation District Phase 1",
      category: "commercial",
      location: "Kigali, Rwanda",
      year: "2024",
      status: "Ongoing",
      image: "/src/assets/hero-construction.jpg",
      description: "Mixed-use development combining offices, retail, and residential spaces in a sustainable design.",
      area: "35,000 sqm",
      units: "Mixed-use",
      features: ["Mixed-Use Design", "Public Spaces", "Transit Access", "Green Building"]
    },
    {
      id: 6,
      title: "Agricultural Processing Plant",
      category: "industrial",
      location: "Kampala, Uganda",
      year: "2023",
      status: "Completed",
      image: "/src/assets/project-commercial.jpg",
      description: "State-of-the-art food processing facility with sustainable practices and community integration.",
      area: "20,000 sqm",
      units: "4 processing lines",
      features: ["Food Safety Standards", "Community Integration", "Sustainable Practices", "Efficient Processing"]
    }
  ];

  const filterProjects = (category: string) => {
    if (category === "all") return projects;
    return projects.filter(project => project.category === category);
  };

  const getIcon = (category: string) => {
    switch (category) {
      case "residential": return Home;
      case "commercial": return Building2;
      case "industrial": return Factory;
      default: return Building2;
    }
  };

  const ProjectCard = ({ project }: { project: typeof projects[0] }) => {
    const IconComponent = getIcon(project.category);
    
    return (
      <Card className="group hover:shadow-elegant smooth-transition overflow-hidden">
        <div className="relative overflow-hidden">
          <img 
            src={project.image} 
            alt={project.title}
            className="w-full h-48 object-cover group-hover:scale-105 smooth-transition"
          />
          <div className="absolute top-4 left-4">
            <Badge variant={project.status === "Completed" ? "default" : "secondary"}>
              {project.status}
            </Badge>
          </div>
          <div className="absolute top-4 right-4">
            <div className="bg-background/90 backdrop-blur-sm rounded-full p-2">
              <IconComponent className="w-4 h-4" />
            </div>
          </div>
        </div>
        
        <CardHeader>
          <div className="flex items-start justify-between">
            <div>
              <CardTitle className="text-xl mb-2 group-hover:text-primary smooth-transition">
                {project.title}
              </CardTitle>
              <div className="flex items-center space-x-4 text-sm text-muted-foreground">
                <div className="flex items-center space-x-1">
                  <MapPin className="w-4 h-4" />
                  <span>{project.location}</span>
                </div>
                <div className="flex items-center space-x-1">
                  <Calendar className="w-4 h-4" />
                  <span>{project.year}</span>
                </div>
              </div>
            </div>
          </div>
        </CardHeader>
        
        <CardContent>
          <p className="text-muted-foreground mb-4 line-clamp-2">
            {project.description}
          </p>
          
          <div className="grid grid-cols-2 gap-4 mb-4 text-sm">
            <div>
              <span className="font-medium">Area:</span>
              <div className="text-muted-foreground">{project.area}</div>
            </div>
            <div>
              <span className="font-medium">Units:</span>
              <div className="text-muted-foreground">{project.units}</div>
            </div>
          </div>
          
          <div className="flex flex-wrap gap-1 mb-4">
            {project.features.slice(0, 3).map((feature, index) => (
              <Badge key={index} variant="outline" className="text-xs">
                {feature}
              </Badge>
            ))}
            {project.features.length > 3 && (
              <Badge variant="outline" className="text-xs">
                +{project.features.length - 3} more
              </Badge>
            )}
          </div>
          
          <Button variant="outline" className="w-full group">
            View Details
            <ExternalLink className="ml-2 h-4 w-4 group-hover:translate-x-1 smooth-transition" />
          </Button>
        </CardContent>
      </Card>
    );
  };

  return (
    <Layout>
      {/* Hero Section */}
      <section className="relative py-20 bg-gradient-to-br from-background via-accent/30 to-background">
        <div className="absolute inset-0 bg-grid-pattern opacity-5"></div>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative">
          <div className="text-center max-w-4xl mx-auto">
            <Badge variant="outline" className="mb-4">
              Our Portfolio
            </Badge>
            <h1 className="text-4xl md:text-6xl font-bold mb-6 bg-gradient-to-r from-foreground to-muted-foreground bg-clip-text text-transparent">
              Transforming Africa's Landscape
            </h1>
            <p className="text-xl text-muted-foreground mb-8 leading-relaxed">
              Explore our diverse portfolio of completed and ongoing projects across Africa, 
              showcasing our commitment to sustainable development and innovative design.
            </p>
          </div>
        </div>
      </section>

      {/* Projects Section */}
      <section className="py-20 bg-background">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <Tabs defaultValue="all" className="space-y-8">
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
              <div>
                <h2 className="text-3xl font-bold mb-2">Featured Projects</h2>
                <p className="text-muted-foreground">
                  Discover the impact of our work across different sectors
                </p>
              </div>
              
              <TabsList className="grid w-full sm:w-auto grid-cols-4">
                <TabsTrigger value="all">All</TabsTrigger>
                <TabsTrigger value="residential">Residential</TabsTrigger>
                <TabsTrigger value="commercial">Commercial</TabsTrigger>
                <TabsTrigger value="industrial">Industrial</TabsTrigger>
              </TabsList>
            </div>

            <TabsContent value="all" className="space-y-8">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                {projects.map((project) => (
                  <ProjectCard key={project.id} project={project} />
                ))}
              </div>
            </TabsContent>

            <TabsContent value="residential" className="space-y-8">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                {filterProjects("residential").map((project) => (
                  <ProjectCard key={project.id} project={project} />
                ))}
              </div>
            </TabsContent>

            <TabsContent value="commercial" className="space-y-8">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                {filterProjects("commercial").map((project) => (
                  <ProjectCard key={project.id} project={project} />
                ))}
              </div>
            </TabsContent>

            <TabsContent value="industrial" className="space-y-8">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                {filterProjects("industrial").map((project) => (
                  <ProjectCard key={project.id} project={project} />
                ))}
              </div>
            </TabsContent>
          </Tabs>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-20 bg-accent/20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8 text-center">
            <div className="space-y-2">
              <div className="text-3xl md:text-4xl font-bold text-primary">50+</div>
              <div className="text-muted-foreground">Projects Completed</div>
            </div>
            <div className="space-y-2">
              <div className="text-3xl md:text-4xl font-bold text-primary">15</div>
              <div className="text-muted-foreground">African Countries</div>
            </div>
            <div className="space-y-2">
              <div className="text-3xl md:text-4xl font-bold text-primary">1M+</div>
              <div className="text-muted-foreground">sqm Developed</div>
            </div>
            <div className="space-y-2">
              <div className="text-3xl md:text-4xl font-bold text-primary">98%</div>
              <div className="text-muted-foreground">Client Satisfaction</div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-professional text-professional-foreground">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl md:text-4xl font-bold mb-6">
            Let's Build Something Amazing Together
          </h2>
          <p className="text-xl text-professional-foreground/80 mb-8">
            Ready to start your next project? Our team is here to turn your vision into reality.
          </p>
          <Button variant="success" size="lg">
            Start Your Project
            <ArrowRight className="ml-2 h-5 w-5" />
          </Button>
        </div>
      </section>
    </Layout>
  );
};

export default Projects;