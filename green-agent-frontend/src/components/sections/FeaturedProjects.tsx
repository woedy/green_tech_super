import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { MapPin, Calendar, ArrowRight } from "lucide-react";
import { Link } from "react-router-dom";
import projectImage from "@/assets/project-commercial.jpg";
import propertyImage from "@/assets/property-luxury.jpg";
import constructionImage from "@/assets/team-construction.jpg";

const FeaturedProjects = () => {
  const projects = [
    {
      id: 1,
      title: "Green Valley Commercial Complex",
      location: "Nairobi, Kenya",
      type: "Commercial",
      status: "Completed",
      year: "2024",
      image: projectImage,
      description: "Modern 15-story commercial complex with integrated solar systems and rainwater harvesting.",
      features: ["LEED Certified", "Solar Powered", "Smart Building"],
    },
    {
      id: 2, 
      title: "Sustainable Residential Estate",
      location: "Lagos, Nigeria",
      type: "Residential",
      status: "In Progress",
      year: "2024",
      image: propertyImage,
      description: "Eco-friendly residential development with 200 units featuring green building technology.",
      features: ["Green Certified", "Energy Efficient", "Community Gardens"],
    },
    {
      id: 3,
      title: "Tech Hub Infrastructure",
      location: "Cape Town, South Africa", 
      type: "Infrastructure",
      status: "Planning",
      year: "2025",
      image: constructionImage,
      description: "State-of-the-art technology hub with sustainable infrastructure and modern amenities.",
      features: ["Smart Infrastructure", "Renewable Energy", "5G Ready"],
    },
  ];

  const getStatusColor = (status: string) => {
    switch (status) {
      case "Completed": return "bg-success text-success-foreground";
      case "In Progress": return "bg-warning text-warning-foreground";
      case "Planning": return "bg-primary text-primary-foreground";
      default: return "bg-muted text-muted-foreground";
    }
  };

  return (
    <section className="py-20 bg-background">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold text-foreground mb-6">
            Featured Projects
          </h2>
          <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
            Showcasing our commitment to excellence in sustainable construction 
            and innovative real estate development across Africa.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-12">
          {projects.map((project) => (
            <Card key={project.id} className="overflow-hidden shadow-medium hover-lift smooth-transition group">
              <div className="relative overflow-hidden">
                <img 
                  src={project.image} 
                  alt={project.title}
                  className="w-full h-48 object-cover group-hover:scale-105 smooth-transition"
                />
                <div className="absolute top-4 left-4">
                  <Badge className={getStatusColor(project.status)}>
                    {project.status}
                  </Badge>
                </div>
                <div className="absolute top-4 right-4">
                  <Badge variant="secondary" className="bg-background/90">
                    {project.type}
                  </Badge>
                </div>
              </div>
              
              <CardContent className="p-6">
                <h3 className="text-xl font-semibold mb-2 group-hover:text-primary smooth-transition">
                  {project.title}
                </h3>
                
                <div className="flex items-center text-muted-foreground text-sm mb-2">
                  <MapPin className="w-4 h-4 mr-1" />
                  {project.location}
                </div>
                
                <div className="flex items-center text-muted-foreground text-sm mb-4">
                  <Calendar className="w-4 h-4 mr-1" />
                  {project.year}
                </div>
                
                <p className="text-muted-foreground text-sm mb-4 leading-relaxed">
                  {project.description}
                </p>
                
                <div className="flex flex-wrap gap-2 mb-4">
                  {project.features.map((feature, index) => (
                    <Badge key={index} variant="outline" className="text-xs">
                      {feature}
                    </Badge>
                  ))}
                </div>
                
                <Button variant="ghost" className="w-full group/btn" asChild>
                  <Link to={`/projects/${project.id}`}>
                    View Details
                    <ArrowRight className="w-4 h-4 ml-2 group-hover/btn:translate-x-1 transition-transform" />
                  </Link>
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>

        <div className="text-center">
          <Button variant="professional" size="lg" asChild>
            <Link to="/projects">
              View All Projects
              <ArrowRight className="w-5 h-5 ml-2" />
            </Link>
          </Button>
        </div>
      </div>
    </section>
  );
};

export default FeaturedProjects;