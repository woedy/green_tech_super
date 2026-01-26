import { useParams, Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import Layout from "@/components/layout/Layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";
import { 
  ArrowLeft, 
  MapPin, 
  Calendar, 
  Building2, 
  Home, 
  Factory,
  Leaf,
  Droplets,
  Zap,
  Users,
  Clock,
  CheckCircle2,
  Loader2,
  ExternalLink,
  Star
} from "lucide-react";
import { publicApi, type PublicProject } from "@/lib/api";

const ProjectDetail = () => {
  const { id } = useParams();
  const projectId = Number(id);

  const { data: project, isLoading, error } = useQuery({
    queryKey: ['project', projectId],
    queryFn: () => publicApi.getProject(projectId),
    enabled: !!projectId && !isNaN(projectId),
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case "COMPLETED": return "bg-success text-success-foreground";
      case "IN_PROGRESS": return "bg-warning text-warning-foreground";
      case "PLANNING": return "bg-primary text-primary-foreground";
      case "APPROVED": return "bg-info text-info-foreground";
      case "ON_HOLD": return "bg-destructive text-destructive-foreground";
      default: return "bg-muted text-muted-foreground";
    }
  };

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case "residential": return Home;
      case "commercial": return Building2;
      case "industrial": return Factory;
      default: return Building2;
    }
  };

  const getProgressPercentage = (status: string) => {
    switch (status) {
      case "PLANNING": return 10;
      case "APPROVED": return 25;
      case "IN_PROGRESS": return 60;
      case "COMPLETED": return 100;
      case "ON_HOLD": return 40;
      default: return 0;
    }
  };

  if (isLoading) {
    return (
      <Layout>
        <section className="py-20">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex items-center justify-center">
              <div className="flex items-center gap-2 text-muted-foreground">
                <Loader2 className="h-5 w-5 animate-spin" />
                Loading project details...
              </div>
            </div>
          </div>
        </section>
      </Layout>
    );
  }

  if (error || !project) {
    return (
      <Layout>
        <section className="py-20">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center">
              <h1 className="text-2xl font-bold text-foreground mb-4">Project Not Found</h1>
              <p className="text-muted-foreground mb-6">
                The project you're looking for doesn't exist or has been removed.
              </p>
              <Button asChild>
                <Link to="/projects">
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Back to Projects
                </Link>
              </Button>
            </div>
          </div>
        </section>
      </Layout>
    );
  }

  const CategoryIcon = getCategoryIcon(project.category);
  const progress = getProgressPercentage(project.status);

  return (
    <Layout>
      <section className="py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Back Navigation */}
          <div className="mb-8">
            <Button variant="ghost" asChild className="mb-4">
              <Link to="/projects">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to Projects
              </Link>
            </Button>
          </div>

          {/* Project Header */}
          <div className="mb-8">
            <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-6">
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-4">
                  <CategoryIcon className="h-8 w-8 text-primary" />
                  <div>
                    <h1 className="text-3xl lg:text-4xl font-bold text-foreground">
                      {project.title}
                    </h1>
                    <div className="flex items-center gap-4 mt-2">
                      <Badge className={getStatusColor(project.status)}>
                        {project.status_display}
                      </Badge>
                      <Badge variant="outline" className="capitalize">
                        {project.category}
                      </Badge>
                    </div>
                  </div>
                </div>
                
                <div className="flex flex-wrap items-center gap-6 text-muted-foreground">
                  <div className="flex items-center gap-2">
                    <MapPin className="h-4 w-4" />
                    <span>{project.location}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Calendar className="h-4 w-4" />
                    <span>{project.year}</span>
                  </div>
                  {project.area && (
                    <div className="flex items-center gap-2">
                      <Building2 className="h-4 w-4" />
                      <span>{project.area}</span>
                    </div>
                  )}
                  {project.units && (
                    <div className="flex items-center gap-2">
                      <Users className="h-4 w-4" />
                      <span>{project.units}</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Project Image */}
              <div className="lg:w-96">
                <div className="aspect-video rounded-lg overflow-hidden bg-muted">
                  <img
                    src={project.image}
                    alt={project.title}
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      const target = e.target as HTMLImageElement;
                      target.src = `https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?w=800&h=600&fit=crop&crop=building`;
                    }}
                  />
                </div>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Main Content */}
            <div className="lg:col-span-2 space-y-8">
              {/* Project Description */}
              <Card>
                <CardHeader>
                  <CardTitle>Project Overview</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground leading-relaxed">
                    {project.description}
                  </p>
                </CardContent>
              </Card>

              {/* Project Progress */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Clock className="h-5 w-5" />
                    Project Progress
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium">Overall Progress</span>
                      <span className="text-sm text-muted-foreground">{progress}%</span>
                    </div>
                    <Progress value={progress} className="h-2" />
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      {project.status === "COMPLETED" ? (
                        <CheckCircle2 className="h-4 w-4 text-success" />
                      ) : (
                        <Clock className="h-4 w-4" />
                      )}
                      <span>Status: {project.status_display}</span>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Sustainability Features */}
              {project.features && project.features.length > 0 && (
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Leaf className="h-5 w-5 text-green-600" />
                      Sustainability Features
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      {project.features.map((feature, index) => (
                        <div key={index} className="flex items-center gap-3 p-3 rounded-lg bg-muted/50">
                          <div className="h-8 w-8 rounded-full bg-green-100 flex items-center justify-center">
                            <Leaf className="h-4 w-4 text-green-600" />
                          </div>
                          <span className="text-sm font-medium">{feature}</span>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>

            {/* Sidebar */}
            <div className="space-y-6">
              {/* Quick Stats */}
              <Card>
                <CardHeader>
                  <CardTitle>Project Details</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">Category</span>
                    <Badge variant="outline" className="capitalize">
                      {project.category}
                    </Badge>
                  </div>
                  <Separator />
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">Status</span>
                    <Badge className={getStatusColor(project.status)}>
                      {project.status_display}
                    </Badge>
                  </div>
                  <Separator />
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">Location</span>
                    <span className="text-sm font-medium">{project.location}</span>
                  </div>
                  <Separator />
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">Year</span>
                    <span className="text-sm font-medium">{project.year}</span>
                  </div>
                  {project.area && (
                    <>
                      <Separator />
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-muted-foreground">Area</span>
                        <span className="text-sm font-medium">{project.area}</span>
                      </div>
                    </>
                  )}
                  {project.units && (
                    <>
                      <Separator />
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-muted-foreground">Units</span>
                        <span className="text-sm font-medium">{project.units}</span>
                      </div>
                    </>
                  )}
                </CardContent>
              </Card>

              {/* Call to Action */}
              <Card>
                <CardHeader>
                  <CardTitle>Interested in Similar Projects?</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <p className="text-sm text-muted-foreground">
                    Get in touch with our team to discuss your construction needs and explore sustainable building options.
                  </p>
                  <div className="space-y-2">
                    <Button asChild className="w-full">
                      <Link to="/contact">
                        Get Started
                        <ExternalLink className="h-4 w-4 ml-2" />
                      </Link>
                    </Button>
                    <Button variant="outline" asChild className="w-full">
                      <Link to="/plans">
                        Browse Plans
                      </Link>
                    </Button>
                  </div>
                </CardContent>
              </Card>

              {/* Related Projects */}
              <Card>
                <CardHeader>
                  <CardTitle>Related Projects</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <Button variant="ghost" asChild className="w-full justify-start h-auto p-3">
                      <Link to={`/projects?category=${project.category}`}>
                        <div className="text-left">
                          <div className="font-medium text-sm">More {project.category} projects</div>
                          <div className="text-xs text-muted-foreground">
                            View all projects in this category
                          </div>
                        </div>
                      </Link>
                    </Button>
                    <Button variant="ghost" asChild className="w-full justify-start h-auto p-3">
                      <Link to="/projects?status=COMPLETED">
                        <div className="text-left">
                          <div className="font-medium text-sm">Completed projects</div>
                          <div className="text-xs text-muted-foreground">
                            See our finished work
                          </div>
                        </div>
                      </Link>
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </section>
    </Layout>
  );
};

export default ProjectDetail;