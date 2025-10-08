export interface EcoFeature {
  id: string;
  name: string;
  category: 'energy' | 'water' | 'materials' | 'waste' | 'smart';
  description: string;
  baseCost: number;
  sustainabilityPoints: number;
  availableInGhana: boolean;
  regionalMultiplier: Record<string, number>;
  estimatedSavings?: {
    monthly: number;
    annual: number;
    description: string;
  };
}

export interface GhanaRegion {
  id: string;
  name: string;
  code: string;
  majorCities: string[];
  costMultiplier: number;
  description: string;
}

export const GHANA_REGIONS: GhanaRegion[] = [
  {
    id: 'greater-accra',
    name: 'Greater Accra',
    code: 'GA',
    majorCities: ['Accra', 'Tema', 'Kasoa', 'Madina'],
    costMultiplier: 1.2,
    description: 'Capital region with highest construction costs but best material availability'
  },
  {
    id: 'ashanti',
    name: 'Ashanti',
    code: 'AS',
    majorCities: ['Kumasi', 'Obuasi', 'Ejisu', 'Mampong'],
    costMultiplier: 1.0,
    description: 'Central region with good access to materials and skilled labor'
  },
  {
    id: 'northern',
    name: 'Northern',
    code: 'NR',
    majorCities: ['Tamale', 'Yendi', 'Savelugu'],
    costMultiplier: 0.8,
    description: 'Lower costs but limited material availability, transport costs may apply'
  },
  {
    id: 'western',
    name: 'Western',
    code: 'WR',
    majorCities: ['Takoradi', 'Tarkwa', 'Cape Coast'],
    costMultiplier: 0.9,
    description: 'Coastal region with port access for imported materials'
  }
];

