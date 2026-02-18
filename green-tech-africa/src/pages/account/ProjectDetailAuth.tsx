import Layout from "@/components/layout/Layout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { 
  MapPin, 
  Calendar, 
  ArrowLeft, 
  Building2,
  Share2,
  Loader2
} from "lucide-react";
import { Link, useParams, useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { publicApi, type PublicProject } from "@/lib/api";
import { useToast } from "@/components/ui/use-toast";

const ProjectDetailAuth = () => {
  const { id = "" } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();

  const { data: project, isLoading, isError } = useQuery<PublicProject>({
    queryKey: ['project', id],
    queryFn: () => publicApi.getProject(id),
  });

  const handleRequestProject = () => {
    navigate(`/account/requests/new?project=${id}`);
  };

  if (isLoading) {
    return (
      <Layout>
        <section className="py-10">
          <div className="max-w-6xl mx-auto px-4 space-y-6">
            <Skeleton className="h-10 w-2/3" />
            <Skeleton className="h-96 w-full" />
            <Skeleton className="h-48 w-full" />
          </div>
        </section>
      </Layout>
    );
  }

  if (isError || !project) {
    return (
      <Layout>
        <section className="py-16 text-center text-destructive">Failed to load project.</section>
      </Layout>
    );
  }

  return (
    <Layout>
      <section className="py-4 bg-accent/20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center space-x-2 text-sm">
            <Link to="/account/projects" className="text-muted-foreground hover:text-primary smooth-transition">
              Projects Catalog
            </Link>
            <span className="text-muted-foreground">/</span>
            <span className="text-foreground">{project.title}</span>
          </div>
        </div>
      </section>

      <section className="py-8 bg-background">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col lg:flex-row items-start justify-between gap-6 mb-6">
            <div className="flex-1">
              <div className="flex items-center gap-3 mb-4">
                <Link to="/account/projects">
                  <Button variant="outline" size="sm">
                    <ArrowLeft className="w-4 h-4 mr-2" />
                    Back to Catalog
                  </Button>
                </Link>
                {project.status && (
                  <Badge variant="secondary">{project.status}</Badge>
                )}
                {project.category && (
                  <Badge variant="outline">{project.category}</Badge>
                )}
              </div>

              <h1 className="text-3xl md:text-4xl font-bold mb-2">{project.title}</h1>
              {project.location && (
                <div className="flex items-center space-x-1 text-muted-foreground mb-4">
                  <MapPin className="w-4 h-4" />
                  <span>{project.location}</span>
                </div>
              )}
            </div>

            {/* Action Buttons */}
            <div className="flex flex-col gap-3 w-full lg:w-auto">
              <Button size="lg" className="w-full lg:w-auto" onClick={handleRequestProject}>
                Request Similar Project
              </Button>
              <Button variant="outline" size="lg">
                <Share2 className="w-4 h-4 mr-2" />
                Share
              </Button>
            </div>
          </div>

          {/* Hero Image */}
          {project.featured_image && (
            <div className="mb-8 rounded-lg overflow-hidden">
              <img
                src={project.featured_image}
                alt={project.title}
                className="w-full h-[400px] md:h-[500px] object-cover"
              />
            </div>
          )}

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Main Content */}
            <div className="lg:col-span-2 space-y-6">
              {/* Project Info */}
              <Card>
                <CardHeader>
                  <CardTitle>Project Information</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 gap-4">
                    {project.start_date && (
                      <div className="flex items-center gap-2">
                        <Calendar className="w-5 h-5 text-muted-foreground" />
                        <div>
                          <div className="text-xs text-muted-foreground">Start Date</div>
                          <div className="font-semibold">
                            {new Date(project.start_date).toLocaleDateString()}
                          </div>
                        </div>
                      </div>
                    )}
                    {project.end_date && (
                      <div className="flex items-center gap-2">
                        <Calendar className="w-5 h-5 text-muted-foreground" />
                        <div>
                          <div className="text-xs text-muted-foreground">End Date</div>
                          <div className="font-semibold">
                            {new Date(project.end_date).toLocaleDateString()}
                          </div>
                        </div>
                      </div>
                    )}
                    {project.category && (
                      <div className="flex items-center gap-2">
                        <Building2 className="w-5 h-5 text-muted-foreground" />
                        <div>
                          <div className="text-xs text-muted-foreground">Category</div>
                          <div className="font-semibold">{project.category}</div>
                        </div>
                      </div>
                    )}
                    {project.status && (
                      <div className="flex items-center gap-2">
                        <div>
                          <div className="text-xs text-muted-foreground">Status</div>
                          <div className="font-semibold">{project.status}</div>
                        </div>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>

              {/* Description */}
              {project.description && (
                <Card>
                  <CardHeader>
                    <CardTitle>About This Project</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-muted-foreground whitespace-pre-line">
                      {project.description}
                    </p>
                  </CardContent>
                </Card>
              )}

              {/* Additional Images */}
              {project.images && project.images.length > 0 && (
                <Card>
                  <CardHeader>
                    <CardTitle>Project Gallery</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                      {project.images.map((image: any, idx: number) => (
                        <div key={idx} className="aspect-video rounded-lg overflow-hidden">
                          <img
                            src={image.image_url || image}
                            alt={`Project image ${idx + 1}`}
                            className="w-full h-full object-cover"
                          />
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>

            {/* Sidebar */}
            <div className="space-y-6">
              <Card className="sticky top-20">
                <CardHeader>
                  <CardTitle>Interested in a similar project?</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <p className="text-sm text-muted-foreground">
                    Submit a request to start a similar construction project. Our team will provide you with a customized quote.
                  </p>
                  <Button className="w-full" size="lg" onClick={handleRequestProject}>
                    Request Similar Project
                  </Button>
                  <Button variant="outline" className="w-full" asChild>
                    <Link to="/account/requests">View My Requests</Link>
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

export default ProjectDetailAuth;
