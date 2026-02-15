import Layout from "@/components/layout/Layout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { 
  Building2, 
  Home, 
  Factory, 
  MapPin, 
  Calendar, 
  Search,
  Heart,
  Loader2
} from "lucide-react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { publicApi, type PaginatedProjectsResponse } from "@/lib/api";
import { useToast } from "@/components/ui/use-toast";
import { useState } from "react";

const ProjectsCatalog = () => {
  const { toast } = useToast();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const [searchTerm, setSearchTerm] = useState(searchParams.get('search') || '');
  const category = searchParams.get('category') || 'all';
  const status = searchParams.get('status') || '';
  const page = Number(searchParams.get('page') || '1') || 1;

  const {
    data: projectsData,
    isLoading,
    error,
  } = useQuery<PaginatedProjectsResponse>({
    queryKey: ['projects', { category, status, search: searchTerm, page }],
    queryFn: () =>
      publicApi.getProjects({
        category: category === 'all' ? undefined : category,
        status: status || undefined,
        search: searchTerm || undefined,
        page,
      }),
  });

  const projects = projectsData?.results || [];

  const handleRequestProject = (projectId: number) => {
    // Navigate to create request with project pre-selected
    navigate(`/account/requests/new?project=${projectId}`);
  };

  const handleSearch = () => {
    const params = new URLSearchParams(searchParams);
    if (searchTerm) {
      params.set('search', searchTerm);
    } else {
      params.delete('search');
    }
    params.set('page', '1');
    setSearchParams(params);
  };

  const handleCategoryChange = (newCategory: string) => {
    const params = new URLSearchParams(searchParams);
    params.set('category', newCategory);
    params.set('page', '1');
    setSearchParams(params);
  };

  return (
    <Layout>
      <div className="min-h-screen bg-background">
        {/* Hero Section */}
        <section className="py-12 bg-gradient-to-br from-primary/5 via-background to-background">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-8">
              <Badge variant="outline" className="mb-4">
                <Building2 className="w-3 h-3 mr-1" />
                Projects Catalog
              </Badge>
              <h1 className="text-4xl font-bold mb-4">Browse Construction Projects</h1>
              <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
                Explore our portfolio of sustainable construction projects. Click "Request Similar Project" to get started.
              </p>
            </div>

            {/* Search and Category Filters */}
            <div className="flex flex-col md:flex-row gap-4 mb-6">
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-5 h-5" />
                <Input
                  placeholder="Search projects by name or location..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                  className="pl-10"
                />
              </div>
              <Button onClick={handleSearch}>Search</Button>
            </div>

            {/* Category Tabs */}
            <div className="flex flex-wrap gap-2 justify-center">
              {['all', 'residential', 'commercial', 'industrial', 'infrastructure'].map((cat) => (
                <Button
                  key={cat}
                  variant={category === cat ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => handleCategoryChange(cat)}
                >
                  {cat === 'all' ? 'All Projects' : cat.charAt(0).toUpperCase() + cat.slice(1)}
                </Button>
              ))}
            </div>
          </div>
        </section>

        {/* Projects Grid */}
        <section className="py-8">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-semibold">
                {projectsData?.count || 0} {projectsData?.count === 1 ? 'Project' : 'Projects'} Available
              </h2>
            </div>

            {isLoading && (
              <div className="text-center py-12">
                <Loader2 className="w-8 h-8 animate-spin mx-auto mb-4" />
                <p className="text-muted-foreground">Loading projects...</p>
              </div>
            )}

            {error && (
              <div className="text-center py-12">
                <p className="text-destructive">Error loading projects. Please try again.</p>
              </div>
            )}

            {!isLoading && !error && projects.length === 0 && (
              <div className="text-center py-12">
                <p className="text-muted-foreground">No projects found matching your criteria.</p>
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {projects.map((project) => (
                <Card key={project.id} className="overflow-hidden hover:shadow-lg transition-shadow">
                  {project.featured_image && (
                    <div className="aspect-video relative overflow-hidden">
                      <img
                        src={project.featured_image}
                        alt={project.title}
                        className="w-full h-full object-cover"
                      />
                      {project.status && (
                        <Badge className="absolute top-2 right-2">
                          {project.status}
                        </Badge>
                      )}
                    </div>
                  )}
                  <CardHeader>
                    <div className="flex items-start justify-between gap-2">
                      <CardTitle className="text-lg">{project.title}</CardTitle>
                      {project.category && (
                        <Badge variant="outline" className="shrink-0">
                          {project.category}
                        </Badge>
                      )}
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {project.description && (
                      <p className="text-sm text-muted-foreground line-clamp-2">
                        {project.description}
                      </p>
                    )}
                    
                    <div className="space-y-2 text-sm">
                      {project.location && (
                        <div className="flex items-center gap-2 text-muted-foreground">
                          <MapPin className="w-4 h-4" />
                          <span>{project.location}</span>
                        </div>
                      )}
                      {project.start_date && (
                        <div className="flex items-center gap-2 text-muted-foreground">
                          <Calendar className="w-4 h-4" />
                          <span>Started: {new Date(project.start_date).toLocaleDateString()}</span>
                        </div>
                      )}
                    </div>

                    <div className="flex gap-2">
                      <Button 
                        variant="outline" 
                        size="sm" 
                        className="flex-1"
                        asChild
                      >
                        <Link to={`/account/projects/${project.id}`}>
                          View Details
                        </Link>
                      </Button>
                      <Button 
                        size="sm" 
                        className="flex-1"
                        onClick={() => handleRequestProject(project.id)}
                      >
                        Request Similar
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>

            {/* Pagination */}
            {projectsData && projectsData.count > 10 && (
              <div className="flex justify-center gap-2 mt-8">
                <Button
                  variant="outline"
                  disabled={!projectsData.previous}
                  onClick={() => {
                    const params = new URLSearchParams(searchParams);
                    params.set('page', String(page - 1));
                    setSearchParams(params);
                  }}
                >
                  Previous
                </Button>
                <span className="flex items-center px-4">
                  Page {page} of {Math.ceil(projectsData.count / 10)}
                </span>
                <Button
                  variant="outline"
                  disabled={!projectsData.next}
                  onClick={() => {
                    const params = new URLSearchParams(searchParams);
                    params.set('page', String(page + 1));
                    setSearchParams(params);
                  }}
                >
                  Next
                </Button>
              </div>
            )}
          </div>
        </section>
      </div>
    </Layout>
  );
};

export default ProjectsCatalog;
