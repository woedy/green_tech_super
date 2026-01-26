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
  ArrowRight,
  ExternalLink,
  Loader2
} from "lucide-react";
import { Link, useSearchParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { publicApi, type PublicProject, type PaginatedProjectsResponse } from "@/lib/api";

const Projects = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const category = searchParams.get('category') || 'all';
  const status = searchParams.get('status') || '';
  const search = searchParams.get('search') || '';
  const page = Number(searchParams.get('page') || '1') || 1;

  // Fetch projects from API (paginated)
  const {
    data: projectsData,
    isLoading: projectsLoading,
    error: projectsError,
  } = useQuery<PaginatedProjectsResponse>({
    queryKey: ['projects', { category, status, search, page }],
    queryFn: () =>
      publicApi.getProjects({
        category: category === 'all' ? undefined : category,
        status: status || undefined,
        search: search || undefined,
        page,
      }),
  });

  const projects = projectsData?.results || [];

  // Fetch project statistics
  const { data: stats, isLoading: statsLoading } = useQuery({
    queryKey: ['project-stats'],
    queryFn: () => publicApi.getProjectStats(),
  });

  const setCategory = (nextCategory: string) => {
    const next = new URLSearchParams(searchParams);
    if (nextCategory === 'all') next.delete('category');
    else next.set('category', nextCategory);
    next.delete('page');
    setSearchParams(next);
  };

  const setPage = (nextPage: number) => {
    const safeNextPage = Math.max(1, nextPage);
    const next = new URLSearchParams(searchParams);
    if (safeNextPage === 1) next.delete('page');
    else next.set('page', safeNextPage.toString());
    setSearchParams(next);
  };

  const getIcon = (category: string) => {
    switch (category) {
      case "residential": return Home;
      case "commercial": return Building2;
      case "industrial": return Factory;
      default: return Building2;
    }
  };

  const ProjectCard = ({ project }: { project: PublicProject }) => {
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
            <Badge variant={project.status === "COMPLETED" ? "default" : "secondary"}>
              {project.status_display}
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
          
          <Button variant="outline" className="w-full group" asChild>
            <Link to={`/projects/${project.id}`}>
              View Details
              <ExternalLink className="ml-2 h-4 w-4 group-hover:translate-x-1 smooth-transition" />
            </Link>
          </Button>
        </CardContent>
      </Card>
    );
  };

  // Show loading state
  if (projectsLoading) {
    return (
      <Layout>
        <div className="flex items-center justify-center min-h-screen">
          <div className="text-center">
            <Loader2 className="w-8 h-8 animate-spin mx-auto mb-4" />
            <p className="text-muted-foreground">Loading projects...</p>
          </div>
        </div>
      </Layout>
    );
  }

  // Show error state
  if (projectsError) {
    return (
      <Layout>
        <div className="flex items-center justify-center min-h-screen">
          <div className="text-center">
            <p className="text-destructive mb-4">Failed to load projects</p>
            <Button onClick={() => window.location.reload()}>Try Again</Button>
          </div>
        </div>
      </Layout>
    );
  }

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
          <Tabs value={category} onValueChange={setCategory} className="space-y-8">
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
                {projects.map((project) => (
                  <ProjectCard key={project.id} project={project} />
                ))}
              </div>
            </TabsContent>

            <TabsContent value="commercial" className="space-y-8">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                {projects.map((project) => (
                  <ProjectCard key={project.id} project={project} />
                ))}
              </div>
            </TabsContent>

            <TabsContent value="industrial" className="space-y-8">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                {projects.map((project) => (
                  <ProjectCard key={project.id} project={project} />
                ))}
              </div>
            </TabsContent>

            <div className="flex items-center justify-between pt-2">
              <div className="text-sm text-muted-foreground">
                {projectsData ? (
                  <span>
                    Showing {projects.length} of {projectsData.count}
                  </span>
                ) : null}
              </div>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPage(page - 1)}
                  disabled={!projectsData?.previous || page <= 1}
                >
                  Previous
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPage(page + 1)}
                  disabled={!projectsData?.next}
                >
                  Next
                </Button>
              </div>
            </div>
          </Tabs>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-20 bg-accent/20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {statsLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-4 gap-8 text-center">
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="space-y-2">
                  <div className="text-3xl md:text-4xl font-bold text-primary animate-pulse">--</div>
                  <div className="text-muted-foreground">Loading...</div>
                </div>
              ))}
            </div>
          ) : stats ? (
            <div className="grid grid-cols-1 md:grid-cols-4 gap-8 text-center">
              <div className="space-y-2">
                <div className="text-3xl md:text-4xl font-bold text-primary">{stats.total_projects}+</div>
                <div className="text-muted-foreground">Projects Completed</div>
              </div>
              <div className="space-y-2">
                <div className="text-3xl md:text-4xl font-bold text-primary">{stats.countries_served}</div>
                <div className="text-muted-foreground">African Countries</div>
              </div>
              <div className="space-y-2">
                <div className="text-3xl md:text-4xl font-bold text-primary">{stats.total_area_developed}</div>
                <div className="text-muted-foreground">sqm Developed</div>
              </div>
              <div className="space-y-2">
                <div className="text-3xl md:text-4xl font-bold text-primary">{stats.client_satisfaction}%</div>
                <div className="text-muted-foreground">Client Satisfaction</div>
              </div>
            </div>
          ) : (
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
          )}
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