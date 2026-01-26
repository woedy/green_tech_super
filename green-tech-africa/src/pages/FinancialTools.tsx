import React, { useState } from 'react';
import Layout from '@/components/layout/Layout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { 
  Calculator, 
  TrendingUp, 
  DollarSign, 
  Building2,
  Zap,
  Droplets,
  Leaf,
  Award,
  ExternalLink,
  Phone,
  Mail
} from 'lucide-react';
import { FinancingCalculator } from '@/components/financial/FinancingCalculator';
import { CostSavingsDisplay } from '@/components/financial/CostSavingsDisplay';
import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';

interface GovernmentIncentive {
  id: number;
  name: string;
  incentive_type: string;
  description: string;
  amount: string;
  is_percentage: boolean;
  application_url?: string;
  documentation_required?: string;
  start_date: string;
  end_date?: string;
}

interface BankPartner {
  id: number;
  name: string;
  description: string;
  contact_info: {
    phone?: string;
    email?: string;
    website?: string;
  };
  specialties: string[];
}

// Mock bank partners data (would come from API in real implementation)
const BANK_PARTNERS: BankPartner[] = [
  {
    id: 1,
    name: 'Ghana Commercial Bank',
    description: 'Leading provider of green financing solutions in Ghana with special rates for eco-friendly properties.',
    contact_info: {
      phone: '+233 302 664910',
      email: 'greenfinance@gcb.com.gh',
      website: 'https://gcb.com.gh',
    },
    specialties: ['Solar Financing', 'Green Mortgages', 'Energy Efficiency Loans'],
  },
  {
    id: 2,
    name: 'Ecobank Ghana',
    description: 'Sustainable banking solutions with competitive rates for renewable energy projects.',
    contact_info: {
      phone: '+233 302 681681',
      email: 'sustainability@ecobank.com',
      website: 'https://ecobank.com',
    },
    specialties: ['Renewable Energy Loans', 'Green Building Finance', 'SME Green Loans'],
  },
  {
    id: 3,
    name: 'Stanbic Bank Ghana',
    description: 'Comprehensive green financing packages for residential and commercial properties.',
    contact_info: {
      phone: '+233 302 610610',
      email: 'greenbanking@stanbic.com.gh',
      website: 'https://stanbic.com.gh',
    },
    specialties: ['Green Mortgages', 'Solar Panel Financing', 'Water System Loans'],
  },
];

