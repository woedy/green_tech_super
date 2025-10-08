export interface ConstructionWizardStep {
  id: string;
  title: string;
  description: string;
  isComplete: boolean;
  isActive: boolean;
}

export interface ConstructionFormData {
  // Step 1: Basic Information
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  projectTitle: string;
  
  // Step 2: Location & Budget
  location: string;
  region: string;
  budgetRange: string;
  timeline: string;
  
  // Step 3: Eco Features Selection
  selectedFeatures: string[];
  
  // Step 4: Customizations
  customizations: string;
  specialRequirements: string;
  
  // Calculated values
  totalCost: number;
  sustainabilityScore: number;
  estimatedSavings: {
    monthly: number;
    annual: number;
  };
}

export interface CostBreakdown {
  baseConstruction: number;
  ecoFeatures: number;
  regionalAdjustment: number;
  total: number;
  currency: string;
}

export interface SustainabilityMetrics {
  totalScore: number;
  categoryScores: {
    energy: number;
    water: number;
    materials: number;
    waste: number;
    smart: number;
  };
  estimatedSavings: {
    monthly: number;
    annual: number;
    breakdown: Array<{
      feature: string;
      monthly: number;
      annual: number;
    }>;
  };
}

export interface SpecificationDocument {
  projectTitle: string;
  customerInfo: {
    name: string;
    email: string;
    phone: string;
  };
  location: {
    address: string;
    region: string;
  };
  budget: {
    range: string;
    estimatedCost: number;
    currency: string;
  };
  timeline: string;
  ecoFeatures: Array<{
    name: string;
    category: string;
    description: string;
    cost: number;
    sustainabilityPoints: number;
  }>;
  customizations: string;
  sustainabilityMetrics: SustainabilityMetrics;
  costBreakdown: CostBreakdown;
  generatedAt: string;
}