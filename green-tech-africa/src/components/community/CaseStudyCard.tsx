import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { 
  MapPin, 
  Zap, 
  Droplets, 
  TrendingDown, 
  Leaf,
  ExternalLink,
  Calendar
} from 'lucide-react';
import { Link } from 'react-router-dom';

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

interface CaseStudyCardProps {
  caseStudy: CaseStudy;
  showFullDetails?: boolean;
}

export const CaseStudyCard: React.FC<CaseStudyCardProps> = ({ 
  caseStudy, 
  showFullDetails = false 
}) => {
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-GH', {
      style: 'currency',
      currency: 'GHS',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-GH', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  const getProjectTypeColor = (type: string) => {
    switch (type) {
      case 'residential': return 'bg-blue-100 text-blue-800';
      case 'commercial': return 'bg-purple-100 text-purple-800';
      case 'community': return 'bg-green-100 text-green-800';
      case 'institutional': return 'bg-orange-100 text-orange-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const primaryImage = caseStudy.images?.find(img => img.is_primary) || caseStudy.images?.[0];

  return (
    <Card className={`h-full ${caseStudy.featured ? 'ring-2 ring-green-500' : ''}`}>
      {primaryImage && (
        <div className="relative h-48 overflow-hidden rounded-t-lg">
          <img
            src={primaryImage.image}
            alt={primaryImage.caption || caseStudy.title}
            className="w-full h-full object-cover"
          />
          {caseStudy.featured && (
            <Badge className="absolute top-2 right-2 bg-green-500">
              Featured
            </Badge>
          )}
        </div>
      )}
      
      <CardHeader>
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <CardTitle className="text-lg mb-2">{caseStudy.title}</CardTitle>
            <div className="flex items-center gap-2 text-sm text-gray-600 mb-2">
              <MapPin className="h-4 w-4" />
              <span>{caseStudy.location}</span>
              <Badge className={getProjectTypeColor(caseStudy.project_type)}>
                {caseStudy.project_type}
              </Badge>
            </div>
          </div>
        </div>
        <CardDescription className="line-clamp-2">
          {caseStudy.overview}
        </CardDescription>
      </CardHeader>

      <CardContent>
        {/* Impact Metrics */}
        <div className="grid grid-cols-2 gap-4 mb-4">
          <div className="flex items-center gap-2 p-2 bg-yellow-50 rounded-lg">
            <Zap className="h-4 w-4 text-yellow-600" />
            <div>
              <div className="text-sm font-semibold text-yellow-800">
                {caseStudy.energy_savings}%
              </div>
              <div className="text-xs text-yellow-600">Energy Saved</div>
            </div>
          </div>
          
          <div className="flex items-center gap-2 p-2 bg-blue-50 rounded-lg">
            <Droplets className="h-4 w-4 text-blue-600" />
            <div>
              <div className="text-sm font-semibold text-blue-800">
                {caseStudy.water_savings}%
              </div>
              <div className="text-xs text-blue-600">Water Saved</div>
            </div>
          </div>
          
          <div className="flex items-center gap-2 p-2 bg-green-50 rounded-lg">
            <TrendingDown className="h-4 w-4 text-green-600" />
            <div>
              <div className="text-sm font-semibold text-green-800">
                {formatCurrency(caseStudy.cost_savings)}
              </div>
              <div className="text-xs text-green-600">Annual Savings</div>
            </div>
          </div>
          
          <div className="flex items-center gap-2 p-2 bg-emerald-50 rounded-lg">
            <Leaf className="h-4 w-4 text-emerald-600" />
            <div>
              <div className="text-sm font-semibold text-emerald-800">
                {Math.round(caseStudy.co2_reduction)}kg
              </div>
              <div className="text-xs text-emerald-600">CO₂ Reduced</div>
            </div>
          </div>
        </div>

        {/* Date */}
        <div className="flex items-center gap-2 text-sm text-gray-500 mb-4">
          <Calendar className="h-4 w-4" />
          <span>Published {formatDate(caseStudy.created_at)}</span>
        </div>

        {/* Action Button */}
        <Button asChild className="w-full">
          <Link to={`/community/case-studies/${caseStudy.slug}`}>
            <ExternalLink className="h-4 w-4 mr-2" />
            View Full Case Study
          </Link>
        </Button>
      </CardContent>
    </Card>
  );
};