const FinancialTools: React.FC = () => {
  const [activeTab, setActiveTab] = useState('calculator');

  // Fetch government incentives
  const { data: incentives, isLoading: incentivesLoading } = useQuery<GovernmentIncentive[]>({
    queryKey: ['government-incentives'],
    queryFn: async () => {
      const response = await api.get('/api/v1/finances/government-incentives/');
      // Handle different response structures
      if (Array.isArray(response)) {
        return response;
      } else if (response && Array.isArray(response.results)) {
        return response.results;
      } else if (response && Array.isArray(response.data)) {
        return response.data;
      } else {
        return [];
      }
    },
  });

  const getIncentiveTypeColor = (type: string) => {
    const colors: Record<string, string> = {
      tax_credit: 'bg-blue-100 text-blue-800',
      grant: 'bg-green-100 text-green-800',
      rebate: 'bg-purple-100 text-purple-800',
      loan: 'bg-orange-100 text-orange-800',
      other: 'bg-gray-100 text-gray-800',
    };
    return colors[type] || 'bg-gray-100 text-gray-800';
  };

  const formatCurrency = (value: string, isPercentage: boolean) => {
    if (isPercentage) {
      return `${(parseFloat(value) * 100).toFixed(1)}%`;
    }
    return new Intl.NumberFormat('en-GH', {
      style: 'currency',
      currency: 'GHS',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(parseFloat(value));
  };

  return (
    <Layout>
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-4">
            Financial Tools & Resources
          </h1>
          <p className="text-lg text-gray-600 max-w-3xl mx-auto">
            Explore financing options, calculate costs and savings, and discover government incentives 
            for your eco-friendly property investments in Ghana.
          </p>
        </div>

        {/* Main Content */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="calculator" className="flex items-center gap-2">
              <Calculator className="h-4 w-4" />
              <span className="hidden sm:inline">Financing Calculator</span>
              <span className="sm:hidden">Calculator</span>
            </TabsTrigger>
            <TabsTrigger value="savings" className="flex items-center gap-2">
              <TrendingUp className="h-4 w-4" />
              <span className="hidden sm:inline">Cost Savings</span>
              <span className="sm:hidden">Savings</span>
            </TabsTrigger>
            <TabsTrigger value="incentives" className="flex items-center gap-2">
              <Award className="h-4 w-4" />
              <span className="hidden sm:inline">Gov. Incentives</span>
              <span className="sm:hidden">Incentives</span>
            </TabsTrigger>
            <TabsTrigger value="partners" className="flex items-center gap-2">
              <Building2 className="h-4 w-4" />
              <span className="hidden sm:inline">Bank Partners</span>
              <span className="sm:hidden">Banks</span>
            </TabsTrigger>
          </TabsList>

          {/* Financing Calculator Tab */}
          <TabsContent value="calculator" className="space-y-6">
            <div className="text-center mb-6">
              <h2 className="text-2xl font-bold mb-2">Financing Calculator</h2>
              <p className="text-gray-600">
                Calculate monthly payments and total costs for your eco-friendly property financing
              </p>
            </div>
            <FinancingCalculator />
          </TabsContent>

          {/* Cost Savings Tab */}
          <TabsContent value="savings" className="space-y-6">
            <div className="text-center mb-6">
              <h2 className="text-2xl font-bold mb-2">Cost Savings & ROI Calculator</h2>
              <p className="text-gray-600">
                Analyze the return on investment for eco-friendly features and calculate long-term savings
              </p>
            </div>
            <CostSavingsDisplay />
          </TabsContent>

          {/* Government Incentives Tab */}
          <TabsContent value="incentives" className="space-y-6">
            <div className="text-center mb-6">
              <h2 className="text-2xl font-bold mb-2">Government Incentives</h2>
              <p className="text-gray-600">
                Discover available government programs and incentives for sustainable building in Ghana
              </p>
            </div>

            {incentivesLoading ? (
              <div className="text-center py-8">Loading incentives...</div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {incentives?.map((incentive) => (
                  <Card key={incentive.id} className="h-full">
                    <CardHeader>
                      <div className="flex items-start justify-between mb-2">
                        <CardTitle className="text-lg">{incentive.name}</CardTitle>
                        <Badge className={getIncentiveTypeColor(incentive.incentive_type)}>
                          {incentive.incentive_type.replace('_', ' ')}
                        </Badge>
                      </div>
                      <CardDescription>{incentive.description}</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-4">
                        <div className="text-center p-4 bg-green-50 rounded-lg">
                          <DollarSign className="h-6 w-6 mx-auto mb-2 text-green-600" />
                          <div className="text-2xl font-bold text-green-600">
                            {formatCurrency(incentive.amount, incentive.is_percentage)}
                          </div>
                          <div className="text-sm text-gray-600">
                            {incentive.is_percentage ? 'of qualifying amount' : 'fixed amount'}
                          </div>
                        </div>

                        {incentive.documentation_required && (
                          <div className="text-sm">
                            <strong>Required Documents:</strong>
                            <p className="text-gray-600 mt-1">{incentive.documentation_required}</p>
                          </div>
                        )}

                        <div className="text-sm text-gray-500">
                          <strong>Valid:</strong> {new Date(incentive.start_date).toLocaleDateString()} 
                          {incentive.end_date && ` - ${new Date(incentive.end_date).toLocaleDateString()}`}
                        </div>

                        {incentive.application_url && (
                          <Button asChild className="w-full">
                            <a 
                              href={incentive.application_url} 
                              target="_blank" 
                              rel="noopener noreferrer"
                            >
                              <ExternalLink className="h-4 w-4 mr-2" />
                              Apply Now
                            </a>
                          </Button>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}

            {(!incentives || incentives.length === 0) && !incentivesLoading && (
              <Card>
                <CardContent className="text-center py-8">
                  <Award className="h-12 w-12 mx-auto mb-4 text-gray-400" />
                  <h3 className="text-lg font-semibold mb-2">No Active Incentives</h3>
                  <p className="text-gray-600">
                    There are currently no active government incentives available. 
                    Check back later for new programs.
                  </p>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          {/* Bank Partners Tab */}
          <TabsContent value="partners" className="space-y-6">
            <div className="text-center mb-6">
              <h2 className="text-2xl font-bold mb-2">Banking Partners</h2>
              <p className="text-gray-600">
                Connect with our trusted banking partners for green financing solutions
              </p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {BANK_PARTNERS.map((bank) => (
                <Card key={bank.id} className="h-full">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Building2 className="h-5 w-5" />
                      {bank.name}
                    </CardTitle>
                    <CardDescription>{bank.description}</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {/* Specialties */}
                      <div>
                        <h4 className="font-semibold mb-2">Specialties:</h4>
                        <div className="flex flex-wrap gap-2">
                          {bank.specialties.map((specialty, index) => (
                            <Badge key={index} variant="secondary">
                              {specialty}
                            </Badge>
                          ))}
                        </div>
                      </div>

                      {/* Contact Information */}
                      <div className="space-y-2">
                        <h4 className="font-semibold">Contact Information:</h4>
                        {bank.contact_info.phone && (
                          <div className="flex items-center gap-2 text-sm">
                            <Phone className="h-4 w-4 text-gray-500" />
                            <a 
                              href={`tel:${bank.contact_info.phone}`}
                              className="text-blue-600 hover:underline"
                            >
                              {bank.contact_info.phone}
                            </a>
                          </div>
                        )}
                        {bank.contact_info.email && (
                          <div className="flex items-center gap-2 text-sm">
                            <Mail className="h-4 w-4 text-gray-500" />
                            <a 
                              href={`mailto:${bank.contact_info.email}`}
                              className="text-blue-600 hover:underline"
                            >
                              {bank.contact_info.email}
                            </a>
                          </div>
                        )}
                        {bank.contact_info.website && (
                          <div className="flex items-center gap-2 text-sm">
                            <ExternalLink className="h-4 w-4 text-gray-500" />
                            <a 
                              href={bank.contact_info.website}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-blue-600 hover:underline"
                            >
                              Visit Website
                            </a>
                          </div>
                        )}
                      </div>

                      <Button className="w-full">
                        Contact for Green Financing
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </Layout>
  );
};

export default FinancialTools;