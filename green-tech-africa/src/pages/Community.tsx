import React, { useState } from 'react';
import Layout from '@/components/layout/Layout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { 
  Users, 
  BookOpen, 
  UserCheck, 
  Camera,
  Search,
  Filter,
  MapPin,
  Calendar,
  ExternalLink,
  Play,
  FileText,
  Image as ImageIcon
} from 'lucide-react';
import { CaseStudyCard } from '@/components/community/CaseStudyCard';
import { ExpertConsultationBooking } from '@/components/community/ExpertConsultationBooking';
import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';

interface CaseStudy {
  id: number;
  title: string;
  slug: string;
  location: string;
  project_type: string;
  overview: string;
  energy_savings: number;
  water_savings: number;
  cost_savings: number;
  co2_reduction: number;
  featured: boolean;
  created_at: string;
  images?: Array<{
    id: number;
    image: string;
    caption: string;
    is_primary: boolean;
  }>;
}

interface EducationalContent {
  id: number;
  title: string;
  slug: string;
  content_type: string;
  category: string;
  author?: {
    first_name: string;
    last_name: string;
  };
  featured_image?: string;
  summary: string;
  external_url?: string;
  duration_minutes?: number;
  published_date: string;
}

const Community: React.FC = () => {
  const [activeTab, setActiveTab] = useState('case-studies');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('');
  const [selectedProjectType, setSelectedProjectType] = useState<string>('');

  // Fetch case studies
  const { data: caseStudies, isLoading: caseStudiesLoading } = useQuery<CaseStudy[]>({
    queryKey: ['case-studies', searchTerm, selectedProjectType],
    queryFn: () => {
      let url = '/api/v1/community/case-studies/';
      const params = new URLSearchParams();
      if (searchTerm) params.append('search', searchTerm);
      if (selectedProjectType) params.append('project_type', selectedProjectType);
      if (params.toString()) url += `?${params.toString()}`;
      return api.get(url);
    },
  });

  // Fetch educational content
  const { data: educationalContent, isLoading: contentLoading } = useQuery<EducationalContent[]>({
    queryKey: ['educational-content', searchTerm, selectedCategory],
    queryFn: () => {
      let url = '/api/v1/community/educational-content/';
      const params = new URLSearchParams();
      if (searchTerm) params.append('search', searchTerm);
      if (selectedCategory) params.append('category', selectedCategory);
      if (params.toString()) url += `?${params.toString()}`;
      return api.get(url);
    },
  });

  const getContentTypeIcon = (type: string) => {
    switch (type) {
      case 'video': return <Play className="h-4 w-4" />;
      case 'infographic': return <ImageIcon className="h-4 w-4" />;
      case 'guide': return <BookOpen className="h-4 w-4" />;
      default: return <FileText className="h-4 w-4" />;
    }
  };

  const getContentTypeColor = (type: string) => {
    const colors: Record<string, string> = {
      article: 'bg-blue-100 text-blue-800',
      guide: 'bg-green-100 text-green-800',
      video: 'bg-red-100 text-red-800',
      infographic: 'bg-purple-100 text-purple-800',
      case_study: 'bg-orange-100 text-orange-800',
    };
    return colors[type] || 'bg-gray-100 text-gray-800';
  };

  const getCategoryColor = (category: string) => {
    const colors: Record<string, string> = {
      design: 'bg-pink-100 text-pink-800',
      materials: 'bg-brown-100 text-brown-800',
      energy: 'bg-yellow-100 text-yellow-800',
      water: 'bg-cyan-100 text-cyan-800',
      waste: 'bg-gray-100 text-gray-800',
      policy: 'bg-indigo-100 text-indigo-800',
      financing: 'bg-emerald-100 text-emerald-800',
    };
    return colors[category] || 'bg-gray-100 text-gray-800';
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-GH', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  return (
    <Layout>
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-4">
            Community & Knowledge Hub
          </h1>
          <p className="text-lg text-gray-600 max-w-3xl mx-auto">
            Learn from successful projects, access educational resources, and connect with 
            sustainability experts across Ghana.
          </p>
        </div>

        {/* Main Content */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="case-studies" className="flex items-center gap-2">
              <Camera className="h-4 w-4" />
              <span className="hidden sm:inline">Case Studies</span>
              <span className="sm:hidden">Cases</span>
            </TabsTrigger>
            <TabsTrigger value="education" className="flex items-center gap-2">
              <BookOpen className="h-4 w-4" />
              <span className="hidden sm:inline">Education</span>
              <span className="sm:hidden">Learn</span>
            </TabsTrigger>
            <TabsTrigger value="experts" className="flex items-center gap-2">
              <UserCheck className="h-4 w-4" />
              <span className="hidden sm:inline">Expert Consultation</span>
              <span className="sm:hidden">Experts</span>
            </TabsTrigger>
          </TabsList>

          {/* Case Studies Tab */}
          <TabsContent value="case-studies" className="space-y-6">
            <div className="text-center mb-6">
              <h2 className="text-2xl font-bold mb-2">Project Case Studies</h2>
              <p className="text-gray-600">
                Explore real-world examples of successful eco-friendly projects across Ghana
              </p>
            </div>

            {/* Search and Filters */}
            <Card>
              <CardContent className="p-4">
                <div className="flex flex-col sm:flex-row gap-4">
                  <div className="flex-1">
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                      <Input
                        placeholder="Search case studies..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="pl-10"
                      />
                    </div>
                  </div>
                  <Select value={selectedProjectType} onValueChange={setSelectedProjectType}>
                    <SelectTrigger className="w-full sm:w-48">
                      <SelectValue placeholder="Project Type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="">All Types</SelectItem>
                      <SelectItem value="residential">Residential</SelectItem>
                      <SelectItem value="commercial">Commercial</SelectItem>
                      <SelectItem value="community">Community</SelectItem>
                      <SelectItem value="institutional">Institutional</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </CardContent>
            </Card>

            {/* Case Studies Grid */}
            {caseStudiesLoading ? (
              <div className="text-center py-8">Loading case studies...</div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {caseStudies?.map((caseStudy) => (
                  <CaseStudyCard key={caseStudy.id} caseStudy={caseStudy} />
                ))}
              </div>
            )}

            {(!caseStudies || caseStudies.length === 0) && !caseStudiesLoading && (
              <Card>
                <CardContent className="text-center py-8">
                  <Camera className="h-12 w-12 mx-auto mb-4 text-gray-400" />
                  <h3 className="text-lg font-semibold mb-2">No Case Studies Found</h3>
                  <p className="text-gray-600">
                    {searchTerm || selectedProjectType 
                      ? 'Try adjusting your search criteria.'
                      : 'Case studies will be added soon.'
                    }
                  </p>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          {/* Educational Content Tab */}
          <TabsContent value="education" className="space-y-6">
            <div className="text-center mb-6">
              <h2 className="text-2xl font-bold mb-2">Educational Resources</h2>
              <p className="text-gray-600">
                Access guides, articles, and resources about sustainable building practices in Ghana
              </p>
            </div>

            {/* Search and Filters */}
            <Card>
              <CardContent className="p-4">
                <div className="flex flex-col sm:flex-row gap-4">
                  <div className="flex-1">
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                      <Input
                        placeholder="Search educational content..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="pl-10"
                      />
                    </div>
                  </div>
                  <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                    <SelectTrigger className="w-full sm:w-48">
                      <SelectValue placeholder="Category" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="">All Categories</SelectItem>
                      <SelectItem value="design">Sustainable Design</SelectItem>
                      <SelectItem value="materials">Eco-friendly Materials</SelectItem>
                      <SelectItem value="energy">Energy Efficiency</SelectItem>
                      <SelectItem value="water">Water Conservation</SelectItem>
                      <SelectItem value="waste">Waste Management</SelectItem>
                      <SelectItem value="policy">Ghana Building Codes</SelectItem>
                      <SelectItem value="financing">Green Financing</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </CardContent>
            </Card>

            {/* Educational Content Grid */}
            {contentLoading ? (
              <div className="text-center py-8">Loading educational content...</div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {educationalContent?.map((content) => (
                  <Card key={content.id} className="h-full">
                    {content.featured_image && (
                      <div className="h-48 overflow-hidden rounded-t-lg">
                        <img
                          src={content.featured_image}
                          alt={content.title}
                          className="w-full h-full object-cover"
                        />
                      </div>
                    )}
                    <CardHeader>
                      <div className="flex items-start justify-between mb-2">
                        <CardTitle className="text-lg line-clamp-2">{content.title}</CardTitle>
                        <div className="flex gap-1">
                          <Badge className={getContentTypeColor(content.content_type)}>
                            {getContentTypeIcon(content.content_type)}
                            <span className="ml-1">{content.content_type}</span>
                          </Badge>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 mb-2">
                        <Badge className={getCategoryColor(content.category)}>
                          {content.category.replace('_', ' ')}
                        </Badge>
                        {content.duration_minutes && (
                          <Badge variant="outline">
                            {content.duration_minutes} min
                          </Badge>
                        )}
                      </div>
                      <CardDescription className="line-clamp-3">
                        {content.summary}
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-3">
                        {content.author && (
                          <div className="text-sm text-gray-600">
                            By {content.author.first_name} {content.author.last_name}
                          </div>
                        )}
                        <div className="flex items-center gap-2 text-sm text-gray-500">
                          <Calendar className="h-4 w-4" />
                          <span>{formatDate(content.published_date)}</span>
                        </div>
                        <Button asChild className="w-full">
                          {content.external_url ? (
                            <a 
                              href={content.external_url} 
                              target="_blank" 
                              rel="noopener noreferrer"
                            >
                              <ExternalLink className="h-4 w-4 mr-2" />
                              View Resource
                            </a>
                          ) : (
                            <a href={`/community/education/${content.slug}`}>
                              <BookOpen className="h-4 w-4 mr-2" />
                              Read More
                            </a>
                          )}
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}

            {(!educationalContent || educationalContent.length === 0) && !contentLoading && (
              <Card>
                <CardContent className="text-center py-8">
                  <BookOpen className="h-12 w-12 mx-auto mb-4 text-gray-400" />
                  <h3 className="text-lg font-semibold mb-2">No Educational Content Found</h3>
                  <p className="text-gray-600">
                    {searchTerm || selectedCategory 
                      ? 'Try adjusting your search criteria.'
                      : 'Educational resources will be added soon.'
                    }
                  </p>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          {/* Expert Consultation Tab */}
          <TabsContent value="experts" className="space-y-6">
            <div className="text-center mb-6">
              <h2 className="text-2xl font-bold mb-2">Expert Consultation</h2>
              <p className="text-gray-600">
                Book consultations with Ghana-based sustainability experts and professionals
              </p>
            </div>

            <ExpertConsultationBooking />
          </TabsContent>
        </Tabs>
      </div>
    </Layout>
  );
};

export default Community;