export const ECO_FEATURES: EcoFeature[] = [
  // Energy Features
  {
    id: 'solar-panels',
    name: 'Solar Panel System',
    category: 'energy',
    description: 'Complete rooftop solar installation with inverter and battery backup',
    baseCost: 8000,
    sustainabilityPoints: 25,
    availableInGhana: true,
    regionalMultiplier: {
      'greater-accra': 1.0,
      'ashanti': 1.1,
      'northern': 1.3,
      'western': 1.2
    },
    estimatedSavings: {
      monthly: 150,
      annual: 1800,
      description: 'Electricity bill reduction'
    }
  },
  {
    id: 'battery-storage',
    name: 'Battery Storage System',
    category: 'energy',
    description: 'Lithium-ion battery system for energy storage and backup power',
    baseCost: 4500,
    sustainabilityPoints: 15,
    availableInGhana: true,
    regionalMultiplier: {
      'greater-accra': 1.0,
      'ashanti': 1.2,
      'northern': 1.4,
      'western': 1.3
    },
    estimatedSavings: {
      monthly: 80,
      annual: 960,
      description: 'Reduced grid dependency'
    }
  },
  {
    id: 'led-lighting',
    name: 'LED Lighting Package',
    category: 'energy',
    description: 'Energy-efficient LED lighting throughout the building',
    baseCost: 1200,
    sustainabilityPoints: 8,
    availableInGhana: true,
    regionalMultiplier: {
      'greater-accra': 1.0,
      'ashanti': 1.0,
      'northern': 1.1,
      'western': 1.0
    },
    estimatedSavings: {
      monthly: 25,
      annual: 300,
      description: 'Lighting electricity savings'
    }
  },
  {
    id: 'smart-grid',
    name: 'Smart Grid Integration',
    category: 'energy',
    description: 'Smart meter and grid-tie system for energy management',
    baseCost: 2800,
    sustainabilityPoints: 12,
    availableInGhana: true,
    regionalMultiplier: {
      'greater-accra': 1.0,
      'ashanti': 1.3,
      'northern': 1.5,
      'western': 1.4
    }
  },

  // Water Features
  {
    id: 'rainwater-harvesting',
    name: 'Rainwater Harvesting System',
    category: 'water',
    description: 'Complete rainwater collection, filtration, and storage system',
    baseCost: 3500,
    sustainabilityPoints: 20,
    availableInGhana: true,
    regionalMultiplier: {
      'greater-accra': 1.0,
      'ashanti': 0.9,
      'northern': 1.2,
      'western': 0.8
    },
    estimatedSavings: {
      monthly: 60,
      annual: 720,
      description: 'Water bill reduction'
    }
  },
  {
    id: 'greywater-recycling',
    name: 'Greywater Recycling System',
    category: 'water',
    description: 'System to treat and reuse water from sinks and showers',
    baseCost: 2800,
    sustainabilityPoints: 18,
    availableInGhana: true,
    regionalMultiplier: {
      'greater-accra': 1.0,
      'ashanti': 1.1,
      'northern': 1.3,
      'western': 1.0
    },
    estimatedSavings: {
      monthly: 40,
      annual: 480,
      description: 'Water usage reduction'
    }
  },
  {
    id: 'water-efficient-fixtures',
    name: 'Water-Efficient Fixtures',
    category: 'water',
    description: 'Low-flow toilets, faucets, and showerheads',
    baseCost: 1500,
    sustainabilityPoints: 10,
    availableInGhana: true,
    regionalMultiplier: {
      'greater-accra': 1.0,
      'ashanti': 1.0,
      'northern': 1.2,
      'western': 1.0
    },
    estimatedSavings: {
      monthly: 30,
      annual: 360,
      description: 'Water consumption savings'
    }
  },

  // Materials
  {
    id: 'eco-cement',
    name: 'Eco-Friendly Cement',
    category: 'materials',
    description: 'Low-carbon cement with recycled content',
    baseCost: 2200,
    sustainabilityPoints: 15,
    availableInGhana: true,
    regionalMultiplier: {
      'greater-accra': 1.0,
      'ashanti': 1.1,
      'northern': 1.4,
      'western': 1.2
    }
  },
  {
    id: 'recycled-steel',
    name: 'Recycled Steel Framework',
    category: 'materials',
    description: 'Structural steel made from recycled materials',
    baseCost: 5500,
    sustainabilityPoints: 22,
    availableInGhana: true,
    regionalMultiplier: {
      'greater-accra': 1.0,
      'ashanti': 1.2,
      'northern': 1.5,
      'western': 1.1
    }
  },
  {
    id: 'local-timber',
    name: 'Locally Sourced Timber',
    category: 'materials',
    description: 'Sustainably harvested local wood for construction',
    baseCost: 3200,
    sustainabilityPoints: 18,
    availableInGhana: true,
    regionalMultiplier: {
      'greater-accra': 1.2,
      'ashanti': 0.8,
      'northern': 1.0,
      'western': 0.9
    }
  },
  {
    id: 'compressed-earth-blocks',
    name: 'Compressed Earth Blocks',
    category: 'materials',
    description: 'Sustainable building blocks made from compressed earth',
    baseCost: 1800,
    sustainabilityPoints: 20,
    availableInGhana: true,
    regionalMultiplier: {
      'greater-accra': 1.3,
      'ashanti': 1.0,
      'northern': 0.8,
      'western': 1.1
    }
  },

  // Waste Management
  {
    id: 'waste-separation',
    name: 'Waste Separation System',
    category: 'waste',
    description: 'Built-in waste sorting and composting facilities',
    baseCost: 1200,
    sustainabilityPoints: 12,
    availableInGhana: true,
    regionalMultiplier: {
      'greater-accra': 1.0,
      'ashanti': 1.0,
      'northern': 1.1,
      'western': 1.0
    }
  },
  {
    id: 'green-roof',
    name: 'Green Roof System',
    category: 'waste',
    description: 'Living roof with plants for insulation and air quality',
    baseCost: 4200,
    sustainabilityPoints: 25,
    availableInGhana: true,
    regionalMultiplier: {
      'greater-accra': 1.0,
      'ashanti': 1.1,
      'northern': 1.3,
      'western': 1.0
    },
    estimatedSavings: {
      monthly: 45,
      annual: 540,
      description: 'Cooling cost reduction'
    }
  },
  {
    id: 'air-quality-sensors',
    name: 'Air Quality Monitoring',
    category: 'waste',
    description: 'Smart sensors for indoor air quality monitoring',
    baseCost: 800,
    sustainabilityPoints: 8,
    availableInGhana: true,
    regionalMultiplier: {
      'greater-accra': 1.0,
      'ashanti': 1.2,
      'northern': 1.4,
      'western': 1.3
    }
  },

  // Smart Technology
  {
    id: 'iot-energy-meters',
    name: 'IoT Energy Meters',
    category: 'smart',
    description: 'Smart meters for real-time energy monitoring',
    baseCost: 1500,
    sustainabilityPoints: 10,
    availableInGhana: true,
    regionalMultiplier: {
      'greater-accra': 1.0,
      'ashanti': 1.2,
      'northern': 1.4,
      'western': 1.3
    }
  },
  {
    id: 'smart-thermostats',
    name: 'Smart Climate Control',
    category: 'smart',
    description: 'Intelligent HVAC control system',
    baseCost: 2200,
    sustainabilityPoints: 15,
    availableInGhana: true,
    regionalMultiplier: {
      'greater-accra': 1.0,
      'ashanti': 1.1,
      'northern': 1.3,
      'western': 1.2
    },
    estimatedSavings: {
      monthly: 70,
      annual: 840,
      description: 'HVAC efficiency savings'
    }
  },
  {
    id: 'lighting-automation',
    name: 'Smart Lighting System',
    category: 'smart',
    description: 'Automated lighting with motion sensors and scheduling',
    baseCost: 1800,
    sustainabilityPoints: 12,
    availableInGhana: true,
    regionalMultiplier: {
      'greater-accra': 1.0,
      'ashanti': 1.1,
      'northern': 1.3,
      'western': 1.2
    },
    estimatedSavings: {
      monthly: 35,
      annual: 420,
      description: 'Automated lighting savings'
    }
  }
];

export interface ConstructionRequest {
  id?: string;
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  projectTitle: string;
  location: string;
  region: string;
  budgetRange: string;
  timeline: string;
  selectedFeatures: string[];
  customizations: string;
  totalCost: number;
  sustainabilityScore: number;
  createdAt?: string;
}

export const BUDGET_RANGES = [
  { value: '50000-100000', label: 'GHS 50,000 - 100,000', min: 50000, max: 100000 },
  { value: '100000-200000', label: 'GHS 100,000 - 200,000', min: 100000, max: 200000 },
  { value: '200000-350000', label: 'GHS 200,000 - 350,000', min: 200000, max: 350000 },
  { value: '350000-500000', label: 'GHS 350,000 - 500,000', min: 350000, max: 500000 },
  { value: '500000+', label: 'GHS 500,000+', min: 500000, max: 1000000 }
];

export const TIMELINE_OPTIONS = [
  { value: '3-6-months', label: '3-6 months' },
  { value: '6-12-months', label: '6-12 months' },
  { value: '1-2-years', label: '1-2 years' },
  { value: 'flexible', label: 'Flexible timeline' }
];